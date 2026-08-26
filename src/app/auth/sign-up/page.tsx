import Link from "next/link";
import { AuthFrame } from "@/components/auth-form";
import { signUp } from "../actions";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { message } = await searchParams;
  return <AuthFrame title="Create your account" intro="Shipping details are only requested if you later buy a physical book." message={message}>
    <form action={signUp} className="grid gap-5">
      <div className="field"><label htmlFor="displayName">Name</label><input id="displayName" name="displayName" autoComplete="name" maxLength={80} required /></div>
      <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
      <div className="field"><label htmlFor="market">Customer market</label><select id="market" name="market" defaultValue="AE"><option value="AE">United Arab Emirates</option><option value="GB">United Kingdom</option></select><span className="muted text-sm">Used for supported delivery details; prices remain in the displayed merchant currency.</span></div>
      <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required /></div>
      <button className="button" type="submit">Create account</button>
    </form>
    <p className="mt-6 text-sm">Already registered? <Link href="/auth/sign-in">Sign in</Link></p>
  </AuthFrame>;
}
