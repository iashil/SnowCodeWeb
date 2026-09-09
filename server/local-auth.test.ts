import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { authenticateLocalAdmin, createLocalAdminSession, LOCAL_ADMIN_COOKIE } from "./localAuth";

function authContext() {
  const cookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
  const ctx: TrpcContext = { user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { cookie: (name: string, value: string, options: Record<string, unknown>) => cookies.push({ name, value, options }), clearCookie: () => undefined } as TrpcContext["res"] };
  return { ctx, cookies };
}

describe("local admin authentication", () => {
  it("accepts the configured credential when supplied for verification", async () => {
    const password = process.env.LOCAL_ADMIN_PASSWORD;
    if (!password) return;
    const user = await authenticateLocalAdmin("Snowsteam@gmail.com", password);
    expect(user?.role).toBe("admin");
    const { ctx, cookies } = authContext();
    const result = await appRouter.createCaller(ctx).auth.localLogin({ email: "Snowsteam@gmail.com", password });
    expect(result.user.role).toBe("admin");
    expect(cookies[0]?.name).toBe(LOCAL_ADMIN_COOKIE);
  });

  it("creates a signed session token with an expiry payload", () => {
    expect(createLocalAdminSession().split(".")).toHaveLength(2);
  });

  it("rejects incorrect credentials", async () => {
    expect(await authenticateLocalAdmin("other-user", "invalid-password")).toBeNull();
    const { ctx } = authContext();
    await expect(appRouter.createCaller(ctx).auth.localLogin({ email: "Snowsteam@gmail.com", password: "invalid-password" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
