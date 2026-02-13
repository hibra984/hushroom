import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-300">
      <nav className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-bold text-white">Hushroom</Link>
          <div className="flex gap-4">
            <Link href="/terms" className="text-sm text-gray-400 hover:text-white">Terms</Link>
            <Link href="/privacy" className="text-sm text-white">Privacy</Link>
            <Link href="/login" className="text-sm text-blue-400 hover:text-blue-300">Sign In</Link>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold text-white">Privacy Policy</h1>
        <p className="mb-8 text-sm text-gray-500">Last updated: February 2025 | GDPR Compliant</p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">1. Data Controller</h2>
            <p>Hushroom (&quot;we&quot;, &quot;us&quot;) acts as the data controller for personal data collected through our platform. Contact: privacy@hushroom.com</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">2. Data We Collect</h2>
            <p className="mb-2"><strong className="text-white">Account data:</strong> email address, name, date of birth, display name, preferred language, timezone, avatar.</p>
            <p className="mb-2"><strong className="text-white">Session data:</strong> goals, contracts, session duration, drift events, timer data, ratings, and comments.</p>
            <p className="mb-2"><strong className="text-white">Payment data:</strong> processed via Stripe. We store transaction references, amounts, and payout records. We do not store credit card numbers.</p>
            <p><strong className="text-white">Usage data:</strong> IP address, browser type, page views, feature usage, and error logs.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">3. Legal Basis for Processing</h2>
            <p className="mb-2"><strong className="text-white">Contract performance:</strong> account management, session delivery, payment processing.</p>
            <p className="mb-2"><strong className="text-white">Consent:</strong> marketing communications, optional analytics.</p>
            <p><strong className="text-white">Legitimate interest:</strong> platform security, fraud prevention, service improvement.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">4. How We Use Your Data</h2>
            <p>We use your data to: provide and improve our services; match you with appropriate companions; process payments and payouts; calculate reputation scores; send transactional notifications; prevent abuse and maintain platform safety; comply with legal obligations.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">5. Data Sharing</h2>
            <p className="mb-2"><strong className="text-white">Stripe:</strong> payment processing and companion payouts.</p>
            <p className="mb-2"><strong className="text-white">LiveKit:</strong> real-time audio session infrastructure.</p>
            <p className="mb-2"><strong className="text-white">Infrastructure providers:</strong> cloud hosting, database, and CDN services.</p>
            <p>We <strong className="text-white">never</strong> sell your personal data to third parties. We do not share data for advertising purposes.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">6. Data Retention</h2>
            <p className="mb-2"><strong className="text-white">Account data:</strong> retained for the duration of your account plus 1 year after deletion.</p>
            <p className="mb-2"><strong className="text-white">Session data:</strong> retained for 2 years for quality assurance.</p>
            <p className="mb-2"><strong className="text-white">Payment records:</strong> retained for 7 years as required by tax law.</p>
            <p><strong className="text-white">Audit logs:</strong> retained for 1 year for security purposes.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">7. Your Rights (GDPR)</h2>
            <p>Under GDPR, you have the right to:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li><strong className="text-white">Access:</strong> request a copy of your personal data</li>
              <li><strong className="text-white">Rectification:</strong> correct inaccurate data</li>
              <li><strong className="text-white">Erasure:</strong> request deletion of your data (&quot;right to be forgotten&quot;)</li>
              <li><strong className="text-white">Portability:</strong> receive your data in a machine-readable format</li>
              <li><strong className="text-white">Objection:</strong> object to processing based on legitimate interest</li>
              <li><strong className="text-white">Restriction:</strong> request limited processing of your data</li>
            </ul>
            <p className="mt-2">To exercise these rights, contact privacy@hushroom.com. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">8. Cookies</h2>
            <p>We use essential cookies for authentication and session management. Optional analytics cookies are only set with your consent. You can manage cookie preferences in your browser settings.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">9. International Transfers</h2>
            <p>Your data may be processed in EU/EEA countries. Any transfers outside the EEA are protected by Standard Contractual Clauses (SCCs) or adequacy decisions.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">10. Security</h2>
            <p>We implement encryption in transit (TLS 1.3), encryption at rest, access controls, audit logging, rate limiting, and regular security reviews. Passwords are hashed using bcrypt.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">11. Children&apos;s Privacy</h2>
            <p>Hushroom is not intended for users under 18 years of age. We do not knowingly collect data from minors. If we discover such data, it will be deleted immediately.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">12. Contact</h2>
            <p>Data Protection Officer: <span className="text-white">privacy@hushroom.com</span></p>
            <p>You also have the right to lodge a complaint with your local data protection authority.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
