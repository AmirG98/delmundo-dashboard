import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

/**
 * Middleware that ensures user has an organization
 * For client_user: uses their assigned organization
 * For admin: can impersonate organization (via selectedOrgId in input)
 */
export const organizationProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next, rawInput } = opts;

    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }

    let organizationId: number | null = null;

    // Admin can select organization
    if (ctx.user.role === 'admin') {
      // Check if input has selectedOrgId
      const input = rawInput as any;
      if (input && typeof input === 'object' && 'selectedOrgId' in input) {
        organizationId = input.selectedOrgId;
      }
    } else {
      // Client user must have an organization
      if (!ctx.user.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User does not belong to any organization"
        });
      }
      organizationId = ctx.user.organizationId;
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
        organizationId,
      },
    });
  }),
);
