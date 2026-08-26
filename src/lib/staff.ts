import "server-only";
import { notFound } from "next/navigation";
import { requireUser } from "./auth";

export async function requireStaff() {
  const auth = await requireUser();
  const staff = (process.env.STAFF_USER_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean);
  if (!staff.includes(auth.userId)) notFound();
  return auth;
}
