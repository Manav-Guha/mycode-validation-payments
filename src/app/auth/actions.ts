"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const credentials = z.object({ email: z.string().email(), password: z.string().min(8).max(128) });

function destination(path: string, message: string) {
  return `${path}?message=${encodeURIComponent(message)}`;
}

export async function signUp(formData: FormData) {
  const parsed = credentials.extend({ displayName: z.string().trim().min(1).max(80), market: z.enum(["AE", "GB"]) }).safeParse({
    email: formData.get("email"), password: formData.get("password"), displayName: formData.get("displayName"), market: formData.get("market"),
  });
  if (!parsed.success) redirect(destination("/auth/sign-up", "Check your details. Passwords need at least 8 characters."));
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { display_name: parsed.data.displayName, market: parsed.data.market }, emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) redirect(destination("/auth/sign-up", error.message));
  redirect(destination("/auth/sign-in", "Check your email to confirm your account, then sign in."));
}

export async function signIn(formData: FormData) {
  const parsed = credentials.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) redirect(destination("/auth/sign-in", "Enter a valid email and password."));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) redirect(destination("/auth/sign-in", "We could not sign you in with those details."));
  redirect("/account");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/?message=You+are+signed+out");
}

export async function requestPasswordReset(formData: FormData) {
  const email = z.string().email().safeParse(formData.get("email"));
  if (!email.success) redirect(destination("/auth/forgot-password", "Enter a valid email address."));
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: `${origin}/auth/update-password` });
  redirect(destination("/auth/sign-in", "If that account exists, a password-reset link has been sent."));
}

export async function updatePassword(formData: FormData) {
  const password = z.string().min(8).max(128).safeParse(formData.get("password"));
  if (!password.success) redirect(destination("/auth/update-password", "Use at least 8 characters."));
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) redirect(destination("/auth/update-password", "That reset session is invalid or expired. Request another link."));
  redirect(destination("/account", "Your password has been updated."));
}
