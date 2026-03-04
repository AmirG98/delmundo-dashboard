import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  value?: string;
  options: Record<string, unknown>;
};

function createPublicContext(cookieHeader?: string): { ctx: TrpcContext; cookies: CookieCall[] } {
  const cookies: CookieCall[] = [];

  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {
        cookie: cookieHeader || "",
      },
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        cookies.push({ name, value, options });
      },
      clearCookie: (name: string, options: Record<string, unknown>) => {
        cookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, cookies };
}

describe("Password Authentication", () => {
  describe("passwordAuth.check", () => {
    it("returns authenticated: false when no cookie is present", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.passwordAuth.check();

      expect(result.authenticated).toBe(false);
    });

    it("returns authenticated: true when valid cookie is present", async () => {
      const { ctx } = createPublicContext("dashboard_access=authenticated");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.passwordAuth.check();

      expect(result.authenticated).toBe(true);
    });
  });

  describe("passwordAuth.login", () => {
    it("sets cookie and returns success with correct password", async () => {
      const { ctx, cookies } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.passwordAuth.login({ password: "lemontech25x" });

      expect(result.success).toBe(true);
      expect(cookies).toHaveLength(1);
      expect(cookies[0]?.name).toBe("dashboard_access");
      expect(cookies[0]?.value).toBe("authenticated");
    });

    it("throws error with incorrect password", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.passwordAuth.login({ password: "wrongpassword" })
      ).rejects.toThrow("Contraseña incorrecta");
    });

    it("throws error with empty password", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.passwordAuth.login({ password: "" })
      ).rejects.toThrow();
    });
  });

  describe("passwordAuth.logout", () => {
    it("clears the cookie and returns success", async () => {
      const { ctx, cookies } = createPublicContext("dashboard_access=authenticated");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.passwordAuth.logout();

      expect(result.success).toBe(true);
      expect(cookies).toHaveLength(1);
      expect(cookies[0]?.name).toBe("dashboard_access");
      expect(cookies[0]?.options).toMatchObject({ maxAge: -1 });
    });
  });
});
