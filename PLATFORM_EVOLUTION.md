# Platform Evolution Roadmap

> **Vision**: Sweet Dreams Music becomes the gold-standard reference implementation of a recording studio platform, then is productized into a multi-tenant SaaS that other studios run on — with Sweet Dreams earning recurring revenue from every studio on the network.

**Status**: Planning (not yet started)
**Owner**: Cole Marcuccilli
**Last updated**: 2026-04-16

---

## Guiding Principles

1. **Don't break what works.** Every phase ships behind feature flags or additive migrations. Sweet Dreams' live operations must continue uninterrupted through the entire evolution.
2. **Dogfood first.** Every feature is proven at Sweet Dreams before it ships to other studios. Phase 1 must be complete and stable before Phase 2 begins.
3. **Sell the platform, not the code.** We are building a SaaS, not shipping a GitHub repo to each studio. Multi-tenant from day one of Phase 2.
4. **Tenant data isolation is non-negotiable.** One studio must never see another studio's bookings, engineers, clients, or payouts. RLS + `studio_id` scoping on every query.
5. **Studio owner experience is the product.** Other studio owners aren't engineers. The admin UI has to teach them how to run a business, not just process data.

---

## Phase 1 — Strengthen the Core (Sweet Dreams only)

**Goal**: Close the loops that still require manual work at Sweet Dreams. Prove the platform can run a real studio end-to-end with minimal operator input. This phase is the reference implementation.

**Definition of done**: Sweet Dreams operates for 30 consecutive days with zero manual-only admin workflows for routine operations (pay stubs auto-generate, stats auto-pull, clients self-serve prep). Monthly accounting close takes under 1 hour.

### 1A. Artist Hub 2.0

Currently users manually enter their Spotify monthly listeners, follower counts, etc. We replace that with real integrations and turn the hub into a guided development path.

**Work items**:

- **Streaming & social integrations** (automated stat pulling)
  - Spotify for Artists API — monthly listeners, streams, top cities, playlist placements
  - Apple Music for Artists API — plays, Shazams, listeners
  - YouTube Data API — subscribers, views, top videos
  - Instagram Graph API — followers, reach, engagement
  - TikTok Creator API — followers, views, engagement
  - SoundCloud API — plays, likes, reposts
  - Daily cron pulls snapshots; historical data lets us compute growth rates
- **Guided development curriculum**
  - Educational modules: "Releasing your first single," "Getting on editorial playlists," "Building a fanbase on TikTok," "Pitching to blogs," "Running a release rollout"
  - Each module = 3–10 short lessons + checklist items that award XP
  - Modules unlock based on career stage (Beginner → Emerging → Established)
- **Career stage milestones**
  - Explicit thresholds (e.g., 1K monthly listeners → "Emerging Artist," 10K → "Established")
  - Each milestone recommends 3–5 concrete next actions pulled from the curriculum
  - Progression is automatic once tracked metrics hit the threshold
- **Session prep workflow** *(already partially built — `/dashboard/prep/[id]` exists)*
  - Polish: make prep required 24hr before session, engineer sees prep before session
  - Add reference track library (links, uploads)
  - Add lyric/lyrics-pad pre-save so it auto-loads in the session

**Technical prerequisites**:
- OAuth flows for each platform (store refresh tokens per user)
- New tables: `artist_metrics_snapshots`, `curriculum_modules`, `curriculum_progress`
- Cron: `/api/cron/fetch-artist-metrics` (daily, staggered per platform rate limits)

**Risk**: Spotify for Artists API access requires approval; Instagram/TikTok APIs have strict app-review processes. Budget 2–4 weeks for approvals alone.

### 1B. Accounting 2.0

Current state: admin can view revenue and see payouts owed. Missing: actual generated pay stubs (PDFs), business-level reports, tax docs, expense tracking.

**Work items**:

- **Generated pay stubs (PDF)**
  - Per-person, per-pay-period PDF with gross pay, deductions (if any), net pay, revenue breakdown (sessions, beats, media)
  - Emailed to employee on payout execution
  - Archived in `/dashboard/paystubs` (employee view) and admin's payroll tab
- **Monthly business reports**
  - P&L statement (revenue by source, cost of services, gross profit)
  - Balance sheet (cash on hand, receivables, payables, equity)
  - Cash flow statement (operating, investing, financing)
  - Auto-generated first of each month, emailed to admin
- **Expense tracking**
  - New table: `business_expenses` (category, amount, vendor, date, receipt_url, recurring)
  - Categories: Rent, Equipment, Utilities, Software, Marketing, Supplies, Insurance, Other
  - Recurring expenses auto-logged each month
  - Receipt upload via photo (OCR later)
- **Tax document prep**
  - 1099-NEC generation for contractors (engineers, producers) earning >$600/yr
  - Quarterly estimated tax tracker (based on YTD profit)
  - Year-end summary for CPA
- **Cash flow projections**
  - Based on booked sessions, recurring expenses, historical trends
  - 30/60/90 day projections
  - Alerts when projected balance drops below threshold

**Technical prerequisites**:
- PDF generation library (react-pdf or pdfkit on server)
- New tables: `business_expenses`, `paystub_records`, `tax_documents`
- Cron: `/api/cron/generate-monthly-reports` (1st of month)

**Risk**: 1099 generation requires accurate contractor info (SSN/EIN, address). Need legal review of generated docs before distribution.

### Phase 1 acceptance criteria

- [ ] All 6 streaming/social platforms integrated and pulling daily
- [ ] At least 5 curriculum modules published with completion tracking
- [ ] Career stage auto-progression working for Sweet Dreams test accounts
- [ ] PDFs generated for every payout in last 30 days
- [ ] Monthly P&L auto-generated and matches manual calculation
- [ ] Expense tracking used for Sweet Dreams' actual rent + utilities + 10+ other expenses for one full month
- [ ] 1099 draft generated for every contractor who earned >$600 in the test year
- [ ] Admin time on monthly close reduced to <1 hour (baseline: measure current, target: -70%)

---

## Phase 2 — Multi-Tenant Architecture

**Goal**: Convert the single-studio platform into a SaaS that supports many studios from one deployment. Sweet Dreams becomes tenant #1, not the whole system.

**Definition of done**: Two active studios running on the same deployment, with fully isolated data, separate Stripe payouts, branded domains, and a working super-admin dashboard.

### 2A. Data model migration

Every tenant-scoped table gets a `studio_id` column. Every RLS policy gets a tenant check.

**Work items**:

- **Schema**: new top-level `studios` table
  - Columns: `id`, `name`, `slug`, `domain` (custom), `subdomain` (fallback), `logo_url`, `brand_color_primary`, `brand_color_accent`, `email_from`, `stripe_account_id`, `timezone`, `address`, `phone`, `billing_plan`, `billing_status`, `created_at`
- **Add `studio_id` to every tenant-scoped table**:
  - `bookings`, `profiles`, `beats`, `beat_purchases`, `private_beat_sales`, `media_sales`, `payouts`, `payout_line_items`, `xp_log`, `artist_metrics_snapshots`, `business_expenses`, `paystub_records`, `session_blocks`, `studio_rates`, engineer-related tables, etc.
- **Backfill**: all existing rows get Sweet Dreams' `studio_id`
- **RLS policies**: every policy gets `AND studio_id = current_setting('app.current_studio_id')::uuid`
- **Helper**: middleware sets `app.current_studio_id` per request based on incoming domain/subdomain

**Technical prerequisites**:
- Migration script that's reversible and runs against live prod
- Blue/green or long-running background migration for large tables
- Service client code must explicitly scope queries to `studio_id` (can't rely on RLS alone since we use service client in many admin paths)

**Risk**: This is the highest-risk phase. Any missed `studio_id` scope = data leak between tenants. **Needs an exhaustive query audit before deploy.** Every single `.from('xxx')` in the codebase must be inspected.

### 2B. Per-tenant configuration

Each studio has its own rooms, rates, hours, engineers, branding.

**Work items**:

- **Configurable rooms & rates** (currently hardcoded in `lib/constants.ts`)
  - New tables: `studio_rooms` (per-studio list), `studio_rates` (per-room hourly/package pricing), `studio_hours` (open/close per day of week)
  - Admin UI: "Studio Settings" tab where owner can add rooms, set rates, define hours
- **Engineer roster per studio**
  - Already partially scoped via `profiles.role` — add `studio_id` filter
  - Each studio manages their own engineer invitations, roles
- **Branding**
  - Logo upload (stored in studio-specific Supabase storage path)
  - Primary + accent color (applied via CSS variables at runtime)
  - Studio name shown in nav, emails, PDFs, license agreements
- **Domain & subdomain routing**
  - Catch-all: `{slug}.sweetdreamsplatform.com` always works
  - Custom domains via Vercel's Domain API (tenant adds CNAME → we verify → we add to Vercel project)
  - Middleware resolves domain → `studio_id` → sets request context
- **Email sender identity**
  - Per-studio Resend sender (verified domain for pro tiers)
  - From address: `{studio_slug}@mail.sweetdreamsplatform.com` (shared domain) or `bookings@{studio_custom_domain}` (custom domain tier)

**Technical prerequisites**:
- Vercel domain management API integration
- Resend multi-tenant sender setup
- Feature-flagged rollout: Sweet Dreams runs on `sweetdreamsmusic.com` (custom), Studio #2 on `{slug}.sweetdreamsplatform.com`

### 2C. Stripe Connect

Each studio gets their own Stripe account. Sweet Dreams (platform) takes a platform fee on every transaction.

**Work items**:

- **Onboarding**: new studio completes Stripe Connect Express onboarding during signup
- **Checkout**: all Stripe checkouts route through the studio's Connected account with `application_fee_amount` for platform cut
- **Webhook**: platform webhook endpoint + per-studio webhook registration
- **Payouts**: each studio receives payouts directly into their own bank; Sweet Dreams receives platform fees separately
- **Refunds**: refund tool in admin that handles Connect refund flow correctly

**Technical prerequisites**:
- Stripe Connect setup + review by Stripe
- Rework all existing Stripe checkout calls to include `stripe_account` header
- Webhook endpoint verification per connected account

**Risk**: Stripe Connect has approval/KYC requirements. Each studio goes through KYC. Pricing decision needed: platform fee percentage vs flat monthly subscription vs hybrid.

### 2D. Super-admin dashboard

Sweet Dreams sees everything across all studios.

**Work items**:

- New route: `/super-admin` (only accessible to Sweet Dreams super-admins)
- Views:
  - All studios with health metrics (MRR, active users, bookings/month, churn risk)
  - Drill into any studio's data (read-only)
  - Platform MRR, churn, LTV, CAC
  - Support ticket inbox
  - Announcement broadcaster (push updates to all studios)
- Actions:
  - Suspend/reactivate a studio
  - Adjust a studio's plan
  - Override anything in emergencies (audit-logged)

### Phase 2 acceptance criteria

- [ ] Zero queries that don't scope by `studio_id` (audited via grep + code review)
- [ ] Sweet Dreams runs as studio #1 with no user-facing differences
- [ ] A test studio #2 runs on a subdomain with its own rooms, rates, engineers, Stripe account
- [ ] Super-admin dashboard shows both studios' health
- [ ] Pentesting: logged in as Studio #2 admin, cannot access any Studio #1 data
- [ ] 7 days of parallel running with both studios before inviting beta customers

---

## Phase 3 — Studio Business Operations

**Goal**: Make the platform actively teach studio owners how to run a business. Most studio owners are musicians, not operators — we close that gap.

**Definition of done**: A new studio owner can complete onboarding, learn the business fundamentals, and be operationally competent within 2 weeks without prior business experience.

### 3A. Business Education Hub

Like the artist curriculum in Phase 1A, but for studio owners.

**Modules**:
- Revenue stream diversification (sessions, beats, media, merch, events, room rentals, classes)
- Tax fundamentals for small businesses (entity types, deductions, quarterly estimates)
- Equipment investment ROI (when to buy vs rent, depreciation, insurance)
- Marketing playbook (local partnerships, social media, referral programs, SEO)
- Client retention strategies (follow-ups, loyalty, re-engagement)
- Pricing psychology & rate-setting
- Hiring & managing engineers/contractors
- Legal basics (contracts, liability, business insurance)

**Delivery**:
- Short video lessons + written transcripts + downloadable templates
- Certification track: complete modules → "Sweet Dreams Platform Certified Studio Owner" badge
- Community forum where studio owners share tactics

### 3B. Operational Tools

**Work items**:

- **Expense categories & tracking** (built in Phase 1B — now formalized for all studios)
- **Equipment inventory**
  - New table: `equipment_items` (name, category, purchase date, cost, condition, location, warranty_expires)
  - Maintenance schedule reminders
  - Depreciation tracking
- **Room utilization analytics**
  - % of available hours booked per room per week/month
  - Revenue per available hour
  - Heatmap: time-of-day and day-of-week demand
  - Suggestions: "Your Tuesday 2pm slot books 15% of the time — consider a promo"
- **Client lifetime value**
  - Per-client revenue across all time
  - Average session count, interval between sessions
  - Churn indicator: clients who haven't booked in 90 days
- **Seasonal trend analysis**
  - YoY comparison by month
  - Identify peak/slow seasons
  - Budget planning for slow months

### Phase 3 acceptance criteria

- [ ] 12+ business education modules published
- [ ] Certification track has been completed by at least 3 non-Sweet-Dreams studio owners
- [ ] Equipment inventory used by at least 5 studios for real equipment tracking
- [ ] Room utilization dashboard shows actionable insights (studios report using it to change their schedules)
- [ ] CLV calculations used by at least 3 studios in real decisions

---

## Phase 4 — Marketplace & Scale

**Goal**: Network effects. Every new studio makes the network more valuable.

### 4A. Cross-studio producer marketplace

- Producers on one studio can opt their beats into the network marketplace
- Beats appear in every participating studio's beat store
- Revenue split: producer / host studio / platform (e.g., 55 / 30 / 15)
- Producer chooses which studios their beats appear on (default: all)

### 4B. Engineer talent marketplace

- Freelance engineers list themselves with specialties, rates, availability
- Studios without a full roster can request a freelance engineer for a booking
- Engineer chooses which studios they're available to
- Studio pays platform, platform pays engineer minus fee

### 4C. Industry benchmarks

- Anonymized cross-studio data: average session rate in your region, average beat lease price by genre, utilization rates for rooms like yours
- Studio owners see how they compare to peer benchmarks
- Drives decisions (raise prices? extend hours? hire?)

### 4D. Platform analytics (for Sweet Dreams as SaaS operator)

- MRR, churn, expansion revenue, CAC, LTV
- Studio health scores (booking volume trend, engineer count, beat sales, admin activity)
- Predictive churn (studios trending down get outreach)
- Feature adoption tracking (which modules are used, which aren't)

### Phase 4 acceptance criteria

- [ ] Cross-studio producer marketplace live with 20+ producers opted in
- [ ] First freelance engineer booking completed across two studios
- [ ] Industry benchmarks show anonymized data from 10+ studios
- [ ] Platform analytics dashboard running on real MRR data

---

## Sequencing & Dependencies

```
Phase 1A (Artist Hub 2.0) ────────┐
Phase 1B (Accounting 2.0) ────────┤
                                   ├──→ Phase 2A (Data Model)
                                   │        │
                                   │        ├──→ Phase 2B (Per-Tenant Config)
                                   │        ├──→ Phase 2C (Stripe Connect)
                                   │        └──→ Phase 2D (Super-Admin)
                                   │                 │
                                   │                 └──→ Phase 3A (Education Hub)
                                   │                 └──→ Phase 3B (Ops Tools)
                                   │                              │
                                   │                              └──→ Phase 4 (Marketplace)
```

**Non-negotiable ordering**:
1. Phase 1 must complete before Phase 2. Multi-tenant features we haven't proven at Sweet Dreams first will burn us at other studios.
2. Phase 2A (data model) blocks all other Phase 2 work.
3. Phase 2C (Stripe Connect) must complete before onboarding any paying studio.
4. Phase 4 requires 10+ studios on the platform to have meaningful network effects.

---

## Out of Scope (for now)

- Mobile apps (web-first; PWA later)
- On-prem/self-hosted deployments (cloud SaaS only)
- Internationalization (US-only until Phase 4)
- Live streaming / remote collaboration tools
- AI features (explicitly deferred — build the business first)

---

## Open Questions (to resolve before each phase starts)

**Phase 1 questions**:
- Spotify for Artists API timeline — when to start the application process?
- Do we need legal review on generated 1099s and P&Ls before distributing?
- Curriculum content: hire a content creator or write ourselves?

**Phase 2 questions**:
- **Pricing model**: flat monthly ($X/studio/month), revenue share (X% of each transaction), or hybrid (small base fee + small transaction fee)?
- Custom domain tier vs subdomain-only tier?
- Data isolation level: shared DB with `studio_id` (current plan) vs separate Supabase project per studio (more expensive, more isolated)?
- Where does super-admin run — same app at `/super-admin`, or separate app at `admin.sweetdreamsplatform.com`?

**Phase 3 questions**:
- Who produces the education content? In-house, contracted creators, or partner with an existing business school?
- Certification: self-paced or cohort-based?

**Phase 4 questions**:
- Cross-studio marketplace revenue split percentages — need data before deciding
- Engineer marketplace: do we carry insurance for freelance engineers, or require them to carry their own?

---

## Success Metrics

**Phase 1**: Sweet Dreams monthly admin time reduced by 70%. Zero manual pay stub generation. Zero manual stats entry.

**Phase 2**: Studio #2 onboarded and operating independently. Zero data leak incidents. <5% of Sweet Dreams admin workflows broken by multi-tenant changes.

**Phase 3**: 3+ non-founder studios report that the education hub directly changed a business decision they made. Average new-studio onboarding-to-profitability timeline < 90 days.

**Phase 4**: 10+ studios on the platform. Cross-studio marketplace transactions > 20% of total platform GMV. Platform MRR growth > 20% month-over-month for 3+ consecutive months.
