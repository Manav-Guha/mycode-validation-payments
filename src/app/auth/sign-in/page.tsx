import Link from "next/link";
import { AuthFrame } from "@/components/auth-form";
import { signIn } from "../actions";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { message } = await searchParams;
  return <AuthFrame title="Welcome back" intro="Sign in to recover purchases, downloads, and membership access." message={message}>
    <form action={signIn} className="grid gap-5">
      <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
      <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" minLength={8} required /></div>
      <button className="button" type="submit">Sign in</button>
    </form>
    <div className="mt-6 flex justify-between gap-4 text-sm"><Link href="/auth/sign-up">Create an account</Link><Link href="/auth/forgot-password">Forgot password?</Link></div>
  </AuthFrame>;
}
