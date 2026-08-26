export type ProfileRow = { id: string; display_name: string; market: string };
export type QueryError = { code?: string; message: string; details?: string | null; hint?: string | null };

type ProfileQueryResult = { data: ProfileRow | null; error: QueryError | null };

export type AccountProfileState =
  | { status: "ready"; profile: ProfileRow & { market: "AE" | "GB" } }
  | { status: "unavailable"; reason: "query_error" | "missing" | "identity_mismatch" | "invalid_data"; error?: QueryError };

export function resolveAccountProfile(userId: string, result: ProfileQueryResult): AccountProfileState {
  if (result.error) return { status: "unavailable", reason: "query_error", error: result.error };
  if (!result.data) return { status: "unavailable", reason: "missing" };
  if (result.data.id !== userId) return { status: "unavailable", reason: "identity_mismatch" };
  if (!result.data.display_name.trim() || (result.data.market !== "AE" && result.data.market !== "GB")) {
    return { status: "unavailable", reason: "invalid_data" };
  }
  return { status: "ready", profile: { ...result.data, market: result.data.market } };
}

export function marketName(market: "AE" | "GB") {
  return market === "AE" ? "United Arab Emirates" : "United Kingdom";
}
