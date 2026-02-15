import Link from 'next/link';

export default function HomePage() {
  const testimonials = [
    {
      quote:
        'I finished my thesis two weeks early. The structured presence made all the difference.',
      name: 'Sarah C.',
      role: 'Graduate Student',
    },
    {
      quote:
        'I stopped breaking promises to myself. The sessions made consistency feel normal again.',
      name: 'Marcus J.',
      role: 'Fitness Professional',
    },
    {
      quote:
        'I shipped a side project in 21 days. The drift checkpoints are brutally useful.',
      name: 'Aisha R.',
      role: 'Product Designer',
    },
  ];

  const features = [
    {
      title: 'Human Presence, Not Noise',
      desc: 'Work with trained companions who know how to keep you grounded, focused, and moving.',
    },
    {
      title: 'Live Drift Monitoring',
      desc: 'Session flow includes live checkpoints that catch distraction before momentum breaks.',
    },
    {
      title: 'Smart Companion Matching',
      desc: 'Pairing is based on specialty, reliability, timezone, language, and track record.',
    },
    {
      title: 'Goal Contracts',
      desc: 'Set explicit boundaries, milestones, and success criteria before each session starts.',
    },
    {
      title: 'Reputation You Can Trust',
      desc: 'Companion quality is continuously scored from outcome-based multi-factor ratings.',
    },
    {
      title: 'Transparent Payments',
      desc: 'Clear session pricing with accountable payout and platform fee visibility.',
    },
  ];

  const pricing = [
    {
      name: 'Starter',
      price: '0',
      period: 'forever',
      cta: 'Start Free',
      highlight: false,
      points: ['1 session per week', 'Goal contracts', 'Basic matching', 'Session notes'],
    },
    {
      name: 'Focused',
      price: '19',
      period: '/month',
      cta: 'Try Focused',
      highlight: true,
      points: [
        'Unlimited sessions',
        'Priority matching',
        'Drift timeline analytics',
        'Performance insights',
      ],
    },
    {
      name: 'Teams',
      price: '49',
      period: '/month',
      cta: 'Talk to Sales',
      highlight: false,
      points: ['Team dashboards', 'Shared accountability rooms', 'Admin controls', 'Advanced reporting'],
    },
  ];

  return (
    <div className="relative overflow-hidden text-[var(--ink)]">
      <nav className="sticky top-0 z-40 border-b border-[#ceddcf] bg-[#f5faf5]/82 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <img src="/hushroom-mark.svg" alt="Hushroom" className="h-8 w-8" />
            <span>Hushroom</span>
          </Link>
          <div className="flex items-center gap-5 text-sm font-medium text-[var(--ink-soft)]">
            <a href="#features" className="hidden hover:text-[var(--ink)] md:block">
              Features
            </a>
            <a href="#pricing" className="hidden hover:text-[var(--ink)] md:block">
              Pricing
            </a>
            <a href="#companions" className="hidden hover:text-[var(--ink)] md:block">
              For Companions
            </a>
            <Link href="/login" className="hidden hover:text-[var(--ink)] sm:block">
              Sign In
            </Link>
            <Link href="/register" className="btn-primary px-4 py-2 text-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <section className="px-4 pb-16 pt-16 sm:px-6 sm:pt-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.2fr_0.9fr]">
          <div className="reveal">
            <span className="inline-flex rounded-full border border-[#bee1d2] bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#0e6a50]">
              Structured Human Presence
            </span>
            <h1 className="mt-5 max-w-2xl text-5xl font-bold leading-tight sm:text-6xl">
              Deep focus feels easier with <span className="app-gradient-text">real accountability</span>.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--ink-soft)]">
              Hushroom pairs you with trained companions for timed, contract-based sessions.
              You define the goal. You stay present. You finish what matters.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/register" className="btn-primary px-6 py-3 text-base">
                Start Free
              </Link>
              <a href="#features" className="btn-secondary px-6 py-3 text-base">
                Explore Features
              </a>
            </div>
            <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
              <div className="surface-card rounded-2xl px-4 py-3">
                <p className="text-2xl font-bold text-[#0f6e52]">1,200+</p>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                  Active Members
                </p>
              </div>
              <div className="surface-card rounded-2xl px-4 py-3">
                <p className="text-2xl font-bold text-[#0f6e52]">92%</p>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                  Session Completion
                </p>
              </div>
              <div className="surface-card rounded-2xl px-4 py-3">
                <p className="text-2xl font-bold text-[#0f6e52]">4.8/5</p>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                  Companion Rating
                </p>
              </div>
            </div>
          </div>

          <div className="reveal reveal-delay-1">
            <div className="glass-shell rounded-3xl p-6 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f6e52]">
                Session Snapshot
              </p>
              <h2 className="mt-3 text-2xl font-bold">Monday Focus Block</h2>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">
                Goal: Finish launch copy and send final review.
              </p>
              <div className="mt-6 space-y-3">
                <div className="surface-card rounded-2xl p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">Companion</span>
                    <span className="text-[var(--ink-soft)]">Elena V.</span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">
                    Specialty: Writing flow, planning, anti-drift routines
                  </p>
                </div>
                <div className="surface-card rounded-2xl p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">Contract Mode</span>
                    <span className="text-[var(--ink-soft)]">Moderate</span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">
                    25-minute checkpoints, no notification breaks, explicit milestone review.
                  </p>
                </div>
                <div className="surface-card rounded-2xl p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">Completion Score</span>
                    <span className="font-semibold text-[#0f6e52]">97%</span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">
                    Drift flagged once and recovered in 2 minutes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
          {testimonials.map((item, idx) => (
            <article
              key={item.name}
              className={`surface-card card-lift reveal rounded-2xl p-5 ${idx === 1 ? 'reveal-delay-1' : ''} ${idx === 2 ? 'reveal-delay-2' : ''}`}
            >
              <p className="text-sm leading-relaxed text-[var(--ink-soft)]">{item.quote}</p>
              <p className="mt-4 text-sm font-semibold">{item.name}</p>
              <p className="text-xs text-[var(--ink-soft)]">{item.role}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="features" className="px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#0f6e52]">
              Why Hushroom
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Built for disciplined execution, not surface-level motivation.
            </h2>
            <p className="mt-3 text-[var(--ink-soft)]">
              Every part of the product is designed to convert intention into repeatable progress.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((item) => (
              <article key={item.title} className="surface-card card-lift rounded-2xl p-5">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-9 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#0f6e52]">Pricing</p>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Simple plans that grow with your goals.</h2>
            </div>
            <p className="max-w-lg text-sm text-[var(--ink-soft)]">
              Start for free, then scale into deeper support when you need stronger accountability.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {pricing.map((plan) => (
              <article
                key={plan.name}
                className={`rounded-3xl p-6 ${plan.highlight ? 'border border-[#1f8f6e] bg-[#edfbf4]' : 'surface-card'}`}
              >
                {plan.highlight && (
                  <span className="inline-flex rounded-full bg-[#d3f2e4] px-2.5 py-1 text-xs font-semibold text-[#0f6e52]">
                    Most Popular
                  </span>
                )}
                <h3 className="mt-3 text-2xl font-bold">{plan.name}</h3>
                <p className="mt-4">
                  <span className="text-4xl font-bold">EUR {plan.price}</span>
                  <span className="ml-1 text-sm text-[var(--ink-soft)]">{plan.period}</span>
                </p>
                <ul className="mt-6 space-y-2 text-sm text-[var(--ink-soft)]">
                  {plan.points.map((point) => (
                    <li key={point}>+ {point}</li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`${plan.highlight ? 'btn-primary' : 'btn-secondary'} mt-7 w-full px-4 py-3 text-sm`}
                >
                  {plan.cta}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="companions" className="px-4 pb-20 pt-10 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[#cde0d2] bg-white/86 p-7 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#0f6e52]">For Companions</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Earn by helping people stay present.</h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--ink-soft)]">
                Build recurring revenue through meaningful accountability work. Choose your schedule,
                set your price, and grow a reputation rooted in real session outcomes.
              </p>
              <Link href="/register" className="btn-primary mt-6 px-6 py-3 text-sm">
                Become a Companion
              </Link>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                'Flexible schedule and timezone control',
                'Transparent payout rules',
                'Specialty-driven matching',
                'Structured session contracts',
                'Reputation growth through ratings',
                'Built-in quality guardrails',
              ].map((item) => (
                <li key={item} className="surface-card rounded-2xl px-4 py-3 text-sm text-[var(--ink-soft)]">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#d3dfd5] px-4 py-10 text-sm text-[var(--ink-soft)] sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <p className="font-medium text-[var(--ink)]">Hushroom - Structured Human Presence Platform</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/terms" className="hover:text-[var(--ink)]">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-[var(--ink)]">
              Privacy
            </Link>
            <a href="mailto:support@hushroom.com" className="hover:text-[var(--ink)]">
              support@hushroom.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
