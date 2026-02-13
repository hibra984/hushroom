import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="text-xl font-bold">Hushroom</span>
          <div className="flex items-center gap-6">
            <a href="#features" className="hidden text-sm text-gray-400 hover:text-white md:block">Features</a>
            <a href="#pricing" className="hidden text-sm text-gray-400 hover:text-white md:block">Pricing</a>
            <a href="#companions" className="hidden text-sm text-gray-400 hover:text-white md:block">For Companions</a>
            <Link href="/login" className="text-sm text-gray-300 hover:text-white">Sign In</Link>
            <Link href="/register" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pb-24 pt-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-block rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-400">
            Trusted by 1,200+ goal achievers
          </div>
          <h1 className="mb-6 text-5xl font-bold leading-tight md:text-6xl">
            Your goals deserve{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              real human presence
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-400">
            Hushroom pairs you with trained companions for focused, structured sessions
            that keep you accountable and present. Set a goal, match with a companion,
            and achieve more together.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register" className="rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold hover:bg-blue-500">
              Start Free
            </Link>
            <a href="#features" className="rounded-lg border border-gray-600 px-8 py-4 text-lg font-semibold hover:border-gray-400">
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-y border-gray-800 bg-gray-900/50 px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {[
            { quote: 'I finished my thesis two weeks early. The structured presence made all the difference.', name: 'Sarah C.', role: 'Graduate Student' },
            { quote: 'Having a companion during my morning workouts keeps me showing up. 47-day streak and counting.', name: 'Marcus J.', role: 'Fitness Enthusiast' },
            { quote: 'I wrote 30,000 words in a month with Hushroom. The drift alerts kept me from spiraling into social media.', name: 'Aisha R.', role: 'Aspiring Author' },
          ].map((t) => (
            <div key={t.name} className="rounded-xl border border-gray-800 bg-gray-900 p-6">
              <p className="mb-4 text-gray-300">&ldquo;{t.quote}&rdquo;</p>
              <div>
                <p className="font-semibold text-white">{t.name}</p>
                <p className="text-sm text-gray-500">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold">How it works</h2>
          <p className="mb-16 text-center text-gray-400">Three simple steps to structured presence</p>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { step: '01', title: 'Define your goal', desc: 'Set a clear intention and create a structured contract with milestones, boundaries, and success criteria.' },
              { step: '02', title: 'Match with a companion', desc: 'Our AI matches you based on speciality, availability, rating, and language — finding the perfect presence partner.' },
              { step: '03', title: 'Stay present together', desc: 'Join a real-time audio session with a live timer, drift detection, and mutual accountability.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600/20 text-xl font-bold text-blue-400">
                  {s.step}
                </div>
                <h3 className="mb-2 text-xl font-semibold">{s.title}</h3>
                <p className="text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-gray-900/50 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold">Everything you need to stay on track</h2>
          <p className="mb-16 text-center text-gray-400">Built for real accountability, not superficial motivation</p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Real-time Sessions', desc: 'LiveKit-powered audio with a server-authoritative timer and live drift alerts at key milestones.' },
              { title: 'Smart Matching', desc: 'Multi-criteria scoring engine that finds companions based on speciality, rating, availability, and language.' },
              { title: 'Goal Contracts', desc: 'Structured agreements with terms, boundaries, milestones, and success criteria — agreed by both parties.' },
              { title: 'Drift Detection', desc: 'AI-powered presence monitoring that flags when you or your companion deviate from the session focus.' },
              { title: 'Mutual Evaluation', desc: '5-dimension rating system with weighted reputation scoring, recency bias, and volume confidence.' },
              { title: 'Secure Payments', desc: 'Stripe-powered with transparent pricing, automatic companion payouts, and platform fee breakdown.' },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold">Simple, transparent pricing</h2>
          <p className="mb-16 text-center text-gray-400">Pay only for the sessions you need</p>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { name: 'Free', price: '0', period: 'forever', features: ['1 session per week', 'Basic matching', 'Community support', 'Goal tracking'], cta: 'Get Started', highlight: false },
              { name: 'Pro', price: '19', period: '/month', features: ['Unlimited sessions', 'Priority matching', 'Session recordings', 'Analytics dashboard', 'Email support'], cta: 'Start Free Trial', highlight: true },
              { name: 'Teams', price: '49', period: '/month', features: ['Everything in Pro', 'Team dashboards', 'Shared goals', 'Admin panel', 'Dedicated support', 'Custom contracts'], cta: 'Contact Sales', highlight: false },
            ].map((p) => (
              <div key={p.name} className={`rounded-xl border p-8 ${p.highlight ? 'border-blue-500 bg-blue-950/30' : 'border-gray-800 bg-gray-900'}`}>
                {p.highlight && <span className="mb-4 inline-block rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold">Most Popular</span>}
                <h3 className="text-xl font-bold">{p.name}</h3>
                <div className="my-4">
                  <span className="text-4xl font-bold">&euro;{p.price}</span>
                  <span className="text-gray-400">{p.period}</span>
                </div>
                <ul className="mb-8 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="text-green-400">&#10003;</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className={`block rounded-lg py-3 text-center font-semibold ${p.highlight ? 'bg-blue-600 text-white hover:bg-blue-500' : 'border border-gray-600 text-gray-300 hover:border-gray-400'}`}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Companions */}
      <section id="companions" className="border-t border-gray-800 bg-gray-900/50 px-6 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold">Earn by being present</h2>
          <p className="mb-10 text-gray-400">
            Join as a companion and help others achieve their goals. Set your own rates,
            choose your schedule, and build your reputation.
          </p>
          <div className="mb-10 grid gap-4 text-left md:grid-cols-2">
            {[
              'Set your own hourly rates',
              'Flexible schedule — work when you want',
              'Build a verified reputation with ratings',
              'Automatic payouts via Stripe Connect',
              'Choose your specialities',
              'No certification required to start as a peer',
            ].map((b) => (
              <div key={b} className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-900 p-4">
                <span className="text-blue-400">&#10003;</span>
                <span className="text-gray-300">{b}</span>
              </div>
            ))}
          </div>
          <Link href="/register" className="inline-block rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold hover:bg-blue-500">
            Become a Companion
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-950 px-6 py-12">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-3 text-lg font-bold">Hushroom</h3>
            <p className="text-sm text-gray-500">Structured Human Presence Platform</p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-gray-400">Product</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#features" className="hover:text-white">Features</a></li>
              <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
              <li><a href="#companions" className="hover:text-white">For Companions</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-gray-400">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-gray-400">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>hello@hushroom.com</li>
              <li>support@hushroom.com</li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-6xl border-t border-gray-800 pt-8 text-center text-sm text-gray-600">
          &copy; 2025 Hushroom. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
