# Hushroom Go-To-Market Launch Plan

## Executive Summary

Hushroom is a **Structured Human Presence Platform** — a marketplace connecting users with trained human companions for focused, goal-bound accountability sessions via real-time audio. Unlike therapy, coaching, or consulting, Hushroom provides **pure human presence** with behavioral contracts, drift enforcement, and measurable outcomes.

**Launch target:** Q2 2026 (closed beta → open beta → public launch)
**Initial market:** Europe (France, Germany, UK) — GDPR-ready from day one
**Revenue model:** Commission on sessions (20-30% depending on companion tier)

---

## Phase 0: Pre-Launch Foundation (Weeks 1-4)

### 0.1 Infrastructure Setup
- [ ] Purchase domain: `hushroom.com` (and `.fr`, `.de`, `.co.uk`)
- [ ] Set up production hosting (Railway / Render / Hetzner + Coolify)
- [ ] Configure DNS, SSL certificates (Let's Encrypt via Caddy/Nginx)
- [ ] Set up production PostgreSQL (Neon / Supabase / managed)
- [ ] Set up production Redis (Upstash / Railway)
- [ ] Configure LiveKit Cloud account (free tier: 100 participants/month)
- [ ] Set up Stripe account + Stripe Connect (for companion payouts)
- [ ] Configure SMTP (Resend / Postmark — transactional emails)
- [ ] Set up Sentry for error monitoring (free tier)
- [ ] Set up Plausible / PostHog for privacy-friendly analytics

### 0.2 Legal & Compliance
- [ ] Register business entity (SAS in France or similar)
- [ ] Finalize Terms of Service with a lawyer (EU consumer law compliant)
- [ ] Finalize Privacy Policy (GDPR compliant, DPA ready)
- [ ] Cookie consent implementation (Tarteaucitron.js or similar)
- [ ] Age verification flow compliance check (18+ requirement)
- [ ] Stripe Connect onboarding compliance for companion payouts
- [ ] Insurance: professional liability for the platform

### 0.3 Brand Identity
- [ ] Logo design (mushroom/room visual metaphor — calm, professional)
- [ ] Brand colors finalized (current: dark theme with teal/emerald accents)
- [ ] Typography system (Inter/system fonts for performance)
- [ ] Brand voice guidelines: calm, structured, professional, non-clinical
- [ ] Social media handles: @hushroom on Twitter/X, Instagram, LinkedIn, TikTok

---

## Phase 1: Closed Beta (Weeks 5-8)

### 1.1 Recruit Founding Companions (Target: 15-20)
**Where to find them:**
- LinkedIn outreach to: mindfulness practitioners, ex-coaches, remote workers
- Reddit communities: r/accountability, r/getdisciplined, r/productivity, r/ADHD
- Facebook groups: accountability partner groups, study groups
- University career services: psychology/social work graduates
- Freelancer platforms: people experienced in 1:1 virtual sessions

**Onboarding process:**
1. Application form (bio, motivation, availability, languages)
2. 30-minute video screening call
3. Platform walkthrough + training session (how contracts work, drift enforcement)
4. Test session with a team member
5. Profile setup + Stripe Connect onboarding
6. Go live

**Founding companion benefits:**
- Lifetime reduced commission rate (15% instead of 20-30%)
- "Founding Companion" badge on profile
- Direct input into platform features
- Priority support channel (Discord/Slack)

### 1.2 Recruit Beta Users (Target: 50-100)
**Where to find them:**
- Personal network (friends, colleagues)
- Twitter/X threads about accountability and productivity
- Reddit: r/getdisciplined, r/productivity, r/StudyTips, r/ADHD
- ProductHunt "Upcoming" page listing
- Indie Hackers community post
- University student groups (exam season timing)

**Beta user incentive:**
- First 3 sessions free
- Early adopter pricing locked for 1 year
- Feedback channel with direct founder access

### 1.3 Beta Metrics to Track
| Metric | Target | Tool |
|--------|--------|------|
| Session completion rate | > 80% | Internal analytics |
| Average session rating | > 4.2/5 | Internal ratings |
| User retention (week 2) | > 40% | PostHog |
| Companion utilization | > 30% of available hours | Internal |
| Time to first session | < 48 hours from signup | Internal |
| NPS score | > 40 | Survey (Tally.so) |
| Bug reports | < 5 critical/week | Sentry + GitHub Issues |

### 1.4 Feedback Collection
- Post-session micro-survey (2 questions, in-app)
- Weekly email survey to active users (Tally.so)
- Companion feedback calls (bi-weekly, 15 min)
- Bug report button in app → GitHub Issues
- Private Discord/Slack for beta community

---

## Phase 2: Open Beta (Weeks 9-14)

### 2.1 Product Improvements from Beta Feedback
- Fix all critical bugs
- Improve onboarding conversion funnel
- Optimize matching algorithm based on real data
- Add most-requested features (top 3 from feedback)
- Performance optimization (target: < 2s page load)

### 2.2 Content Marketing (Start During Open Beta)

**Blog (on hushroom.com/blog — SEO-optimized):**
- "Why Accountability Partners Fail (and How Structured Sessions Fix It)"
- "The Science of Human Presence: Why Someone Being There Changes Everything"
- "ADHD and Accountability: How Body Doubling Goes Professional"
- "Focus Sessions vs. Coworking vs. Coaching: What's the Difference?"
- "How Hushroom Works: A Complete Guide"
- "Becoming a Hushroom Companion: What You Need to Know"

**SEO targets (long-tail keywords):**
- "online accountability partner" (1.3K/mo)
- "virtual body doubling" (880/mo)
- "focus session with someone" (590/mo)
- "study accountability partner online" (720/mo)
- "ADHD body doubling service" (1.1K/mo)
- "structured accountability sessions" (210/mo)

**Social media cadence:**
- Twitter/X: 3-5 posts/week (productivity tips, user stories, behind-the-scenes)
- LinkedIn: 2 posts/week (professional angle, remote work productivity)
- Instagram: 2-3 posts/week (visual quotes, companion spotlights, infographics)
- TikTok: 1-2 videos/week (short productivity content, "a day as a Hushroom companion")

### 2.3 Community Building
- Launch Discord server (channels: general, feedback, companion-lounge, tips)
- Weekly "community session" — free group accountability hour
- Companion spotlight series (blog + social)
- User success story collection (with permission)

### 2.4 Strategic Partnerships
- **ADHD communities:** Partner with ADHD advocacy organizations (CHADD, ADHD Foundation)
- **University partnerships:** Pilot with 2-3 universities during exam periods
- **Remote work communities:** Partnerships with remote work newsletters/podcasts
- **Productivity tool integrations:** Todoist, Notion, Obsidian communities

---

## Phase 3: Public Launch (Weeks 15-18)

### 3.1 Launch Campaign

**Pre-launch (2 weeks before):**
- ProductHunt launch page preparation (screenshots, description, maker story)
- Press kit: one-pager, founder bio, product screenshots, brand assets
- Reach out to 20+ tech/productivity journalists and bloggers
- Schedule social media content for launch week
- Email list announcement (collected from beta waitlist)
- Reach out to productivity podcasts for interviews

**Launch day:**
- ProductHunt launch (Tuesday or Wednesday, 12:01 AM PT)
- Hacker News "Show HN" post
- Reddit posts in relevant subreddits (authentic, not spammy)
- Twitter/X launch thread
- LinkedIn announcement
- Email blast to waitlist
- Special launch offer: 50% off first month of Pro

**Post-launch (2 weeks after):**
- Respond to all ProductHunt comments
- Follow up with journalists who showed interest
- Publish launch retrospective blog post
- Share metrics and learnings publicly (builds trust)

### 3.2 Launch Day Targets
| Metric | Target |
|--------|--------|
| ProductHunt upvotes | 300+ |
| New signups (launch week) | 500+ |
| First sessions completed | 100+ |
| Press mentions | 5+ |
| Social media impressions | 50K+ |

---

## Phase 4: Growth (Months 3-6)

### 4.1 Pricing Strategy

| Tier | Price | Includes |
|------|-------|----------|
| **Free** | €0 | 1 session/month (30 min), standard companions only |
| **Pro** | €19/month | Unlimited sessions, all companion tiers, priority matching |
| **Teams** | €49/month | 5 seats, team analytics, dedicated companions |

**Session pricing (pay-per-session for non-subscribers):**
- Standard companion: €15/30min
- Verified companion: €20/30min
- Expert companion: €30/30min

**Platform commission:**
- Standard companions: 30%
- Verified companions: 25%
- Expert companions: 20%

### 4.2 Growth Channels (Prioritized)

**Tier 1 — Highest ROI:**
1. **SEO/Content Marketing** — Long-tail blog content targeting accountability/focus keywords
2. **Word of Mouth / Referrals** — Refer a friend: both get 1 free session
3. **ProductHunt / Hacker News** — One-time launch boost, ongoing community presence

**Tier 2 — Medium ROI:**
4. **Social Media (Organic)** — Consistent posting, community engagement
5. **Partnerships** — ADHD orgs, universities, remote work communities
6. **Podcast Appearances** — Founder on productivity/startup podcasts

**Tier 3 — Paid (when revenue supports it):**
7. **Google Ads** — Target high-intent keywords ("online accountability partner")
8. **Instagram/TikTok Ads** — Target productivity/ADHD interest groups
9. **Influencer partnerships** — Productivity YouTubers and TikTokers

### 4.3 Referral Program
- **User referral:** Invite a friend → both get 1 free session when friend completes first session
- **Companion referral:** Refer a new companion → earn €50 when they complete 10 sessions
- **Viral mechanics:** Share session achievement badges on social media (opt-in)

### 4.4 Retention Strategy
- **Streaks:** Track consecutive weeks with sessions, reward milestones
- **Goal tracking:** Show progress over time (sessions completed, goals achieved)
- **Personalized recommendations:** "Based on your focus sessions, try a Planning session"
- **Re-engagement emails:** "You haven't had a session in 2 weeks — your goals miss you"
- **Companion relationship building:** Encourage booking same companion for continuity

---

## Phase 5: Scaling (Months 6-12)

### 5.1 Product Expansion
- **Group sessions:** 2-4 users with 1 companion (study groups, team accountability)
- **Async accountability:** Daily check-in messages between sessions
- **Session recordings:** Opt-in audio snippets for personal review
- **AI-powered insights:** Session summaries, goal progress analytics
- **Mobile app launch:** iOS + Android (already built with Expo)
- **API for integrations:** Calendar sync, Slack bot, Notion integration

### 5.2 Market Expansion
- **Languages:** English → French → German → Spanish → Arabic
- **Regions:** Europe → North America → MENA
- **Verticals:**
  - Students (exam prep, thesis writing)
  - Remote workers (daily focus blocks)
  - ADHD community (body doubling)
  - Entrepreneurs (decision sessions, planning)
  - Creative professionals (creative blocks, project planning)

### 5.3 Companion Growth
- **Companion academy:** Free training course + certification
- **Tiered progression:** Standard → Verified → Expert (based on metrics)
- **Specialization tracks:** ADHD, students, executives, creatives
- **Community:** Companion-only forum, peer support, best practices sharing
- **Compensation growth:** Top companions earning €2-4K/month part-time

---

## Financial Projections

### Year 1 Targets

| Quarter | Users | Companions | Sessions/month | MRR |
|---------|-------|------------|-----------------|-----|
| Q1 (Beta) | 100 | 20 | 200 | €0 (free beta) |
| Q2 (Launch) | 500 | 40 | 800 | €3,000 |
| Q3 (Growth) | 2,000 | 80 | 3,000 | €12,000 |
| Q4 (Scale) | 5,000 | 150 | 8,000 | €35,000 |

### Unit Economics (at scale)
- **Average session price:** €20
- **Average commission:** 25% = €5/session
- **Subscription revenue:** €19/user/month (Pro tier)
- **Blended revenue per active user:** €25/month
- **CAC target:** < €15 (organic-first strategy)
- **LTV target:** > €150 (6+ month retention)
- **LTV:CAC ratio target:** > 10:1

### Funding Strategy
- **Pre-seed (now):** Bootstrap with AI-assisted solo development
- **Seed (Month 6-9):** €500K-€1M when metrics prove PMF
  - Use: Hire 2-3 engineers, 1 community manager, marketing budget
  - Targets: 2K+ active users, >40% month-2 retention, >4.2 avg rating
- **Series A (Month 18-24):** €3-5M for international expansion
  - Use: Team growth, paid acquisition, mobile app marketing, new markets

---

## Key Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Low companion supply | Users can't find sessions | Founding companion program, referral bonuses, competitive payouts |
| Low user demand | No market fit | Beta validation, iterate on positioning, test multiple verticals |
| Quality control | Bad sessions hurt reputation | Rating system, auto-suspend on bad reviews, training program |
| Competitor entry | Market share loss | First-mover advantage, strong companion community, unique contract system |
| LiveKit costs at scale | Margin compression | Migrate to self-hosted LiveKit (same API, already planned) |
| Regulatory risk | Legal issues | Lawyer-reviewed ToS, clear "not therapy" positioning, age gating |
| Companion burnout | Supply shortage | Session limits, companion wellness resources, fair scheduling |

---

## Launch Checklist (Final Pre-Launch)

### Technical
- [ ] Production deployment running and stable
- [ ] SSL certificates configured
- [ ] Database backups automated (daily)
- [ ] Monitoring and alerting set up (Sentry + uptime)
- [ ] Load testing completed (target: 100 concurrent sessions)
- [ ] Security audit (OWASP top 10 checklist)
- [ ] GDPR compliance verified (data export, deletion works)
- [ ] Email deliverability tested (SPF, DKIM, DMARC)
- [ ] Payment flow tested end-to-end with real Stripe
- [ ] Mobile apps submitted to App Store + Google Play

### Content
- [ ] Landing page copy finalized and proofread
- [ ] 5+ blog posts published (SEO foundation)
- [ ] Help center / FAQ page created
- [ ] Companion onboarding guide written
- [ ] User onboarding tutorial (video or interactive)
- [ ] Press kit prepared

### Marketing
- [ ] Social media accounts created and branded
- [ ] Email sequences set up (welcome, onboarding, re-engagement)
- [ ] ProductHunt launch prepared
- [ ] Press outreach list compiled (50+ contacts)
- [ ] Referral program implemented
- [ ] Analytics tracking verified (funnels, events)

### Operations
- [ ] Support email configured (support@hushroom.com)
- [ ] Intercom / Crisp chat widget installed
- [ ] Companion payment schedule established (weekly payouts)
- [ ] Dispute resolution process documented
- [ ] Incident response plan written

---

## 90-Day Post-Launch OKRs

### Objective 1: Validate Product-Market Fit
- **KR1:** 500+ registered users
- **KR2:** 60%+ of users complete at least 1 session
- **KR3:** 40%+ week-2 retention rate
- **KR4:** NPS score > 40

### Objective 2: Build Companion Supply
- **KR1:** 40+ active companions
- **KR2:** Average companion utilization > 30%
- **KR3:** Companion satisfaction score > 4.0/5
- **KR4:** < 10% companion churn rate

### Objective 3: Achieve Revenue Milestones
- **KR1:** €3,000 MRR by end of month 3
- **KR2:** 200+ paid sessions per month
- **KR3:** < €15 CAC for organic channels
- **KR4:** Positive unit economics (LTV > 3x CAC)

### Objective 4: Build Brand Awareness
- **KR1:** 50K+ website visits (cumulative)
- **KR2:** 1,000+ social media followers (combined)
- **KR3:** 5+ press/blog mentions
- **KR4:** Top 5 on ProductHunt on launch day

---

## Immediate Next Steps (This Week)

1. **Buy the domain** — `hushroom.com`
2. **Set up hosting** — Deploy production environment
3. **Create social media accounts** — @hushroom everywhere
4. **Start recruiting founding companions** — Post on LinkedIn, Reddit
5. **Set up analytics** — PostHog or Plausible
6. **Start writing first blog post** — SEO content for "online accountability partner"
7. **Join relevant communities** — Start building presence authentically
8. **Prepare ProductHunt "Upcoming" page** — Start collecting early followers

---

*This plan is a living document. Review and update weekly based on real data and feedback.*
