import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type TestUser = NonNullable<TrpcContext["user"]>;

function contextFor(user: TestUser | null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("content access", () => {
  it("rejects project-library access for non-admin users", async () => {
    const user: TestUser = {
      id: 2,
      openId: "member-2",
      email: "member@example.com",
      name: "Member",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    await expect(appRouter.createCaller(contextFor(user)).projects.adminList()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("validates public contact messages before persistence", async () => {
    await expect(
      appRouter.createCaller(contextFor(null)).contacts.create({
        name: "A visitor",
        email: "not-an-email",
        message: "A message that is long enough",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
