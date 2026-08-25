# Invoix — Working Agreement for AI Agents

Two agents work on this repo: **Antigravity** (Gemini, in-IDE) and **Claude Code**
(CLI). This file is the shared contract. Read it at the start of every session and
append to the handoff log at the bottom before you stop.

We cannot talk to each other. We coordinate through three things only:
the git repo, this file, and the user relaying between us. Everything below
exists because of that constraint.

We *can* read each other's transcripts after the fact:

| Agent | Transcript location |
| --- | --- |
| Antigravity | `C:\Users\Admin\.gemini\antigravity-ide\brain\<session-id>\.system_generated\logs\transcript.jsonl` |
| Claude Code | `C:\Users\Admin\.claude\projects\d--Product-build\<session-id>.jsonl` |

Both are JSONL, one object per line. Read the other agent's log when you need the
reasoning behind a change, not just the diff.

---

## The product, in one paragraph

**Invoix** — multi-industry quotation / proposal / invoice SaaS. React 19 · Vite 8 ·
TypeScript 6 · Tailwind 4 · Supabase (auth + Postgres) · Razorpay · PWA.
Live at `invoix.app` on Vercel. Repo `github.com/TeAcHaCk/invoix`, branch `main`.
Free / Pro (₹499/mo) / Agency (₹1,499/mo). Target market: India **and**
international. The paid pitch is the interactive client link — e-signature,
upsell add-ons, view tracking — not invoice creation, which is a race against
free tools.

---

## Division of labour

Split by actual capability, not preference.

### Antigravity owns
- UI and UX: components, layout, styling, visual polish
- **Visual verification** — it can drive a browser and take screenshots.
  Claude Code cannot see a rendered page, so any change whose correctness is
  visual is Antigravity's to confirm.
- Rapid feature prototyping and scaffolding
- Anything needing the user's live IDE context

### Claude Code owns
- Security: RLS policies, auth, privilege boundaries
- Database: schema, migrations, SQL functions
- Serverless / payments: everything under `api/`
- Root-cause debugging of cross-cutting or intermittent bugs
- Pre-deploy review of the other agent's work

### Both must
- Run `npm run build` and `npm run lint` before declaring anything done
- Report honestly what was and was not verified — say "I could not check this"
  rather than implying it was tested

---

## Hard rules

1. **Never both work the tree at once.** This has already caused problems:
   during one Claude Code session, `FormalInvoiceView.tsx` and `cryptoAudit.ts`
   changed on disk mid-analysis. One agent at a time. The user decides who holds
   the token.
2. **Commit before handing off.** A clean `git status` is the handoff signal.
   Never leave uncommitted work for the other agent to trip over.
3. **Do not "fix" the other agent's work without reading why it is that way.**
   Check this file's landmine list and the other agent's transcript first.
4. **Never revert a security control to make a feature work.** Raise it instead.
5. **Never add a `VITE_` prefix to a secret.** That inlines it into the browser
   bundle. Server-only vars live unprefixed in Vercel and are read in `api/`.

---

## Landmines — bugs that have already bitten, do not reintroduce

Each of these shipped once and cost real debugging time.

- **Two sources of truth for "signed."** `documents.status` drifted from
  `document_data.signatory.clientSignedName`, so the server refused to sign
  proposals the UI showed as unsigned. Signed-ness is decided by the signature,
  never by the status column. See `supabase_migration_signature_integrity.sql`.
- **`overflow-hidden` / `text-ellipsis` on a flex item** sets `min-width: 0`,
  letting it shrink below its content. It truncated the tax label to `VAT (10…`
  while a *longer* sibling label rendered fine. Use `whitespace-nowrap` alone.
- **`html-to-image` cannot see the page's stylesheets.** It rasterises through an
  SVG `foreignObject`, so `document.fonts.ready` does not help. Without
  `getFontEmbedCSS` the PDF silently falls back to a wider font and rows wrap
  that look fine on screen.
- **`.print-page` uses `min-height`, so pages overflow A4.** The PDF fit logic
  must scale to full width and flow overflow onto extra sheets — fitting by the
  overflowing axis shrinks content to ~86% and centre-floats it with white
  gutters. That was the long-running "alignment" bug.
- **Silent catch reporting success.** `saveDocumentToVault` swallowed a full
  localStorage into `console.error` and the caller returned `success: true` —
  the user got confetti while their work was discarded. If a write can fail,
  return the failure.
- **Client-side plan writes.** The browser must never write `profiles.plan` or
  `role`. Only the service-role webhook may, via `api/razorpay/`.
- **Enumerable share links.** Document ids are `doc_<timestamp>`. Public links
  key on `share_token`, never the id.

---

## Open work

- **Blocked on Razorpay KYC:** set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
  `RAZORPAY_WEBHOOK_SECRET` in Vercel; create the `payment.captured` webhook.
  Until then `/api/razorpay/order` returns 500 — expected, not a regression.
- **Images bloat localStorage.** Every vault document embeds base64 for logo,
  watermark and both signatures — roughly 150–300 KB each against a ~5 MB cap,
  so ~20–30 documents fills it. "Unlimited Documents" is a Pro promise
  localStorage cannot keep. Fix: upload once to Supabase Storage, reference by URL.
- **Vector PDF.** Text is still rasterised — not selectable, files are large.
  Needs either `window.print()` (free, but hands the user a print dialog) or
  server-side Puppeteer. A UX trade-off, not a defect.
- **25 lint warnings**, incl. 10 `set-state-in-effect` and 2 `purity`
  (`Date.now` / `Math.random` during render in `HistoryVaultModal`).
- **No tests.** Worth pinning three: Razorpay signature verification, plan/amount
  resolution, and the total recomputation inside `sign_document`.

---

## Handoff log

Newest first. One entry per session. Keep it to what the next agent needs.

### 2026-08-25 — Claude Code
Hardened storage and crash handling. `vaultStorage` now returns a result instead
of swallowing quota errors; `documentService` distinguishes "cloud saved, local
full" (safe) from "neither saved" (data loss); `App.tsx` shows a persistent
banner instead of confetti on failure. Added `ErrorBoundary`, with a separate
client-facing fallback on the public proposal route. Committed as `e5f6c13`.
Not done: the base64-in-localStorage root cause, lint warnings, tests.

### 2026-08-24 — Claude Code
Security and payments. Two migrations written (`supabase_migration_hardening.sql`,
`supabase_migration_signature_integrity.sql`) closing a self-upgrade hole and a
world-readable/writable `documents` table. Moved Razorpay server-side under
`api/`. Fixed the PDF page-fit bug, the tax-label wrap, and the logo (3.77 MB →
148 KB). **Migrations still need running in the Supabase SQL editor** — Section 7
of the hardening file bootstraps the admin account and must be run in the same
session or admin access is lost.

### 2026-08-22 → 08-23 — Antigravity
Built the product: cloud sync, admin panel, UI overhaul, Invoix rebrand, Vercel
deploy, SEO/GA4/AdSense, Razorpay checkout UI, Pro gating, client signing,
custom template designer.
