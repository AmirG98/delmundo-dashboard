import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getCurrentUser } from "../services/auth";
import cookie from "cookie";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // First try JWT authentication
  try {
    const cookies = cookie.parse(opts.req.headers.cookie || "");
    const authToken = cookies.auth_token;

    if (authToken) {
      user = await getCurrentUser(authToken) as User | null;
    }
  } catch (error) {
    console.error('[Context] JWT authentication failed:', error);
  }

  // Fallback to SDK authentication (for Manus compatibility)
  if (!user) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
