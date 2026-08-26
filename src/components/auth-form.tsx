import Link from "next/link";

export function AuthFrame({ title, intro, message, children }: { title: string; intro: string; message?: string; children: React.ReactNode }) {
  return (
    <div className="shell py-16">
      <div className="card mx-auto max-w-lg p-7 md:p-10">
        <p className="eyebrow">Your account</p><h1 className="display mt-2 text-4xl">{title}</h1><p className="muted mt-3">{intro}</p>
        {message && <p className="notice mt-6" role="status">{message}</p>}
        <div className="mt-7">{children}</div>
        <p className="muted mt-7 text-sm"><Link href="/catalogue">Return to the catalogue</Link></p>
      </div>
    </div>
  );
}
