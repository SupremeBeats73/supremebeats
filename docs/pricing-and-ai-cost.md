# Pricing and AI generation cost

This doc uses your **current prices** (from the app and Stripe) and **estimated AI cost per generation** to suggest new prices so you stay profitable. It also answers: how custom/enterprise pricing works, and how your pricing compares to other music-generation sites.

---

## Your current prices (from app)

| Product            | Price   | Credits        | Effective $/credit |
|--------------------|---------|----------------|--------------------|
| 100 Supreme Coins  | $5      | 100            | $0.05              |
| 500 Supreme Coins  | $15     | 500            | $0.03              |
| 1000 Supreme Coins | $25     | 1000           | $0.025             |
| Professional       | $19/mo  | 500/mo         | ~$0.038            |
| Elite (Gold Mic)   | $49/mo  | Unlimited      | —                  |

*Source: `app/components/PricingGrid.tsx`, `app/dashboard/shop/page.tsx`. Stripe price IDs are in `.env.local`.*

---

## AI cost per generation (you pay)

| Provider / model              | Typical cost per generation |
|------------------------------|-----------------------------|
| Replicate (MusicGen)         | ~$0.05                      |
| Replicate (Stable Audio 2.5) | ~$0.05–$0.15                |
| Loudly / Soundverse (quote)  | Often ~$0.10–$0.50+ per track |

Use a **conservative** number for planning, e.g. **$0.10 per generation**. If you use Replicate only, you can refine to ~$0.05–$0.08 later.

---

## Problem with current prices (if 1 credit = 1 AI music generation)

If **1 credit = 1 generation** and your cost is **$0.10**:

- 100 coins at $5 → **$0.05 per credit** → you **lose** ~$0.05 per generation.
- 500 at $15 → **$0.03 per credit** → you **lose** ~$0.07 per generation.
- 1000 at $25 → **$0.025 per credit** → you **lose** ~$0.075 per generation.
- Professional $19/mo for 500 credits → cost 500 × $0.10 = **$50**, revenue $19 → **large loss**.

So with current pricing, you cannot absorb a ~$0.10/generation cost and stay profitable unless credits are used for things that cost much less (e.g. thumbnails only) or you change prices.

---

## Suggested new prices (target ~$0.10 cost, 2–2.5× margin)

Goal: **revenue per credit** ≈ **2–2.5× your cost per generation** so you cover cost + margin. Using **$0.10 cost**, target **$0.20–$0.25 per credit**.

| Product            | Current | Suggested (credits) | Suggested $/credit | Notes                          |
|--------------------|---------|----------------------|--------------------|---------------------------------|
| 100 Supreme Coins  | $5      | **$22**               | $0.22              | Slight volume discount          |
| 500 Supreme Coins  | $15     | **$99**               | ~$0.20             | Best value                      |
| 1000 Supreme Coins | $25     | **$179**              | ~$0.18             | Biggest discount                |
| Professional       | $19/mo  | **$29/mo** (500/mo)   | ~$0.058            | Subs need different math (below)|
| Elite (Gold Mic)   | $49/mo  | **$79/mo** or **$99/mo** | —               | Cap usage or price for “unlimited” |

**Subscription note:** For Professional, 500 credits at $0.10 = $50 cost. At $29 you still lose if every credit is music. Options: (1) raise to **$39–$49/mo** so 500 credits is profitable, or (2) keep $29 and **limit music generations** (e.g. 100 full songs/mo, rest for cheaper ops like thumbnails), or (3) give fewer included credits (e.g. 200/mo at $29). For **Elite “unlimited”**, you need a **fair-use cap** (e.g. 2,000 generations/mo) or a high price ($79–$99+) so heavy users don’t wipe out margin.

**Round numbers you could use:**

- 100 coins: **$19** or **$24**
- 500 coins: **$99**
- 1000 coins: **$179** or **$199**
- Professional: **$29/mo** or **$39/mo** (500 credits)
- Elite: **$79/mo** (with a cap, e.g. 2,000 credits/mo) or **$99/mo**

---

## Custom / enterprise pricing (Loudly, Soundverse, etc.)

- **Typical structure:** You contact sales; they quote based on volume (tracks/month), license type (basic vs full ownership), and sometimes company size. There is often a **minimum commitment** (e.g. $500–$2,000+/month or a minimum number of tracks).
- **Upfront vs as-users-generate:**
  - **Replicate:** Pure **pay-as-you-go**. No upfront; you pay per run. Fits “pay only when users generate.”
  - **Loudly / Soundverse (enterprise):** Often **monthly contract** or **prepaid credits**. You might pay a fixed monthly fee + per-track, or buy a block of tracks upfront. So you can have **upfront** (e.g. annual or monthly minimum) or **usage-based within a contract**; it’s not always “pay only when a user hits generate” with no minimum.
- **Bottom line:** For you, **Replicate = no upfront, pay as users generate**. Enterprise APIs = usually a minimum or commitment; you’d add that as a fixed cost and then spread it over your own pricing.

---

## Have other music sites used these AIs? What do they charge?

- **Suno / Udio:** They use **their own** models, not Replicate or Loudly. So we can’t say “they use the same API,” but we can compare **user-facing pricing**:
  - **Suno:** e.g. ~$8–$24/mo for hundreds to thousands of songs.
  - **Udio:** ~$10–$30/mo, credit-based.
  - **Soundraw:** ~$11–$32/mo, download limits.
- **Sites that do use APIs like Replicate or Loudly:** Many are **white-label** (no “Powered by X”); we don’t have a public list. In general, **user pricing** in the market is in the **$8–$30/mo** range for subscription and **~$0.10–$0.30 per track** for credit packs. Your **suggested** prices (e.g. $0.18–$0.22/credit) sit in that band and stay sustainable if your cost is ~$0.10.

---

## Summary

1. **Current prices** are below a ~$0.10/generation cost; raising them (as in the table above) keeps you profitable.
2. **Replicate** = pay-as-you-go, no upfront; **Loudly/Soundverse** = usually custom/enterprise with possible minimums (contact sales).
3. **Other music sites** charge in the $8–$30/mo and ~$0.10–$0.30/track range; your suggested prices are in line and margin-safe if you use the 2–2.5× rule.

Update the displayed prices in `PricingGrid.tsx` and `app/dashboard/shop/page.tsx` when you change them, and create **new Stripe prices** in the Dashboard so the IDs in `.env.local` point to the new amounts.
