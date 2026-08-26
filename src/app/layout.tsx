import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Quiet Shelf Books", template: "%s · Quiet Shelf Books" },
  description: "Thoughtful books and a continuing reading room for curious readers.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-[var(--line)] bg-[var(--cream)]">
          <div className="shell flex min-h-20 items-center justify-between gap-6">
            <Link href="/" className="display text-2xl no-underline">Quiet Shelf</Link>
            <nav aria-label="Primary" className="flex items-center gap-5 text-sm font-bold">
              <Link href="/catalogue">Books</Link>
              <Link href="/library">Library</Link>
              <Link href="/account">Account</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="mt-20 border-t border-[var(--line)] py-10 text-sm text-[var(--forest)]">
          <div className="shell flex flex-wrap justify-between gap-4">
            <p>Quiet Shelf Books · Independent reading for unhurried minds.</p>
            <p>Sandbox merchant experience · No real payments</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
