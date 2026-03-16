# What you need to make SupremeBeats a real business

This list is based on a pass over the codebase. It separates **must-haves** (core to money and product) from **should-haves** (trust, operations, growth).

---

## 1. Credits: use the real balance and persist deductions

**Current state:**  
- Stripe webhook correctly updates **`profiles.credits`** when users buy coins or subscribe (Pro/Elite).  
- **CreditCounter** in the dashboard shell reads **`profiles.credits`** from Supabase and shows the real balance.  
- **Studio and dashboard overview** use **JobsContext**, which keeps credits **in memory only** (starts at 1500, deducts on “Generate,” never reads from or writes to the DB). So: purchases are stored, but **generation never deducts from the database**, and after refresh the Studio again shows 1500.

**What to do:**  
- **Single source of truth:** Use **`profiles.credits`** (and Elite = unlimited) everywhere.  
- **Option A:** On load, set JobsContext initial credits from `profiles.credits` (and mic_tier); when a job is submitted, call an **API route** that deducts credits in Supabase (and returns success/fail). JobsContext then updates local state from the API response or from a refetched balance.  
- **Option B:** Remove JobsContext credit state for “remaining”; always read from profile (e.g. same API that returns credits). Deduct in the backend when a generation **starts** (or when it completes, depending on your policy).  
- Ensure **Elite** (Gold Mic) is treated as unlimited in that logic (no deduction or always allow).

**Result:** When a user buys credits or subscribes, they see the right balance; when they generate, that balance goes down and stays down after refresh.

---

## 2. Subscription renewals: refill Pro/Elite credits every month

**Current state:**  
- Webhook only handles **`checkout.session.completed`** (first purchase).  
- When a **subscription renews**, Stripe sends **`invoice.paid`** (and related events), not another checkout.session.completed. So Pro/Elite do **not** get their credits refilled on renewal.

**What to do:**  
- In the Stripe webhook, also handle **`invoice.paid`** (or **`customer.subscription.updated`**).  
- If the invoice is for a subscription and the line item matches **Pro** (or **Elite**), identify the user (e.g. from `subscription.metadata.userId` or by storing `userId` when the subscription is created) and update **`profiles`**: set **Pro** to 500 credits (or add 500), **Elite** to 999999 (or “top up” to unlimited).  
- When creating the checkout session for Pro/Elite, store **`userId`** in the subscription metadata so you can link renewals to the right profile.

**Result:** Pro users get 500 credits each month; Elite stays unlimited. Renewals are reflected in the app.

---

## 3. Real AI music generation (Phase 1 of your roadmap)

**Current state:**  
- Studio “Generate” buttons call **mock** generation (no external API). No real audio is produced or stored.

**What to do:**  
- Add an API route (e.g. **`POST /api/generate/music`**) that: loads the project (including prompt), calls your chosen provider (e.g. Replicate), downloads the audio, uploads to **Supabase Storage**, creates a **`project_asset`** with the file URL, and deducts credits (via the same backend that will become the single source of truth).  
- Wire Studio “Generate beat” / “Generate full song” to this route instead of mock.  
- Ensure **credits are deducted in the backend** when generation starts (or when it succeeds), and that the UI uses the real credit balance (see §1).

**Result:** Users get real, playable music; credits are spent in the DB; you control quality and cost.

---

## 4. Checkout: one-time vs subscription

**Current state:**  
- **Checkout** creates a session with **`mode: "subscription"`** for every request. Coin packs (100 / 500 / 1000) should be **one-time payment**, not a subscription.

**What to do:**  
- When **priceId** is for a **one-time** product (coin packs), use **`mode: "payment"`** and a single **line_item** with that price.  
- When **priceId** is for **Pro** or **Elite**, use **`mode: "subscription"`**.  
- In Stripe Dashboard, ensure coin-pack prices are **one-time** and Pro/Elite are **recurring**.

**Result:** Users are charged once for coins and monthly for Pro/Elite; no accidental subscriptions for top-ups.

---

## 5. New users: initial credits or clear paywall

**Current state:**  
- New users get **`profiles.credits = 0`** (default from migration).  
- JobsContext shows 1500 in-memory in Studio, so they can “generate” until refresh; then it resets to 1500 again. Once credits are wired to the DB (§1), new users would have **0** and could not generate unless you give them a starting balance.

**What to do:**  
- Decide policy: e.g. **“5 free credits per day”** (grant 5 when they hit 0 and it’s a new day), or **X one-time signup credits** (e.g. 50), or **no free credits** (paywall from day one).  
- Implement that in the backend (e.g. when checking/deducting credits, or a cron that tops up 5/day for free-tier users).  
- Surface it in the UI (e.g. “5 free credits daily” on the dashboard / shop).

**Result:** New users have a clear path: either a small free allowance or a clear “upgrade to generate.”

---

## 6. Customer portal (manage subscription / invoices)

**Current state:**  
- Users can subscribe but there’s no in-app way to **cancel**, **change plan**, or **download invoices**.

**What to do:**  
- Use **Stripe Customer Portal**: create a **Customer** in Stripe when they first checkout (or on signup if you want), attach subscriptions to that customer.  
- Add a **“Billing” or “Manage subscription”** link (e.g. on dashboard/settings or shop) that calls an API route which creates a **portal session** and returns the URL; open that URL in the same tab or a new one.  
- In Stripe Dashboard, enable subscription cancellation and invoice history in the portal.

**Result:** Users can cancel or change plan and see invoices without contacting you.

---

## 7. Support and contact

**Current state:**  
- No visible way for users to **contact support** or report issues.

**What to do:**  
- Add a **Contact** or **Support** link (footer, dashboard, help menu) that goes to a simple form (e.g. email to you, or a tool like Tally/Typeform) or **support@** (or help@) email.  
- Optionally add a **Help** or **FAQ** page (e.g. how credits work, how to cancel, what’s included in Pro/Elite).

**Result:** Users can get help; you reduce chargebacks and confusion.

---

## 8. Legal and trust (you’ve started)

**Current state:**  
- Terms, Privacy, data-deletion callback (Facebook), About, tutorial.  
- Refunds and dispute policy may not be clearly stated.

**What to do:**  
- In **Terms**, add a short **Refunds** section (e.g. “No refunds for used credits; contact us for subscription refunds within X days” or per your policy).  
- If you offer refunds, add a simple process (e.g. support form or email, then you refund in Stripe manually or via a small internal tool).

**Result:** Clear rules and fewer disputes.

---

## 9. Analytics and errors (optional but useful)

**Current state:**  
- No product analytics or server-side error tracking visible.

**What to do:**  
- Add basic **analytics** (e.g. Vercel Analytics, Plausible, or Posthog) for visits, signups, and key actions (e.g. “Generate” click, checkout start).  
- Add **error tracking** (e.g. Sentry) for API and client errors so you see failures and fix them quickly.

**Result:** You know how the product is used and when it breaks.

---

## 10. Scoped “nice to have” for later

- **Marketplace:** “Connect Stripe for real payments” is still scaffold; finish listing creation and purchase flow when you’re ready to monetize that.  
- **Feed / discovery:** Ensure feed loads real data (e.g. public projects/assets) and that “plays” or “likes” are stored if you show them.  
- **Admin:** Use admin queue/tools to handle support (e.g. grant credits, cancel subscription) and moderation.  
- **Email:** Transactional email (e.g. “Welcome,” “Subscription renewed,” “Credits low”) via Resend, SendGrid, or Supabase Auth emails.

---

## Priority order (suggested)

| Order | Item                               | Why |
|-------|------------------------------------|-----|
| 1     | Credits: real balance + persist deductions (§1) | Without this, purchases don’t “consume” and the economy is broken. |
| 2     | Checkout: one-time vs subscription (§4)        | Prevents wrong charges and support issues. |
| 3     | Subscription renewals (§2)                     | Pro/Elite stay correct month to month. |
| 4     | Real AI generation (§3)                        | Core product value. |
| 5     | New-user credits or paywall (§5)              | Clear first-time experience. |
| 6     | Customer portal (§6)                           | Self-serve billing. |
| 7     | Support/contact (§7)                            | Trust and support. |
| 8     | Refunds in Terms (§8)                           | Legal clarity. |
| 9     | Analytics + errors (§9)                         | Operate and improve. |

Once §1–§5 are in place, the site is **functional as a business**: users pay, credits are real, generations can be real, and renewals work. §6–§9 make it **operationally solid** and easier to scale.
