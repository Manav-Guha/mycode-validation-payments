import { AuthFrame } from "@/components/auth-form";
import { updatePassword } from "../actions";

export default async function UpdatePasswordPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { message } = await searchParams;
  return <AuthFrame title="Choose a new password" intro="Use at least eight characters." message={message}>
    <form action={updatePassword} className="grid gap-5"><div className="field"><label htmlFor="password">New password</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required /></div><button className="button" type="submit">Update password</button></form>
  </AuthFrame>;
}
