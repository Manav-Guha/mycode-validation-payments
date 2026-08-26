"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="shell py-20">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="display mt-3 text-4xl">We couldn’t open this page.</h1>
      <p className="muted mt-3">Please try again. No payment or order state is changed by retrying this page.</p>
      <button className="button mt-6" onClick={reset}>Try again</button>
    </div>
  );
}
