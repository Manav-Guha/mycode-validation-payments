import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <section className="shell grid min-h-[68vh] items-center gap-12 py-16 md:grid-cols-[1.2fr_.8fr]">
        <div>
          <p className="eyebrow">Books worth returning to</p>
          <h1 className="display mt-4 max-w-3xl text-5xl leading-[1.02] md:text-7xl">A quieter corner of the internet for curious readers.</h1>
          <p className="muted mt-6 max-w-2xl text-lg">Choose a beautifully made paperback, keep a digital field guide, or join our monthly Reading Room.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="button" href="/catalogue">Browse the shelf</Link>
            <Link className="button secondary" href="/auth/sign-up">Create an account</Link>
          </div>
        </div>
        <div className="card relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden bg-[var(--forest)] p-9 text-white">
          <div className="absolute inset-5 rounded-[12px] border border-white/30" />
          <p className="relative text-sm uppercase tracking-[.2em]">The Quiet Shelf</p>
          <p className="display relative mt-24 text-5xl leading-tight">Notes on Attention</p>
          <p className="relative mt-8 text-white/75">A field guide for reading deeply in a noisy world.</p>
        </div>
      </section>
      <section className="bg-[var(--cream)] py-14">
        <div className="shell grid gap-8 md:grid-cols-3">
          {[
            ["01", "A book for your shelf", "A tactile paperback, prepared for dispatch to supported markets."],
            ["02", "A book you can keep", "Permanent account access to a practical digital edition."],
            ["03", "A room that keeps growing", "Monthly essays and reading guides for active members."],
          ].map(([number, title, body]) => (
            <article key={number}>
              <p className="eyebrow">{number}</p><h2 className="display mt-2 text-3xl">{title}</h2><p className="muted mt-3">{body}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
