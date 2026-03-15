# Music production roadmap: SupremeBeats vision

This doc outlines how to evolve SupremeBeats Studio into **your own** AI music creation and production platform: the same kind of experience as tools like Suno and BandLab, but **fully on SupremeBeats**, with **user ownership**, and **original to your vision**. No dependency on any single third‑party product or brand.

---

## Core principles

1. **Everything in one place**  
   Users create, store, edit, and manage their music on SupremeBeats. The only “leave the site” step is distribution (e.g. sharing to YouTube). No “generated on X, stored on Y.”

2. **Users own what they make**  
   All generated and uploaded audio lives in **your** storage (Supabase). Your Terms of Service grant users clear ownership/license to their creations. No fuzzy “hosted elsewhere” rights.

3. **Original and unique**  
   The product is SupremeBeats, not “powered by [vendor].” You choose an AI generation backend that allows **white‑label / commercial use** and does not require branding or “made with X” in the UI. The experience and vision are 100% yours.

4. **Same capability, your stack**  
   You want the *kind* of experience (prompt → full track, stems, DAW-style editing) that users get from products like Suno and BandLab—but delivered as **one coherent product** on your site.

5. **Top-quality output**  
   Generated music should be **high fidelity and professional**—not obviously “AI” or low-bit. Prioritize model/API choice and settings (sample rate, length, style) so output meets a high bar.

6. **No third-party memberships for users**  
   Users do **not** need to pay or sign up for Suno, Udio, or any other service. **SupremeBeats is the only place they pay** (or use for free). The platform absorbs the cost of the AI backend (your API bill or self-hosted inference). You can monetize via SupremeBeats credits, subscription, or freemium—but there is no “link your Suno” or “subscribe to X to generate.”

---

## Quality & pricing in practice

- **Quality:** Choose a **top-tier** text-to-music model or API (e.g. state-of-the-art open models, or a premium API known for quality). Avoid “good enough” or cheapest options if they sound thin or robotic. Test output at the quality level you want before committing. Self-hosted high-quality models (e.g. latest MusicGen, Stable Audio, or future SOTA open models) or premium APIs give you control over quality.
- **No extra memberships:** Your backend calls the AI provider; **you** pay per request or via your own infra. Users only consume SupremeBeats credits or features. They never see “Sign up for Suno” or “This generation used [external service].” Your pricing (credits, subscription, free tier) is entirely up to you and stays inside SupremeBeats.

---

## Current state

- **New project:** Form with genre, BPM, key, mood, duration, instruments; optional “describe your track” prompt. Projects stored in Supabase.
- **Studio:** Generate cards (beat, full song, vocals, stems, variations, thumbnail, cover art, video, YouTube package). All generation is **mock** — no AI backend connected yet.
- **Workspace:** Placeholder waveform, track lanes, playback UI (non-functional), project assets list. No real audio playback or timeline editing.

---

## Target experience (your product, not Suno/BandLab by name)

| AI generation (Suno-*style*) | Production (BandLab-*style*) |
|------------------------------|-----------------------------|
| Describe your song in words → AI generates full tracks or stems | Multi-track timeline: arrange clips, mix |
| Style/mood/genre from your project settings | Per-track volume, pan, mute/solo |
| Fast generate-and-iterate, all inside SupremeBeats | Mixer, export to WAV/MP3 from your site |
| Output stored in **your** storage; user owns it | Collaboration (Collabs) on your platform |

So the product supports:

1. **Prompt → AI track** — User writes a description (or uses project “describe your track”); your backend calls an AI music API that **allows commercial use and user ownership**; the **result is saved to Supabase Storage** and attached to the project. User sees it only as “SupremeBeats generated this for you.”
2. **Arrange & mix** — Real waveform/timeline on your site, playback, export. All files are in your storage; user downloads or shares from SupremeBeats.

---

## What you control in-app

- **Prompt and metadata** — “Describe your track,” genre, BPM, mood: already in place; your API route sends these to whichever AI provider you choose.
- **Storage and ownership** — Every generated (or uploaded) file is written to **Supabase Storage** under the user’s project. You never expose “this came from provider X.” Your ToS state that users own their content; you just need a provider whose terms allow you to grant that.
- **Branding and UX** — All UI is SupremeBeats. No “Powered by …” unless you choose to add it. The experience is original to your vision.
- **Workspace and playback** — Timeline, waveforms, play/pause, export: built with Web Audio, wavesurfer.js, Tone.js, or similar. No need to embed another company’s DAW.

---

## Choosing an AI generation backend (invisible to users)

You need a **text-to-music (and optionally stem)** API that:

- Allows **commercial use** and **white‑label** (no required attribution in the product).
- Lets you **download or receive the audio file** so you can **store it in Supabase** and show it only as “your” output.
- Ideally has clear terms that you can flow through to users (e.g. “you own what you create on SupremeBeats”).

Then you:

- Call that API from **your** backend (e.g. Next.js API route).
- Upload the returned audio to **Supabase Storage**.
- Create a `project_asset` with the **Supabase URL** (not the provider’s URL).
- Never show the provider’s name in the UI unless you want to.

**Examples of the *kind* of options** (terms and availability change; verify before committing):

- **Replicate** — MusicGen, Stable Audio, etc. You get a file URL; you download and re-upload to Supabase. Check their commercial and attribution terms.
- **Other text-to-music APIs** — Any provider that gives you a file and allows you to store it and grant users rights. Research “AI music API commercial use” and “white label.”
- **Self-hosted / your own model** — Maximum control and originality; much higher engineering cost. Possible later if you want the stack to be fully yours.

The roadmap below assumes “your API route + any such provider + Supabase Storage”; the user experience is identical regardless of which provider you pick.

---

## Suggested phases

1. **Phase 1 – AI generation (your backend, your storage)**  
   - Add an API route (e.g. `POST /api/generate/music`) that: accepts project id and generation type (beat / full_song / etc.), loads project (prompt, genre, BPM, mood), calls your chosen AI provider, **downloads the audio**, **uploads to Supabase Storage**, creates a `project_asset` with the **Supabase URL**, and uses your existing credits/jobs.  
   - Replace `mockGenerate` for beat/full_song with calls to this route.  
   - Users only ever see “Generated by SupremeBeats” and their file in their project; they have everything in one place and own it per your ToS.

2. **Phase 2 – Real playback and timeline**  
   - Playback using `project_assets.url` (your Supabase URLs).  
   - Workspace: load assets into lanes, real play/pause, seek, time display (e.g. Web Audio or wavesurfer.js).  
   - Still 100% on your site.

3. **Phase 3 – DAW-style editing and export**  
   - Timeline regions, per-track volume, mute/solo, export to WAV/MP3.  
   - Export can be client-side or a backend mix; either way, the final file is served from your storage and belongs to the user on SupremeBeats.

4. **Phase 4 – Collaboration and polish**  
   - Collabs, sharing, optional real-time or comments.  
   - All shared content stays on your platform; only distribution (e.g. “Share to YouTube”) goes external.

---

## Summary

- You want a **Suno-like + BandLab-like experience** but **not** Suno or BandLab as products: same capability, **everything in one place on SupremeBeats**, **user ownership**, and **your original vision**.
- Achieve it by: (1) using an AI provider that allows white‑label and commercial use and lets you store outputs yourself; (2) **storing every generated (and uploaded) file in Supabase**; (3) never surfacing the provider’s brand in the UI; (4) building playback, timeline, and export on your side so the product is coherent and unique.

See `app/dashboard/studio/` and `app/context/ProjectsContext.tsx` for where to replace mock generation with your API route. When you add that route, the “describe your track” prompt and project metadata are already there to drive generation.
