import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { nanoid } from 'nanoid';
import { ENV } from '../_core/env';
import {
  getUserByEmail,
  createUser,
  updateUser,
  getUserById,
  InsertUser
} from '../db';

const JWT_SECRET = new TextEncoder().encode(ENV.cookieSecret || 'default-secret-change-me');
const JWT_EXPIRY = '7d';
const SALT_ROUNDS = 10;

export interface JWTPayload {
  userId: number;
  email: string;
  role: 'admin' | 'client_user';
  organizationId?: number;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token
 */
export async function generateToken(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .setJti(nanoid())
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as JWTPayload;
  } catch (error) {
    console.error('[Auth] Token verification failed:', error);
    return null;
  }
}

/**
 * Register a new user
 */
export async function registerUser(data: {
  email: string;
  password: string;
  name: string;
  role?: 'admin' | 'client_user';
  organizationId?: number;
}): Promise<{ userId: number; token: string }> {
  // Check if user already exists
  const existingUser = await getUserByEmail(data.email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // Create user
  const userData: InsertUser = {
    email: data.email,
    name: data.name,
    hashedPassword,
    role: data.role || 'client_user',
    organizationId: data.organizationId,
    loginMethod: 'email',
  };

  const userId = await createUser(userData);

  // Generate token
  const token = await generateToken({
    userId,
    email: data.email,
    role: data.role || 'client_user',
    organizationId: data.organizationId,
  });

  return { userId, token };
}

/**
 * Login a user
 */
export async function loginUser(data: {
  email: string;
  password: string;
}): Promise<{ user: any; token: string } | null> {
  // Get user by email
  const user = await getUserByEmail(data.email);
  if (!user) {
    return null;
  }

  // Verify password
  if (!user.hashedPassword) {
    return null;
  }

  const isValid = await verifyPassword(data.password, user.hashedPassword);
  if (!isValid) {
    return null;
  }

  // Update last signed in
  await updateUser(user.id, { lastSignedIn: new Date() });

  // Generate token
  const token = await generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId || undefined,
  });

  // Remove password from response
  const { hashedPassword, resetToken, resetTokenExpiry, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
}

/**
 * Get current user from token
 */
export async function getCurrentUser(token: string) {
  const payload = await verifyToken(token);
  if (!payload) {
    return null;
  }

  const user = await getUserById(payload.userId);
  if (!user) {
    return null;
  }

  const { hashedPassword, resetToken, resetTokenExpiry, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Generate a password reset token
 */
export async function generateResetToken(email: string): Promise<string | null> {
  const user = await getUserByEmail(email);
  if (!user) {
    return null;
  }

  const resetToken = nanoid(32);
  const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

  await updateUser(user.id, { resetToken, resetTokenExpiry });

  return resetToken;
}

/**
 * Reset password using reset token
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<boolean> {
  const db = await import('../db').then(m => m.getDb());
  if (!db) return false;

  // Find user with this token
  const { users } = await import('../../drizzle/schema');
  const { eq, and, gt } = await import('drizzle-orm');

  const result = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.resetToken, token),
        gt(users.resetTokenExpiry, new Date())
      )
    )
    .limit(1);

  if (result.length === 0) {
    return false;
  }

  const user = result[0];

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update user
  await updateUser(user.id, {
    hashedPassword,
    resetToken: null,
    resetTokenExpiry: null,
  });

  return true;
}
