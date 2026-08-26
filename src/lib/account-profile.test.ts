import { describe, expect, it } from "vitest";
import { marketName, resolveAccountProfile } from "./account-profile";

const userId = "0d906f82-2b2a-46d3-83db-b7977da9a925";

describe("account profile resolution", () => {
  it("preserves the real profile-query failure instead of inventing customer values", () => {
    const error = { code: "42501", message: "permission denied for table profiles", details: null };
    expect(resolveAccountProfile(userId, { data: null, error })).toEqual({
      status: "unavailable", reason: "query_error", error,
    });
  });

  it("requires the selected profile id to match the authenticated subject", () => {
    expect(resolveAccountProfile(userId, { data: { id: "ff553898-018c-4885-9830-d1cc65b8218a", display_name: "Amina", market: "AE" }, error: null })).toEqual({
      status: "unavailable", reason: "identity_mismatch",
    });
  });

  it("renders an established UAE profile accurately", () => {
    const state = resolveAccountProfile(userId, { data: { id: userId, display_name: "Amina", market: "AE" }, error: null });
    expect(state.status).toBe("ready");
    if (state.status === "ready") {
      expect(state.profile.display_name).toBe("Amina");
      expect(marketName(state.profile.market)).toBe("United Arab Emirates");
    }
  });
});
