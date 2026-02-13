import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-300">
      <nav className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-bold text-white">Hushroom</Link>
          <div className="flex gap-4">
            <Link href="/terms" className="text-sm text-white">Terms</Link>
            <Link href="/privacy" className="text-sm text-gray-400 hover:text-white">Privacy</Link>
            <Link href="/login" className="text-sm text-blue-400 hover:text-blue-300">Sign In</Link>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold text-white">Terms of Service</h1>
        <p className="mb-8 text-sm text-gray-500">Last updated: February 2025</p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">1. Platform Description</h2>
            <p>Hushroom is a Structured Human Presence Platform that connects users with trained human companions for focused, real-time accountability sessions. Hushroom is <strong className="text-white">not</strong> therapy, counseling, coaching, or medical advice. It is a structured presence service only.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">2. Eligibility</h2>
            <p>You must be at least 18 years old and provide a valid date of birth during registration. Age verification is required before booking sessions. By using Hushroom, you confirm you meet these requirements.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">3. Account Responsibilities</h2>
            <p>You are responsible for maintaining the security of your account credentials. You must provide accurate information during registration. You may not share your account or allow others to access it. You must promptly notify us of any unauthorized access.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">4. Session Conduct</h2>
            <p>During sessions, all participants must: maintain respect and professionalism; follow the agreed session contract; refrain from harassment, discrimination, or abusive behavior; maintain confidentiality of session contents; not record sessions without mutual consent. Violations may result in immediate suspension.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">5. Companion Obligations</h2>
            <p>Companions must: maintain professionalism during all sessions; honor availability commitments; respond honestly in evaluations; not provide medical, therapeutic, or professional advice; comply with all platform policies. Companion status is subject to ongoing review based on ratings and reports.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">6. Payments &amp; Refunds</h2>
            <p>All payments are processed through Stripe. A platform commission of 25% is applied to each session. Companions receive 75% of the session fee. <strong className="text-white">Refund policy:</strong> 50% refund if cancelled 24+ hours before the session; no refund if cancelled less than 24 hours before or after the session starts. Disputed charges are handled through our support team.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">7. Intellectual Property</h2>
            <p>All platform content, branding, and technology are owned by Hushroom. You retain ownership of any content you create during sessions. You grant Hushroom a limited license to use anonymized, aggregated data for platform improvement.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">8. Privacy</h2>
            <p>Your data is handled according to our <Link href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</Link>, which is incorporated into these terms by reference.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">9. Limitation of Liability</h2>
            <p>Hushroom is provided &quot;as is&quot; without warranties of any kind. We are not liable for: outcomes of sessions; actions of companions or users; technical disruptions; lost data; or any indirect, incidental, or consequential damages. Our total liability is limited to the amount you paid in the 12 months preceding the claim.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">10. Dispute Resolution</h2>
            <p>Disputes should first be addressed through our support team at support@hushroom.com. If unresolved, disputes shall be submitted to binding arbitration under EU regulations. Class actions are waived to the extent permitted by law.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">11. Termination</h2>
            <p>You may delete your account at any time. Hushroom may suspend or terminate accounts that violate these terms, receive multiple abuse reports, or engage in fraudulent activity. Upon termination, your data will be handled per our Privacy Policy.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">12. Governing Law</h2>
            <p>These terms are governed by the laws of the European Union and applicable member state legislation. For users outside the EU, local consumer protection laws may also apply.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">13. Contact</h2>
            <p>For legal inquiries: <span className="text-white">legal@hushroom.com</span></p>
            <p>For support: <span className="text-white">support@hushroom.com</span></p>
          </section>
        </div>
      </main>
    </div>
  );
}
