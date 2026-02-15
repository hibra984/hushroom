export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-shell flex items-center justify-center">
      <div className="relative z-10 grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_0.92fr]">
        <aside className="glass-shell hidden rounded-3xl p-10 text-[#123728] lg:block">
          <img src="/hushroom-logo.svg" alt="Hushroom logo" className="h-auto w-[260px]" />
          <h1 className="mt-4 text-4xl font-bold leading-tight">
            Real presence for people who want to finish what they start.
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-[#436154]">
            Sessions are structured. Expectations are explicit. Progress is measured.
            The goal is not motivation. The goal is execution.
          </p>
          <div className="mt-8 space-y-3 text-sm">
            {[
              'Goal contracts before every session',
              'Drift checkpoints during focused work',
              'Companion quality tracked by outcomes',
            ].map((point) => (
              <div key={point} className="surface-card rounded-2xl px-4 py-3 text-[#345447]">
                {point}
              </div>
            ))}
          </div>
        </aside>
        <div className="mx-auto w-full max-w-xl">
          <div className="mb-6 text-center lg:hidden">
            <div className="mb-2 flex items-center justify-center gap-2">
              <img src="/hushroom-mark.svg" alt="Hushroom" className="h-8 w-8" />
              <h1 className="text-3xl font-bold">Hushroom</h1>
            </div>
            <p className="text-sm text-[var(--ink-soft)]">Structured Human Presence Platform</p>
          </div>
          <div className="surface-card reveal rounded-3xl p-6 sm:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
