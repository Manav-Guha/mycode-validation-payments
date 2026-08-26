import { AuthFrame } from "@/components/auth-form";
import { requestPasswordReset } from "../actions";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { message } = await searchParams;
  return <AuthFrame title="Reset your password" intro="We’ll send a secure reset link if an account exists for that address." message={message}>
    <form action={requestPasswordReset} className="grid gap-5"><div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required /></div><button className="button" type="submit">Send reset link</button></form>
  </AuthFrame>;
}
