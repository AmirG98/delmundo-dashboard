import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { CONNECTIONS_COOKIE_NAME, CONNECTIONS_PASSWORD } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  value: string;
  options: Record<string, unknown>;
};

function createPublicContext(): { ctx: TrpcContext; setCookies: CookieCall[] } {
  const setCookies: CookieCall[] = [];

  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {
        cookie: "",
      },
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        setCookies.push({ name, value, options });
      },
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx, setCookies };
}

function createAuthenticatedContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {
        cookie: `${CONNECTIONS_COOKIE_NAME}=authenticated`,
      },
    } as TrpcContext["req"],
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Connections Password Authentication", () => {
  describe("connectionsAuth.check", () => {
    it("returns authenticated: false when no cookie is present", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.connectionsAuth.check();

      expect(result).toEqual({ authenticated: false });
    });

    it("returns authenticated: true when cookie is present", async () => {
      const { ctx } = createAuthenticatedContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.connectionsAuth.check();

      expect(result).toEqual({ authenticated: true });
    });
  });

  describe("connectionsAuth.login", () => {
    it("sets cookie and returns success with correct password", async () => {
      const { ctx, setCookies } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.connectionsAuth.login({ password: CONNECTIONS_PASSWORD });

      expect(result).toEqual({ success: true });
      expect(setCookies).toHaveLength(1);
      expect(setCookies[0]?.name).toBe(CONNECTIONS_COOKIE_NAME);
      expect(setCookies[0]?.value).toBe("authenticated");
    });

    it("throws UNAUTHORIZED error with incorrect password", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.connectionsAuth.login({ password: "wrong-password" })
      ).rejects.toThrow("Contraseña de administrador incorrecta");
    });

    it("throws UNAUTHORIZED error with empty password", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.connectionsAuth.login({ password: "" })
      ).rejects.toThrow("Contraseña de administrador incorrecta");
    });
  });
});
