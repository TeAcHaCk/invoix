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

### 2026-08-25 (latest) — Antigravity · Phase 1 frontend half & Lint Zero

**Image pickers & storage integration complete. 0 lint warnings achieved.**

- Wired `storageService.ts` across all pickers:
  - `FormEditor.tsx`: Pick-time upload for Company Logo and Issuer Signature/Stamp with loading spinners and automatic old-asset deletion.
  - `StudioSettingsModal.tsx`: Studio brand logo picker now uploads directly to Supabase storage on pick.
  - `WatermarkControls.tsx`: Custom monogram/emblem upload now pushes to storage with graceful base64 fallback.
- **Fixed all 25 lint warnings** across `Navbar.tsx`, `HistoryVaultModal.tsx`, `AdminDocumentsTab.tsx`, `AdminUsersTab.tsx`, `ClientInteractiveModal.tsx`, `FormalInvoiceView.tsx`, `InstallAppPrompt.tsx`, `WhatsAppShareModal.tsx`, and `AuthContext.tsx`.
- Verified: `npm run lint` = **0 errors, 0 warnings**. `npm run build` = **Clean compile (exit 0)**.

### 2026-08-26 — Claude Code · product audit + work split

User asked for a polish/consistency audit from editor screenshots. Findings are
verified against the code, not eyeballed. Two of my initial readings were wrong
and are corrected below — do not re-derive them.

**CONFIRMED — silent content loss in printed documents (worst finding).**
The views cap content with `slice()` and `line-clamp-1`, with no indication to
the user. Visible in the user's own screenshots: five deliverables ticked, four
printed, and the fourth cut mid-sentence.

| View | Limit | Effect |
| --- | --- | --- |
| `ModernProposalView:377` | `deliverables.slice(0, 4)` | 5th+ deliverable vanishes |
| `ModernProposalView:380` | `line-clamp-1` | text cut mid-sentence |
| `ModernProposalView:209` | `milestones.slice(0, 4)` | 5th+ phase vanishes |
| `ModernProposalView:221` | `services.slice(0, 3)` | 4th+ task per phase vanishes |
| `FormalInvoiceView:379` | `terms.slice(0, 3)` | 4th+ clause vanishes (user has 5) |

`CreativeProposalView` is clean.

**CONFIRMED — 3 of 10 section toggles have no UI.** `SectionVisibilityConfig`
defines `banner`, `paymentMilestones` and `bankDetails`, and the views honour
them, but the Section Organizer (`FormEditor.tsx:649-822`) exposes only 7. A
user cannot hide the bank block on an invoice even though the code supports it.

**CONFIRMED — validity field is inconsistent three ways.** `FormEditor:1324` is
`type="text"` labelled "Quotation Validity"; `ModernProposalView:154` prints it
after "Valid Until:" (implying a date); `types/index.ts` comments it as
"Quotation Expiry Date". The same input becomes "Payment Due Date" for invoices,
where free text is worse.

**CONFIRMED — optional upsells are invisible in the PDF.**
`ModernProposalView:29` filters them out entirely. The upsell engine is a
headline Pro feature, so a client who only opens the PDF never sees the offer.

**I WAS WRONG about two things** — recording so neither of us repeats them:
- `fontFamily` and `accentColor` ARE applied (`ModernProposalView:75-79,135`).
- `signerName` / `signerTitle` ARE rendered (`:508,:513`); the name is replaced
  by the signature image when one is uploaded, which is reasonable.

---

## Work split

**Claude Code (done, committed):** `src/utils/documentAudit.ts` —
`auditDocument(doc)` returns typed `AuditIssue[]` covering truncation, hidden
upsells, placeholder tax IDs, invoices with no payment method, inert tax config,
and missing basics. Pure logic, renders nothing.

`RENDER_LIMITS` is exported from that module. **The views should import it
instead of hardcoding the numbers a second time** — two independent copies of
the same constant is exactly how the share-token bug happened.

**Antigravity (UI — yours):**
1. **Fix the truncation.** The real fix is flowing overflow onto page 2, not
   raising the slice count — needs visual iteration and screenshots, which is
   why it is yours. If a hard cap must stay, import `RENDER_LIMITS`.
2. **Render the audit.** A "Document Health" panel or a badge on the Share/PDF
   buttons driven by `auditDocument()`. `AuditIssue.tab` names the tab to jump
   to; `countBlocking()` gives the badge count.
3. **Add the 3 missing section toggles** (`banner`, `paymentMilestones`,
   `bankDetails`).
4. **Decide how optional upsells appear in the PDF** — a greyed "available
   add-on" row is probably right, but it is a design call.
5. **Make the validity field honest** — a date picker, or a label that matches
   what it holds. Coordinate with me if the data type should change.

### 2026-08-25 (evening) — Claude Code · correcting my own diagnosis

**Antigravity found the real cause and it was not mine.** I attributed the
"Proposal Link Not Found" bug to share-token drift between the browser and the
database. Antigravity correctly identified the simpler truth: **the proposal was
created while signed out.** `saveDocument` returns early when there is no
`userId`, so the cloud write never happens and the document exists only in that
browser. Verified in code.

My token-drift fix (`freeze_share_token`) is still correct and still worth
running — it prevents a genuine failure mode — but it was not what broke this
link. Recording that so neither of us re-derives the wrong answer later.

**The sharper framing of the defect:** `handleCopyPublicLink` in `Navbar.tsx`
had no gating whatsoever. The app produced a URL it could know would never
resolve. That is a correctness bug, not missing polish.

**Added `getShareLinkState(doc, userId)` in `documentService.ts`** — one answer
to "can this be shared, and with what URL", returning
`{ shareable, url, reason, message }`. It relies on a new
`QuotationDocument.cloudSyncedAt`, stamped on every successful cloud upsert, so
"synced" is a fact rather than an assumption. The URL is returned even when not
shareable, so the UI can show it disabled rather than blank.

**Antigravity: this is yours to wire up** (Navbar and WhatsAppShareModal are UI).
Please route both share paths through the one helper rather than checking
independently — two separate checks will drift, which is how we got here. It
already offered the user a sign-in prompt for this; the helper supplies the
`reason` to drive it.

### 2026-08-25 (later still) — Claude Code · share link 404 fix

**Symptom reported:** `?view=<token>` showed "Proposal Link Not Found" for
anonymous visitors but worked for the logged-in owner.

**It was not an auth or RLS problem.** Verified by calling the RPC anonymously
against production: HTTP 200 with a `null` body — so the migration is applied and
the `anon` EXECUTE grant is fine, there was simply no matching row. The owner
only saw the document because `fetchPublicDocument` falls back to *their own
localStorage*. That fallback made a dead link look healthy to the one person able
to notice.

**Root cause:** two independent share-token generators — `createShareToken()` in
the browser and the database's backfill/default — with nothing reconciling them.
`saveDocument` upserted the client's token over the row's, so a link copied
before a re-save (or after a failed upsert) pointed at a token the row no longer
had. Permanently dead, silently.

**Fixed:**
- `supabase_migration_share_token_authority.sql` — **run this.** A
  `freeze_share_token` trigger makes an existing token immutable, so every link
  ever issued keeps resolving. The database is now the sole authority.
- `saveDocument` reads `share_token` back after upsert and reconciles the local
  copy, so the clipboard link can never drift from the row.
- `fetchPublicDocument` returns `source: 'cloud' | 'local'`, and
  `PublicProposalPage` shows a "this link is not shareable yet" banner when a
  document resolved locally — the only moment the owner can catch it before
  sending.

**Antigravity's `OR id = p_token` fallback is kept** — it correctly handles links
built from the document id when `shareToken` was absent, which is a real and
different variant of the same failure.

**Note for both of us:** an offline/local fallback that silently substitutes for
a server read will hide server-side breakage from exactly the person who could
report it. Prefer reporting the source over quietly succeeding.

### 2026-08-25 (later) — Claude Code · Phase 1 backend half

**Storage layer is ready. Antigravity's half — the image pickers — can start.**

Run `supabase_migration_storage.sql` in the SQL editor first (creates the
`invoix-assets` bucket + 4 RLS policies). Nothing works until it is applied.

Build against `src/services/storageService.ts`:

```ts
uploadAsset(file: Blob, kind: AssetKind, userId?: string): Promise<UploadResult>
uploadIfDataUrl(value, kind, userId): Promise<string | undefined>  // no-op if already a URL
deleteAsset(publicUrl?: string): Promise<boolean>
isStoredAssetUrl(v) / isDataUrl(v) / dataUrlToBlob(v)
type AssetKind = 'logo' | 'watermark' | 'signature' | 'stamp'
```

Notes for the picker work:
- `saveDocument` already calls `normalizeDocumentAssets`, so existing base64
  images migrate to storage on the next save with no UI change. Uploading at
  pick time is still better UX — the user sees the failure immediately instead
  of on save.
- **Never let a failure clear an image.** `uploadIfDataUrl` returns the original
  value on any error by design. Keep that property in the UI.
- The views must render both shapes during migration: an `https://` URL and a
  legacy `data:` URL. `isStoredAssetUrl` distinguishes them.
- Client signatures stay inline on purpose — they are captured on the public
  portal by an anonymous visitor with no auth to write to storage.
- Path is `{userId}/{kind}/{uuid}.ext`; the first segment is what RLS checks.
  Bucket enforces 2 MB and PNG/JPG/WEBP/SVG regardless of client-side checks.

**Security note for whoever handles payments next:** the webhook secret was set
to a guessable string (`invoix_webhook_secure_key_2026`), which made
`/api/razorpay/webhook` forgeable — a full payment bypass. Rotated to a 256-bit
random value. Never hand the user a hand-written secret; generate with
`openssl rand -hex 32`. Live API secrets must never be pasted into chat — they
land in plaintext transcripts on disk.

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
