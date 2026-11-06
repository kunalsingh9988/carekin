import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ signOut: vi.fn(), getUser: vi.fn(), remote: vi.fn() }));
vi.mock("../backend/config", () => ({ backendEnabled: true }));
vi.mock("../backend/browser", () => ({
  remote: mocks.remote,
  supabaseBrowser: () => ({ auth: { signOut: mocks.signOut, getUser: mocks.getUser } }),
}));
import { getCurrentUser, logout, refreshCurrentUser } from "./index";

const account = { id: "test-family", role: "family", phone: "", created_at: "2026-11-06" };
describe("backend session lifecycle", () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: account.id } } });
    mocks.remote.mockResolvedValue(account);
    mocks.signOut.mockResolvedValue({ error: null });
    await refreshCurrentUser();
  });
  it("loads the server-owned role for a verified user", () => {
    expect(getCurrentUser()).toEqual(account);
    expect(mocks.remote).toHaveBeenCalledWith("auth.me");
  });
  it("does not clear identity before sign-out completes", async () => {
    let resolve!: (value: { error: null }) => void;
    mocks.signOut.mockReturnValue(new Promise(done => { resolve = done; }));
    const result = logout();
    expect(getCurrentUser()).toEqual(account);
    resolve({ error: null });
    await result;
    expect(getCurrentUser()).toBeNull();
  });
  it("surfaces sign-out errors instead of pretending logout succeeded", async () => {
    mocks.signOut.mockResolvedValue({ error: new Error("Network unavailable") });
    await expect(logout()).rejects.toThrow("Network unavailable");
    expect(getCurrentUser()).toEqual(account);
  });
  it("does not load a private role for an unauthenticated user", async () => {
    mocks.remote.mockClear();
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    expect(await refreshCurrentUser()).toBeNull();
    expect(mocks.remote).not.toHaveBeenCalled();
  });
});
