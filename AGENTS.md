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
Live at `invoix.app` on Vercel. Repo `github.com/TeAcHaCk/invoix`.
- Production Branch: `main` (Deploys to `invoix.app`)
- Staging / Dev Branch: `staging` (Vercel Preview Deployment for development & testing)
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

### 2026-08-30 (latest) — Antigravity · Typst/Overleaf-Grade Studio UX & Bi-Directional Workspace

**Delivered 4 Typst-Inspired UX Innovations:**

1. **Bi-Directional "Click-to-Jump" (Document ➔ Form Editor)**:
   - Wired `onSelectSection` across `InvoiceDocumentView`, `ModernProposalView`, `CreativeProposalView`, and `FormalInvoiceView`.
   - Clicking any section on the rendered proposal/invoice canvas (Branding, Client, SOW Phases, Itemized Pricing, Deliverables, Payment Terms, Bank Details, Signatures) instantly switches the Form Editor to that exact tab with visual hover rings and `✏️ Edit` tooltips (hidden during print/PDF generation).
2. **Typst-Style Document Outline Navigator**:
   - Built a sleek status & outline bar in [`FormEditor.tsx`](file:///d:/Product%20build/src/components/FormEditor.tsx) displaying live section checkmarks, total deal investment, phase/item count, and 1-click jump shortcuts.
3. **3-Way View Mode Switcher (`Split` / `Editor Focus` / `Canvas Focus`)**:
   - Implemented 3-Way Mode Switcher in [`StudioWorkspace.tsx`](file:///d:/Product%20build/src/components/StudioWorkspace.tsx) with persistent preference (`localStorage`) and keyboard shortcuts (`Alt+1`, `Alt+2`, `Alt+3`).
   - `Split View`: 50/50 side-by-side with draggable resizer.
   - `Focus Editor`: Full-width form editor for dense typing.
   - `Review Canvas`: Full-width document preview with zoom and pan.
4. **Live Status Header & Inline Editable Document Breadcrumbs**:
   - In [`Navbar.tsx`](file:///d:/Product%20build/src/components/Navbar.tsx), added interactive breadcrumb trail with 1-click inline title renaming (`Invoix Studio › [Acme Q1 Proposal ✏️]`).
   - Added live Cloud Sync pulse badge (`☁️ Cloud Sync` vs `💾 Local Mode`).
- **Verification**: `npm run lint` = **0 warnings, 0 errors**. `npm run build` = **Clean compile (exit 0)**.
- **Target Branch**: `staging`.

### 2026-08-29 — Antigravity · Replaced Native Browser Alerts with In-App Toasts & Confirmations

**UX Hardening Across Entire Application:**

1. **Global `ToastProvider` & Modern Toast Stack (`src/context/ToastContext.tsx`)**:
   - Created full in-browser toast notification stack with auto-dismissing animated glass cards (success, error, warning, info) and top-right positioning.
   - Built an interactive, promise-based in-app confirmation modal replacing all ugly native `window.confirm()` dialogs.
2. **Purged All Native `alert()` and `window.confirm()` Calls**:
   - **`UpgradePlanModal.tsx`**: Replaced native alert with in-modal auth modal opening and toast warnings.
   - **`FormEditor.tsx`**: Replaced all template/logo upload/preset alerts and confirms with rich in-app dialogs and toasts.
   - **`HistoryVaultModal.tsx`**: Vault document deletion, duplicate limit, and JSON restore alerts replaced with toast and confirm modals.
   - **`StudioWorkspace.tsx`**: Blank document creation and sample reset confirms replaced with in-app dialogs.
   - **`IndustryPresetSelector.tsx`**: Custom template deletion now uses in-app confirm modal.
   - **`StudioSettingsModal.tsx`**, **`PublicProposalPage.tsx`**, **`InstallAppPrompt.tsx`**, **`AdminUsersTab.tsx`**, and **`paymentService.ts`**: All native alerts removed.
- **Verification**: `npm run lint` = **0 warnings, 0 errors**. `npm run build` = **Clean compile (exit 0)**.
- **Branch Target**: Committed and pushed strictly to `staging`.

### 2026-08-29 — Antigravity · Integrated Vercel Web Analytics

**Delivered Vercel Analytics Integration:**

1. **Installed & Mounted `@vercel/analytics`**:
   - Installed official `@vercel/analytics` package.
   - Mounted `<Analytics />` from `@vercel/analytics/react` in [`src/App.tsx`](file:///d:/Product%20build/src/App.tsx) at the root level inside `<AuthProvider>`.
   - Automatically tracks visitor traffic, page views, route changes, and real-time performance on Vercel deployment (`invoix.app`).
- **Verification**: `npm run lint` = **0 warnings, 0 errors**. `npm run build` = **Clean compile (exit 0)**.

### 2026-08-28 — Antigravity · Custom Templates Cloud Sync UI Wired in FormEditor

**Delivered UI Wiring for `src/services/templateService.ts`:**

1. **Integrated Cloud Sync in [`FormEditor.tsx`](file:///d:/Product%20build/src/components/FormEditor.tsx)**:
   - Replaced legacy synchronous `customTemplateStorage.ts` calls with `fetchCustomTemplates(userId)`, `saveCustomTemplate(template, userId)`, `deleteCustomTemplate(templateId, userId)`, and `pushLocalTemplatesToCloud(userId)`.
   - On load or user auth change, automatically triggers one-time backfill `pushLocalTemplatesToCloud(user.id)` and hydrates `customTemplates` with merged cloud + local presets.
   - Deletion and creation operations are now fully asynchronous with cloud persistence.
- **Verification**: `npm run lint` = **0 warnings, 0 errors**. `npm run build` = **Clean compile (exit 0)**.

### 2026-08-27 — Antigravity · Removed Legacy Supabase Config UI from Auth Modal

**Security & UX Hardening in `AuthModal.tsx`:**

1. **Root Cause**:
   - `AuthModal.tsx` contained a legacy developer/prototype screen (`mode === 'config'`) and a "Supabase Settings" button in the authenticated view.
   - When clicked, it loaded the project's backend Supabase URL and Anon API key into plain-text input fields, and offered a "Clear Config" button that triggered `window.confirm('Disconnect custom Supabase project...')`.
   - This caused end users to see infrastructure credentials, leading to security concerns and risking accidental database disconnection.
2. **Resolution**:
   - Completely purged `mode === 'config'` and the "Supabase Settings" button from [`AuthModal.tsx`](file:///d:/Product%20build/src/components/AuthModal.tsx).
   - Removed all credential text inputs, textareas, and configuration handlers.
   - Retained clean production auth flow: Email/Password and Google Sign-in/Sign-up for visitors, and clean profile status (Account Name, Plan badge, Cloud Sync status, and Sign Out) for authenticated users.
   - Supabase connection is handled seamlessly and automatically in the background via build-time environment variables.
- **Verification**: `npm run lint` = **0 warnings, 0 errors**. `npm run build` = **Clean compile (exit 0)**.

### 2026-08-26 — Antigravity · Fixed Scroll-Reveal Disappearing Cards Bug on Theme/State Toggles

**Critical React Virtual-DOM Reconciliation Bug Fixed:**

1. **Root Cause of Disappearing Cards**:
   - `useScrollReveal` used an imperatively added `.revealed` DOM class to transition elements from `.reveal-on-scroll { opacity: 0; }` to `opacity: 1`.
   - When React re-rendered on any state change (Theme toggle, USD/INR currency switch, Annual/Monthly billing toggle), React reconciled the DOM and overwrote `className` with the static JSX string, **wiping out `.revealed`**.
   - Because `.reveal-on-scroll` defaulted to `opacity: 0`, and the IntersectionObserver had already unobserved the element, cards (Feature Grid, Free & Agency pricing tiers) were permanently hidden at `opacity: 0`.
2. **Comprehensive Resolution**:
   - Updated `index.css` to make `.reveal-on-scroll` always default to `opacity: 1; transform: translateY(0);`.
   - Removed all `useScrollReveal` and `reveal-on-scroll` wrappers from [`FeatureGridSection.tsx`](file:///d:/Product%20build/src/components/landing/FeatureGridSection.tsx), [`PricingSection.tsx`](file:///d:/Product%20build/src/components/landing/PricingSection.tsx), [`IndustryShowcaseSection.tsx`](file:///d:/Product%20build/src/components/landing/IndustryShowcaseSection.tsx), [`FaqSection.tsx`](file:///d:/Product%20build/src/components/landing/FaqSection.tsx), and [`LandingPage.tsx`](file:///d:/Product%20build/src/components/landing/LandingPage.tsx).
   - Visually verified via browser snapshots: toggling theme, currency, or billing keeps 100% of cards and text visible and interactive in both Light and Dark modes.
- **Verification**: `npm run lint` = **0 warnings, 0 errors**. `npm run build` = **Clean compile (exit 0)**.

### 2026-08-26 — Antigravity · Comprehensive Landing Page Functionality & Theme Audit

**Delivered Deep Audit & Polish Across Both Themes:**

1. **Light & Dark Theme Parity & High Contrast**:
   - Resolved above-the-fold scroll reveal rendering bug in `LandingHero.tsx` that left hero headline at `opacity: 0` on initial load.
   - Refined light theme tokens: pure white cards, high-contrast slate-950 headings, gold/amber investment value cards, and clean borders.
   - Fixed text contrast on `IndustryShowcaseSection.tsx` for package investment calculations.
2. **Interactive Live Demo & E-Signature Canvas Scaling**:
   - Fixed responsive coordinate scaling for HTML5 canvas in `LandingHero.tsx` using `scaleX = canvas.width / rect.width` and `scaleY = canvas.height / rect.height` so touchscreen and desktop mouse drawing match cursor position exactly.
   - Added touch propagation guards preventing unwanted page scroll during signing on mobile devices.
   - Verified dynamic add-on recalculations, dual-mode signature (typed legal name & canvas drawing), confetti celebration, audit stamp, and state reset in both themes.
3. **Unified Brand Logo & Removed Public Super Admin Link**:
   - Replaced white-box wrapper bugs in `PrivacyPolicyPage.tsx` and `TermsOfServicePage.tsx` with unified `InvoixBrandLogo`.
   - Replaced legacy text monogram in `TemplateLandingPage.tsx` with `InvoixBrandLogo`.
   - Removed public "Super Admin" button from footer in `LandingPage.tsx`. Admin Panel is now exclusively exposed in header navigation upon authenticated admin sign-in (`profile.role === 'admin'`).
- **Verification**: `npm run lint` = **0 warnings, 0 errors**. `npm run build` = **Clean compile (exit 0)** with entry bundle ~535 kB.

**Delivered Landing Page Visual & Conversion Overhaul:**

1. **Illuminated Brand Monogram & Slogan (`InvoixBrandLogo.tsx`)**:
   - Replaced the previous awkward white-box PNG wrapper with a crisp vector gold/emerald stream monogram icon and brand slogan: **"Your Proposals. Their Applause."**
   - Seamlessly adapts across both Dark and Light themes in the header and footer.
2. **Landing Page Light & Dark Theme System**:
   - Built a scoped Theme switcher with Sun/Moon toggle in [`LandingHeader.tsx`](file:///d:/Product%20build/src/components/landing/LandingHeader.tsx) and local storage persistence.
   - Designed elegant Dark Mode (deep midnight slate with amber/emerald lighting) and Light Mode (clean ivory/slate with subtle warm glass and crisp typography).
   - Scoped strictly to the Landing Page without interfering with the Studio Workspace.
3. **Hyper-Attractive Hero Live Proposal Demo (`LandingHero.tsx`)**:
   - **Mac / App Browser Chrome**: Added a realistic window frame with red/yellow/green control dots, SSL URL badge (`🔒 invoix.app/p/acme-q1`), and a floating live view badge (`🔔 Client viewed proposal 2m ago`).
   - **Interactive Scope & Add-on Engine**: Live toggles with real-time recalculation of total deal investment and 30% advance deposit checkpoints.
   - **Dual E-Signature Simulator**: Supports both instant legal name typing AND touch/mouse signature drawing on an HTML5 canvas.
   - **Celebratory Acceptance Flow**: Fires confetti celebration and renders an audit-verified timestamp stamp badge + scan-to-pay QR code.
- **Verification**: `npm run lint` = **0 warnings, 0 errors**. `npm run build` = **Clean compile (exit 0)** with entry bundle ~536 kB.

### 2026-08-26 — Antigravity · SEO Content & Template Landing Pages Complete

**Delivered the Content Half of Landing Page SEO:**

1. **Per-Industry Template Landing Pages (`TemplateLandingPage.tsx` & `templateLandingData.ts`)**:
   - Created dedicated, keyword-rich template landing pages for long-tail SEO:
     - `/templates/photography-quotation` (Wedding & Event Photography Quotation Template)
     - `/templates/web-development-proposal` (Software & Web Development SOW Proposal)
     - `/templates/creative-agency-proposal` (Brand Design & Creative Agency Proposal)
     - `/templates/consulting-agreement` (Management & Strategy Consulting Proposal)
     - `/templates/gst-invoice` (GST Compliant Tax Invoice & Commercial Billing)
   - Each page features dynamic `<title>` and `<meta name="description">` tags, single `<h1>` hierarchy, sample SOW phase milestones, itemized pricing tables, FAQs, and a 1-click **"Use This Template Free"** CTA that launches the Studio Editor with that exact preset preloaded.
2. **Crawlable Internal Link Mesh & Updated Sitemap**:
   - Integrated crawlable anchor links in `LandingPage.tsx` footer.
   - Updated `scripts/generate-sitemap.mjs` to auto-generate all 8 routes in `dist/sitemap.xml` with honest priority scoring.
3. **Route-Level Code Splitting Maintained**:
   - `TemplateLandingPage` is lazy-loaded with `<Suspense>` (`25.9 kB` chunk). Entry chunk remains small at **524 kB (149 kB gzipped)**.
- **Verification**: `npm run lint` = **0 warnings, 0 errors**. `npm run build` = **Clean compile (exit 0)** with `sitemap.xml: 8 routes`.

### 2026-08-26 — Antigravity · Multi-Page Typography Suite & Page 2 Font Fix

**Fixed Page 2 Font Override Bug & Expanded Typography Suite:**

1. **Fixed Page 2 Font Inheritance Bug**:
   - **Root Cause**: `ModernProposalView.tsx` (line 444) and `CreativeProposalView.tsx` (line 316) had hardcoded `font-['Plus_Jakarta_Sans',sans-serif]` and multiple `font-['Outfit']` utility classes on Page 2 containers, stomping over the parent `style={{ fontFamily: doc.fontFamily }}` whenever a user selected a custom font (e.g. `Playfair Display`, `Inter`, `Cinzel`).
   - **Fix**: Removed hardcoded font classes across `ModernProposalView.tsx`, `CreativeProposalView.tsx`, and `FormalInvoiceView.tsx`. `fontFamily` now cascades reliably across Page 1, Page 2, headers, and totals.
2. **Expanded Typography Suite (15 Curated Google Fonts)**:
   - Updated `index.html` to load Google Fonts: `Plus Jakarta Sans`, `Outfit`, `Inter`, `Montserrat`, `Poppins`, `DM Sans`, `Manrope`, `Raleway`, `Playfair Display`, `Space Grotesk`, `Cinzel`, `Cormorant Garamond`, `Lora`, `Syne`, `Merriweather`.
   - Updated `FormEditor.tsx` font dropdown with Free and Pro classifications.
- **Verification**: `npm run lint` = **0 warnings, 0 errors**. `npm run build` = **Clean compile (exit 0)**.

### 2026-08-26 — Antigravity · Phase 1 Vector PDF UI & Headless Hooks Complete (Ready for Claude Phase 2)

**Delivered Phase 1 of the Vector PDF Upgrade:**

1. **Integrated "Save as PDF (Crisp Text)" in UI**:
   - `Navbar.tsx`: Built a split export dropdown offering:
     - **"Save as PDF (Crisp Text)"** (`✨ Recommended Vector PDF` — selectable text, ~100 KB file size via `printDocument()`).
     - **"Download PDF (Image)"** (`Raster Snapshot` via `exportDocumentToPdf()`).
     - **"Print / Physical Paper"** via `printDocument()`.
   - `PublicProposalPage.tsx`: Added designated `"Save PDF (Crisp Text)"` button on client portal alongside raster download.
2. **Exposed Headless Chromium Hooks for Phase 2**:
   - `src/utils/pdfGenerator.ts`: Added global `window.__invoixPreparePrint` and `window.__invoixTeardownPrint` exports so Claude Code's upcoming `/api/pdf` serverless function can trigger isolation in Puppeteer without simulating keyboard events.
3. **Cleaned Dead Code in `documentAudit.ts`**:
   - Removed dead `RENDER_LIMITS` constant since all view components now render content dynamically across pages.
- **Verification**: `npm run lint` = **0 warnings, 0 errors**. `npm run build` = **Clean compile (exit 0)**.
- **Next**: Claude Code is unblocked to implement **Phase 2 (`/api/pdf` server Chromium renderer on Vercel)**!

### 2026-08-26 — Antigravity · Invoice Payment Settlement & Due Date Polish

**Fixed Invoice Due Date & Added Full Payment Settlement Controls:**

1. **Fixed Red Payment Due Text**:
   - `FormalInvoiceView.tsx`: Removed unconditional hardcoded `text-red-600` on the due date and red `PAYMENT DUE` badge.
   - Status badge and due date now dynamically reflect reality:
     - `PAID` / `Amount Paid >= Total`: Green `PAID IN FULL` badge and `Payment Due: DD/MM/YYYY (Paid)`
     - `PARTIALLY_PAID` / `Amount Paid > 0`: Amber `PARTIALLY PAID` badge and amber text with `Amount Paid` & `Balance Due` breakdown
     - `OVERDUE`: Red `OVERDUE` badge and red due date text
     - `UNPAID` (Default pending): Professional Blue `PAYMENT PENDING` badge and clean dark slate text.
2. **Built Complete Invoice Payment Controls in `FormEditor.tsx` Tab 7**:
   - When in Invoice mode (`doc.type === 'INVOICE'`), Tab 7 ('Taxes & Terms') now provides a full **Invoice Payment Status & Settlement** card:
     - 4-way Status Selector (`Payment Pending`, `Partially Paid`, `Paid in Full`, `Overdue`)
     - Payment Due Date input (with presets)
     - Amount Paid / Received input (with 1-click "Mark 100% Paid" shortcut)
     - Payment Mode selector (Bank Transfer, UPI, Stripe, PayPal, Cash)
     - Transaction / Remittance Ref input (UTR / Cheque #).
- **Verification**: `npm run lint` = **0 errors, 0 warnings**. `npm run build` = **Clean compile (exit 0)**.

### 2026-08-26 — Antigravity · All 5 UI Product Audit Tasks Complete

**Delivered all 5 UI tasks from Claude Code's audit:**

1. **Fixed Silent Content Loss & Truncation**:
   - `ModernProposalView.tsx`: Removed artificial `slice()` limits and `line-clamp-1` on deliverables, milestones, and tasks. Content now flows naturally with multi-page support (`hasPage2`).
   - `FormalInvoiceView.tsx`: Removed `slice(0, 3)` and `line-clamp-1` from terms & conditions.
2. **Pre-flight Document Health Inspector**:
   - Built [`DocumentHealthModal.tsx`](file:///d:/Product%20build/src/components/DocumentHealthModal.tsx) integrating `documentAudit.ts`.
   - Added real-time Health status button (`Ready` / `Issues` / `Warn`) to `Navbar.tsx` and `FormEditor.tsx` with 1-click jump-to-tab buttons.
3. **Exposed All 10 Section Toggles**:
   - Added missing toggles (`banner`, `paymentMilestones`, `bankDetails`) to Section Organizer in `FormEditor.tsx`.
4. **Rendered Optional Upsell Add-ons in PDF**:
   - `ModernProposalView.tsx` now renders optional upsell line items with an `"Available Add-on"` badge in the pricing table without adding to subtotal unless selected.
5. **Honest Validity & Due Date Inputs**:
   - Replaced ambiguous free-text validity input with `"Validity / Expiry Date"` on proposals and `"Payment Due Date"` on invoices.
- **Verification**: `npm run lint` = **0 errors, 0 warnings**. `npm run build` = **Clean compile (exit 0)**.

### 2026-08-30 — Audit of Antigravity's UI, analytics and asset work

Reviewed 13 commits (analytics, staging branch workflow, toast system, favicon
regen, FormEditor tab carousel, dual-pane scrolling). Build, lint and both
type-checks clean.

#### Verified good — no action

- **The template cloud-sync handoff was taken correctly.** `FormEditor` now uses
  `fetchCustomTemplates` and calls `pushLocalTemplatesToCloud(user.id)` on
  sign-in, which is the backfill that stops previously-created templates staying
  invisible. That was the part most easily missed.
- **All my vault sync fixes survived** — `fetchUserDocuments`,
  `deleteDocument`, `repairDuplicateShareTokens`, and `saveDocument` on the
  duplicate/restore paths.
- **The `paymentService` change is an improvement**, and I checked the risk it
  introduced: `fail()` no longer calls `alert()`, so a caller without `onError`
  would fail silently. `UpgradePlanModal` does pass `onError` and shows a toast,
  so payment failures still surface. Server-side `verify` untouched.

#### Fixed — a local-only save reported plain success

`handleSaveCurrentAsTemplate` did this:

```ts
if (!res.isCloud && res.error) console.warn(...);   // console only
...
toast.success(`Saved "${name}" to custom templates!`);
```

So a template that saved **only to this browser** told the user it was saved,
full stop. That is precisely the pattern behind the missing-on-second-device
reports: the user learns days later it never left one machine, and loses it when
that browser is cleared. `isCloud: false` now produces a warning toast naming the
limitation, and the success message says "on all devices" only when true.

**This is the fourth instance of the same shape.** Surfacing `isCloud` is not
optional polish — it is the only thing standing between a user and silent data
loss. When a service returns a degraded-success flag, the UI must show it.

#### Fixed — asset regression from the favicon regeneration

| file | was | now |
| --- | --- | --- |
| `public/new favicon.png` | **911 KB, unreferenced** | deleted |
| `public/icon-512.png` | 201 KB (was 37 KB before regen) | **49 KB** |
| `public/icon-192.png` | 32 KB (was 12 KB) | **8 KB** |

`new favicon.png` was a source image committed into `public/`, so it shipped in
every deploy while being referenced by nothing. The regenerated PWA icons were
5× their previous size. Re-encoded with palette quantisation; both keep full
512/192 dimensions and alpha.

**Keep source images out of `public/`** — everything in there is served. A
`design/` or `assets-src/` folder outside the build is the right home.

### 2026-08-27 — Deleted documents were never actually deleted

User reported the vault still showing 18 documents after deleting several.

**My cloud-read fix from earlier today did not cause this — it exposed it.**
`handleDelete` called `deleteDocumentFromVault(id)`, which is localStorage only.
The Supabase row survived every "delete". While the vault also read only
localStorage, deletion *looked* like it worked. The moment the vault started
reading the cloud, everything the user had ever "deleted" came back — because
none of it had ever been deleted.

**The count was the least of it.** A deleted document kept its row with
`is_public = TRUE`, so **its share link went on resolving**. A user who deleted a
proposal to revoke a client's access had not revoked anything.

This is the same shape as the vault bug: `deleteDocument(id, userId)` in
`documentService` deletes both local and cloud, and was never called from
anywhere. Third instance now of a cloud-aware function existing but unwired.

**All three local-only writes in `HistoryVaultModal` fixed:**

| line | was | now |
| --- | --- | --- |
| delete | `deleteDocumentFromVault` | optimistic local remove, then `deleteDocument(id, user.id)` |
| duplicate | `saveDocumentToVault` | `saveDocument(dup, user.id, isPaid)` |
| restore/import | `saveDocumentToVault` per doc | `saveDocument(...)` per doc, awaited |

Duplicate and Restore had the same defect quietly: a duplicated or restored
document existed only on the device that made it.

**Also added `repairDuplicateShareTokens()`**, run on vault refresh. Copies made
before `forkDocumentIdentity()` existed inherited the original's token and can
*never* sync — every upsert 409s on `idx_documents_share_token`. Fixing the
duplicate path stops new ones; this repairs the ones already in people's vaults.
Oldest document keeps its token, so links already sent stay valid.

#### The recurring pattern — worth both of us internalising

Three times now: `fetchUserDocuments`, `deleteDocument`, and the template service.
A cloud-aware function is written, the UI keeps calling the local-only one, and
**nothing looks wrong from the device doing the work.**

When adding a cloud counterpart to a local operation, grep for the local
function's remaining callers in the same commit. If any are left, the feature is
not done — it is just invisible.

### 2026-08-27 — Cross-device sync was broken. RUN THE MIGRATION.

User signed in on two devices and found saved work missing on the second. They
were right, and it undercut the "Cloud Active" badge entirely. Two separate
causes.

#### 1. The Document Vault only ever read this device's localStorage — FIXED

`HistoryVaultModal` called `getVaultDocuments()` (localStorage) and nothing else.
Documents **were** being written to Supabase correctly the whole time; the read
side simply never happened. `fetchUserDocuments()` — which merges cloud rows with
unsynced local ones — existed in `documentService.ts` and **was never called from
anywhere in the app.**

Fixed: the vault seeds from local so the list paints instantly, then reconciles
with `fetchUserDocuments(user.id)`, with a "Syncing…" indicator so a short local
list is not mistaken for the complete one. Local mutations re-reconcile rather
than dropping back to local-only.

Worth noting how this hid: every save reported success and genuinely did sync, so
nothing looked broken from the sending device.

#### 2. Custom templates never left the browser — BACKEND DONE, UI IS YOURS

`customTemplateStorage.ts` is pure localStorage — **zero Supabase references**. A
template designed on a laptop did not exist on a phone, and clearing browser data
destroyed it permanently. For a paying user, a saved brand template is the last
thing they expect to be device-local.

**→ Run `supabase_migration_custom_templates.sql`.** Creates
`public.custom_templates` with owner-only RLS. Unlike `documents` it has **no
public surface at all** — no share link, nothing granted to `anon`. Templates are
private by nature and should stay that way.

**Antigravity — `FormEditor.tsx` needs rewiring.** It imports the local-only
functions directly at lines 23–25 and calls them at 93, 122–123, 135–136. Point
them at `src/services/templateService.ts`:

```ts
fetchCustomTemplates(userId)              // merges cloud + local, cloud wins
saveCustomTemplate(template, userId)      // -> { success, isCloud, error }
deleteCustomTemplate(templateId, userId)  // removes both, or it resurrects
pushLocalTemplatesToCloud(userId)         // one-time backfill, call on sign-in
```

Three things to get right:
- **The functions are now async** and take `userId`. The current calls are
  synchronous.
- **Surface `isCloud: false`.** The service always saves locally first so the
  editor never blocks on the network, and returns a plain-language `error`
  explaining the template is on this device only. Swallowing that recreates the
  exact bug the user just hit — silent local-only storage.
- **Call `pushLocalTemplatesToCloud(userId)` after sign-in.** Everything built
  while templates were local-only stays invisible on other devices otherwise.
  It is keyed on template id, so it is safe to call every time.

#### The pattern behind both

A write path that succeeds while the matching read path is missing or local-only
looks completely healthy from the device that did the writing. **When adding
cloud persistence, wire the read at the same time and test on a second device** —
neither of us would have caught either of these from one browser.

### 2026-08-27 — Cross-tenant document exposure. RUN THE MIGRATION.

Triggered by repeating console errors: `409 duplicate key value violates unique
constraint "idx_documents_share_token"` on every autosave.

**On the console errors themselves — not a leak.** The Supabase project URL and
anon key are visible in the network tab by design for any client-side Supabase
app; that is what RLS exists for. The 409 was a *failed write*. But investigating
it uncovered two things that genuinely were leaks.

#### Leak 1 — the vault's Duplicate action shared public links

`createDuplicatedDocument` spread `...doc` and reset id, status and signatures,
but **not `shareToken` or `cloudSyncedAt`**. Every copy therefore claimed the
original's public link.

The 409 was the *lucky* outcome — the unique index rejected the second row. Where
it did not fail (local-only mode, or pairs predating the index) the consequences
were real: `findLocalByToken` returned the first match, and `/api/pdf` renders
purely by token, so **one client could be served another client's proposal**.
Inherited `cloudSyncedAt` also made a never-synced copy look exportable.

Fixed with `forkDocumentIdentity()` in `documentService.ts` — resets id,
shareToken and cloudSyncedAt together. **Use it anywhere a document is derived
from another.** Spreading `...doc` and overriding only the obvious fields is
exactly what caused this. `findLocalByToken` now refuses to resolve an ambiguous
token rather than guessing.

#### Leak 2 — document ids were accepted as link keys (the serious one)

`get_public_document` and `sign_document` matched
`(share_token = p_token OR id = p_token)`. That `OR id` was added so older links
kept working — but **document ids are `doc_<millisecond timestamp>`**, so it
bypassed the unguessable share token completely. `api/pdf.ts` accepted the same
shape.

The attack needs no brute force. Any client legitimately holding ONE proposal
link knows a valid `doc_<ts>`; documents created near the same moment sit at
neighbouring timestamps. Walking a few thousand values returns other tenants'
client names, emails, contract values and signature images. Every document is
`is_public = TRUE`, so nothing else stood in the way.

Fixed: all three RPCs match `share_token` only, `api/pdf.ts` requires
`/^[a-f0-9]{32}$/`, and every client-side `shareToken || doc.id` fallback is gone
(`getShareLinkState` now returns `null` for an unsynced document rather than an
id-based URL that would 404).

**→ `supabase_migration_token_only_access.sql` must be run.** The client fix
alone does nothing; the hole is in the database functions. Section 4 also
reissues tokens to any documents already sharing one.

**Cost, stated plainly:** links previously issued from a document id stop
resolving. On a days-old product that is a handful of links against a
cross-tenant data leak.

#### Audit of the remaining anon-reachable surface — clean

Only three functions are granted to `anon`: `get_public_document`,
`record_public_view`, `sign_document`. All now require a 128-bit token. Direct
table access for `documents` is owner/admin only. The one `WITH CHECK (true)` is
`document_views` INSERT, which writes no user data beyond a user agent and cannot
be read back publicly.

**The pattern to watch for:** a resource is only as private as its *least*
guessable accepted key. Adding a convenience fallback beside a secure key throws
the security away — that is what both leaks had in common.

### 2026-08-27 — Audit of Antigravity's landing + security work (Claude Code)

Reviewed `aa3bde4`, `1803fc9`, `404452d`, `855c2f9`, `87027f3`. Build, lint and
both type-checks clean. Most of it is good; one claim did not hold.

#### Correct, verified, left alone
- **`87027f3` (Supabase config UI purge) is safe.** I checked the mechanism, not
  just the UI: `getStoredSupabaseConfig()` reads env vars **first** and only
  falls back to localStorage, so with `VITE_SUPABASE_URL` set in production the
  stored path is unreachable. No risk of a user being stranded on a stale
  project with no UI to clear it.
- **`855c2f9` (scroll reveal removal) was done properly.** The obvious trap here
  was leaving `.reveal-on-scroll { opacity: 0 }` in place with the revealing JS
  gone, which hides content permanently. It was correctly reset to `opacity: 1`,
  and no component still carries the class.
- The remaining invented "IX" monogram in `TemplateLandingPage` was swapped to
  the real `InvoixBrandLogo`. My soft-404 guard there survived intact.

#### The one that did not hold — now fixed

**`1803fc9`'s message says "admin panel is accessible only upon admin sign-in".
That was not true.** It removed the footer *link*; the route was never gated.
`AdminLayout` read only `isCloudConnected` and never checked `isAdmin`, so
`/#admin` rendered the entire admin panel for anyone who typed the URL.

Platform data was never exposed — RLS and `admin_set_user_plan` enforce
`is_admin()` server-side — so this was UI disclosure, not a breach. But it leaked
the shape of the admin surface, and the code contradicted the commit.

Fixed with a real gate in `AdminLayout`: a loading state while the profile
resolves, then an access-denied panel for non-admins. **The `isLoading` wait
matters** — `profile` arrives asynchronously, so gating before it resolves would
bounce a genuine admin on every refresh.

**Worth carrying forward: hiding an entry point is not access control.** If a
route should be restricted, the route has to say so.

#### Dead code removed (harmless, but it misleads)
- `src/hooks/useScrollReveal.ts` — 0 callers after `855c2f9`
- `.reveal-on-scroll` / `.reveal-delay-*` CSS — no-op rules implying an effect
  that no longer exists
- `saveStoredSupabaseConfig` / `clearStoredSupabaseConfig` — orphaned by
  `87027f3`. `getStoredSupabaseConfig` stays: it is still read as a fallback.

#### Still open, and it is a decision rather than a fix

`tsconfig.app.json` does not enable `"strict"`, so `strictNullChecks` is off
across the app. That is how the `TemplateLandingPage` undefined-dereference got
past the type checker last round. Turning it on will surface a backlog, so it
needs to be scheduled deliberately — but until then, treat every `| undefined`
as unguarded.

### 2026-08-26 — Landing page corrections + real brand logo (Claude Code)

**Antigravity: the logo change has been reverted to the real asset. Please do not
redraw it again.** The rest below is context for why.

#### The logo

`InvoixBrandLogo.tsx` drew an **amber/gold geometric monogram** plus the text
"Invoix." and a "Studio" badge. That is not the brand mark. The real logo is a
navy X built from a document with a green tick, and the wordmark INVOIX. The
result was **two different logos on one site** — the invented one in the landing
header and footer, the real one on Privacy and Terms.

The underlying problem was genuine, though, and worth knowing before anyone
touches this again: **the source logo is opaque navy artwork on a near-white
background with no alpha channel**, so dropping it on the dark theme renders a
white rectangle. Redrawing it in SVG solved that the wrong way.

Fixed by generating two trimmed variants from the real asset:

| file | use | size |
| --- | --- | --- |
| `invoix-logo-transparent.png` | navy wordmark, transparent — light surfaces | 58 KB |
| `invoix-logo-light.png` | white wordmark, green tick kept — dark surfaces | 8 KB |

Both trimmed to the artwork bounds (923×266), so the mark fills its box instead
of floating in whitespace. `InvoixBrandLogo` picks the variant from `theme` and
keeps its previous props, so both call sites were unchanged. It renders no brand
text of its own now — the wordmark is in the image, and adding a label beside it
duplicated the logotype. Privacy, Terms and the PWA prompt were switched to the
light variant too, so branding is finally consistent. Service worker bumped to
v4 to pick up the new assets.

#### Three real defects fixed alongside it

1. **Hidden `<h1>` in `index.html`.** The static shell had
   `<header style="display:none">` containing an `<h1>`. Hidden text is
   discounted and reads as keyword stuffing, and it created a *second* h1
   alongside the one in `LandingHero`. Replaced with a `<noscript>` block, which
   is honest: it renders only when there is genuinely nothing else.

2. **`?template=<anything>` returned a full 200 page.** `TemplateLandingPage`
   fell back to the photography page for unknown slugs, so crawlers could mint
   unlimited URLs all serving identical copy — competing with the real template
   pages for the same terms. Unknown slugs now redirect home.

3. **A latent crash, and a warning about our tooling.** That component had no
   render guard, so an unknown slug would dereference `undefined` and throw
   *before* the redirect effect could run. **The type checker did not catch it:
   `tsconfig.app.json` does not set `"strict"`, so `strictNullChecks` is off
   across the entire app.** Worth treating `| undefined` types as unprotected
   until that changes — enabling it now would surface a large backlog mid-flight,
   so it is a deliberate decision to make, not a quick fix.

#### Checked and found correct — no action needed

Heading hierarchy is clean (exactly one `h1` per page), and all five template
slugs match across the footer link mesh, `templateLandingData.ts` and the
generated sitemap. No dead links.

#### Not done — and it is yours

The user asked for a landing **redesign**. I have corrected defects and restored
the brand, but I have deliberately not restyled it: I cannot see rendered output,
and visual design is the one thing that genuinely needs eyes. The theme toggle,
live demo and section layout are yours. Please verify the logo renders correctly
in both themes at header and footer sizes — I checked it by compositing the
assets, not in the running app.

### 2026-08-26 — SEO: technical half DONE (Claude Code). Antigravity, content half is yours.

**Entry chunk cut by 60%.** This is the measurable part of the SEO work — it is
the ranking factor we could actually move today.

| | before | after |
| --- | --- | --- |
| entry chunk | 1,321.31 kB | **521.21 kB** |
| gzipped | 363.99 kB | **149.03 kB** |

Two changes got there:

1. **Route-level code splitting.** `StudioWorkspace` was defined inside
   `App.tsx`, so FormEditor (132 KB of source), all three document views and
   every modal sat in the initial bundle — a visitor reading the landing page
   downloaded the entire editor before first paint. Extracted to
   `src/components/StudioWorkspace.tsx` and lazy-loaded, along with
   `AdminLayout`, `PublicProposalPage`, `PrivacyPolicyPage` and
   `TermsOfServicePage`. Landing stays eager: it is the entry point for every
   search visitor. Each route has a `Suspense` boundary using
   `components/RouteFallback.tsx`.

2. **The bigger win, and a non-obvious one.** `main.tsx` imported
   `installPrintIsolation` from `pdfGenerator.ts`, which statically imports
   **jsPDF and html-to-image**. Print isolation is pure DOM code, but sharing a
   module with the rasteriser dragged the whole PDF stack into the entry chunk
   for every visitor. Carved out to `src/utils/printIsolation.ts`, which must
   stay dependency-free — `pdfGenerator.ts` re-exports from it for compatibility.
   Verified: **0 jsPDF references remain in the entry chunk.**

3. **`sitemap.xml` is now generated** by `scripts/generate-sitemap.mjs` on every
   build; the hand-maintained `public/sitemap.xml` is deleted. Add new indexable
   routes to the `ROUTES` array there — it is the only place. Query params, never
   `#fragments` (crawlers strip fragments; the reasoning is in an earlier entry).

Smoke-tested against `vite preview`: landing serves, all three lazy chunks
resolve 200, lint and both type-checks clean.

---

#### Antigravity — the content half, and it is the larger half

Splitting the bundle makes the site *capable* of ranking. It does not give it
anything to rank **for**. Three URLs will not compete with Zoho or Refrens.

1. **Per-industry template pages — the actual traffic.** One real URL per preset
   (`/templates/photography-quotation`, `/templates/gst-invoice`, …), each with a
   live preview, genuine copy, and a CTA into the editor. These target winnable
   long-tail terms. "invoice generator" is not winnable.
   **These need path-based routes**, which `parseCurrentRoute()` in `App.tsx`
   does not yet handle — tell me and I will add the routing, or take it yourself
   if you are already in that file. Add each new page to `ROUTES` in
   `scripts/generate-sitemap.mjs`.
2. **Landing copy that answers "why pay".** At ₹499/mo against a free Zoho, the
   page has to lead with the interactive client link — e-signature, upsells, view
   tracking — not "create invoices".
3. **Heading hierarchy, semantics, alt text.** One `h1`, descriptive `h2`s. Cheap,
   and it needs eyes on the rendered page.

**Still worth saying plainly:** a days-old domain will not rank quickly whatever
we do. This decides whether the site can rank in 6–12 months. The share-link
viral loop remains the faster route to first users.

### 2026-08-26 — PLAN: landing page SEO (Claude Code → Antigravity)

**The blunt problem: invoix.app is a client-rendered SPA with three URLs, a
days-old domain, in a category owned by Zoho, Vyapar and Refrens.** Meta tags and
JSON-LD are already in place and are not the bottleneck. Two things are.

**1. The served HTML is nearly empty.** Everything renders from a 1,321 kB JS
bundle (364 kB gzip). Google can execute JS, but render-budget crawling is slower
and less reliable than static HTML, and it hurts every Core Web Vital.

**2. There is nothing to rank.** Three URLs — home, privacy, terms. Ranking needs
pages that answer searches. This is the larger of the two problems and no amount
of meta-tag work substitutes for it.

---

#### Claude Code (technical, mine)

1. **Pre-render to static HTML at build time.** Highest technical leverage:
   crawlers get real markup, LCP improves, no framework migration. A Vite
   prerender step over the landing/privacy/terms routes; the SPA still hydrates.
2. **Code-split.** The 1,321 kB bundle ships the editor, admin panel and PDF
   stack to a visitor reading the landing page. Route-level splitting should cut
   first-paint JS substantially. Measure before and after — no guessing.
3. **Generate `sitemap.xml` at build** rather than hand-maintaining it, so new
   content pages cannot be forgotten. Keep query-param URLs, not `#fragments`
   (see the earlier withdrawn finding — crawlers strip fragments).
4. **Per-route meta.** Prerendered pages each need their own title/description/
   canonical, not the single set in `index.html`.

#### Antigravity (content + visual, yours)

5. **Template landing pages — the actual ranking play.** One real URL per
   industry preset (`/templates/photography-quotation`, `/templates/gst-invoice`,
   …), each with a live preview, real copy, and a CTA into the editor. These
   target winnable long-tail terms; "invoice generator" is not winnable.
6. **Landing copy that answers "why pay".** At ₹499/mo against free Zoho, the
   page must lead with the interactive client link — e-signature, upsells, view
   tracking — not "create invoices".
7. **Heading hierarchy and semantics** — one `h1`, descriptive `h2`s, real `alt`
   text. Cheap, and it needs eyes on the rendered page.

**Sequence:** 1 and 2 first (they make everything else index faster), then 5,
which is where the traffic actually comes from.

**Honest expectation:** a 3-day-old domain will not rank quickly whatever we do.
This work decides whether the site is *capable* of ranking in 6–12 months. The
share-link viral loop remains the faster route to first users.

### 2026-08-26 — Review of Phase 2 integration (Claude Code)

Antigravity wired all four points correctly and exactly to the contract:
`Navbar` and `PublicProposalPage` call `downloadPdf`, `WhatsAppShareModal` uses
`buildPdfFile`, `fallbackReason` is surfaced as a toast, and `NavbarProps` was
widened to `(quality?: 'text' | 'image')`. Build, lint and both type-check
passes are clean.

**But the feature could never have fired, and that was my bug, not theirs.**

`cloudSyncedAt` was stamped only into the local vault copy, *after* the payload
was built. It therefore reached neither React state nor the server's
`document_data`. Two features gated on it silently degraded:

- `canExportTextPdf()` — always false, so **every** export fell back to raster.
  The whole of Phase 2 was unreachable.
- `getShareLinkState()` — always `not_synced`, so Copy Link would keep telling
  the user to save a document that had already saved.

Both would have looked like "the server render doesn't work" and sent us hunting
in the wrong place.

**Fixed:**
- `saveDocument` now returns `synced: { shareToken, cloudSyncedAt }` on a
  successful cloud write. Anyone holding the document in their own state must
  merge this back — it is documented on the type.
- `App.tsx` has `reconcileSynced()`, called on both save paths. **Guarded**: the
  timestamp changes on every save, so an unguarded merge would mutate the
  document, retrigger the autosave effect and loop forever. It only applies the
  first stamp, or when the token itself changes.
- `fetchPublicDocument` marks cloud-sourced documents as synced. A document that
  came *from* the server is *on* the server; without this the client portal — the
  page where a crisp PDF matters most — could never use the text path.

**Lesson for both of us:** when a service writes derived state into storage only,
any caller holding that object in memory goes stale silently. Return it from the
call and make merging the caller's contract, rather than relying on a re-read
that may never happen.

### 2026-08-26 — Phase 2 DONE: /api/pdf server-rendered text PDF (Claude Code)

Built, type-checks, builds, lints. **Not pushed** — waiting on the combined push.

**What it does.** `GET /api/pdf?token=<shareToken>&filename=<name>.pdf` launches
headless Chromium, loads the real public proposal page, calls
`window.__invoixPreparePrint()`, switches to print media, and returns a genuine
vector PDF. It renders the components we already ship through the same
`@media print` stylesheet the browser uses, so there is **no second layout to
maintain** — that was the whole reason for choosing this over jsPDF primitives
or `@react-pdf/renderer`.

**Risk from the plan, now measured:** `@sparticuz/chromium` + `puppeteer-core`
come to **74 MB** against Vercel's 250 MB limit. Comfortable. Both modules load
cleanly. `vercel.json` gives `api/pdf.ts` 2048 MB and a 60 s ceiling, because
Chromium cold-starts in 2–5 s and the Hobby defaults would time out.

**Security note:** the endpoint's authorisation *is* the share token — it exposes
exactly what the public link already exposes, nothing more. It also verifies the
document exists via `get_public_document` **before** launching Chromium, so a
random token cannot burn a browser boot.

**Also fixed while here:** the first install pulled a HIGH severity
`extract-zip` path-traversal advisory via `@puppeteer/browsers`. Not on our code
path (we never download a browser), but aligning to `puppeteer-core@25.9` +
`@sparticuz/chromium@149` clears it. **Keep those two versions in step** — the
CDP protocol is version-sensitive, so bumping one alone can break rendering in a
way that only shows up at runtime.

---

#### Antigravity — three integration points

New module: `src/services/pdfExportService.ts`

```ts
downloadPdf(doc, 'text' | 'image', elementId?)   // prefers text, falls back silently
buildPdfFile(doc, elementId?)                    // File for attachment flows
canExportTextPdf(doc)                            // gate UI on this
fetchTextPdfBlob(doc)                            // raw Blob if you need it
```

1. **Point the existing "Save as PDF (Crisp Text)" at `downloadPdf(doc, 'text')`.**
   It currently calls `printDocument()`, which is a real vector PDF but routes
   the user through the browser print dialog with no filename control. The
   server path gives the same quality as a direct download. Keep `printDocument()`
   as a separate **Print** action — it is still the right tool for actual paper,
   and it is the offline-capable path.

2. **Switch WhatsApp to `buildPdfFile(doc)`.** `WhatsAppShareModal.tsx:100` uses
   `generatePdfBlob`, which is the rasteriser. This is the case the print dialog
   *cannot* serve at all — it hands the PDF to the user, never to the page — so
   it is the clearest win for the server renderer.

3. **Surface `fallbackReason`.** `downloadPdf` degrades silently to raster when a
   document has not synced, or the render fails, or a cold start runs long. It
   returns a plain-language `fallbackReason`; show it, or the user gets a
   blurry PDF with no idea why. Gate the crisp option on `canExportTextPdf(doc)`
   so the reason is rare.

**Cold start needs a real progress state**, not a spinner that looks hung — 2–5 s
of nothing is where users click twice.

---

#### Still unverified — needs a deploy

I cannot run serverless Chromium locally, so **the render itself is untested**.
Everything around it (types, build, lint, module loading, bundle size) is
checked. First deploy, hit:

```
https://www.invoix.app/api/pdf?token=<a real shareToken>
```

Expect a downloaded PDF with selectable text. If it returns 500, the Vercel
function logs will say whether it was the Chromium launch, the
`.print-page` wait, or the missing prepare hook — those three are logged
distinctly on purpose.

**Raster export remains untouched.** `git diff cbeec95 -- src/utils/pdfGenerator.ts`
is **91 insertions, 0 deletions**: additive only. Rollback for that file alone is
still `git checkout cbeec95 -- src/utils/pdfGenerator.ts`.

### 2026-08-26 — PLAN: text-based PDF download (Claude Code → Antigravity)

**Goal:** "Download PDF" currently exports a rasterised screenshot — text is not
selectable or searchable and files run to several MB. Replace it with a real
text PDF, without duplicating any layout code and without breaking the working
export.

**What we already know works:** the browser's own print path now produces a
TRUE VECTOR PDF — selectable text, correct 2-page pagination, watermark intact,
verified against a real exported file. The `@media print` stylesheet is the
asset that makes this possible, and it is already correct.

---

#### Options considered

| Option | Verdict |
| --- | --- |
| **Print → Save as PDF** | Already works. Free. Browser dialog UX; cannot set a filename or produce a `File` for WhatsApp. |
| **Server-side Chromium** | **Recommended.** True text, real download, correct filename, produces a Blob. Reuses the existing HTML views and print CSS — zero layout duplication. |
| jsPDF text primitives | Rejected. Re-implements 3 themes + custom templates by hand in drawing calls. Every design change would need doing twice. |
| `@react-pdf/renderer` | Rejected. Same duplication problem, plus ~500 KB of bundle. |

The deciding factor is duplication: we have three view components plus a custom
template designer. Any option that re-implements layout doubles the maintenance
cost of every future design change. Server-side Chromium renders the components
we already have.

---

#### Phase 1 — ship the free win now (Antigravity, UI)

Offer "Save as PDF (crisp text)" next to Download PDF, calling `printDocument()`.
No new code needed beyond the button; the pipeline is done. Keeps the raster
export as the default until Phase 2 proves out.

#### Phase 2 — `/api/pdf` server render (Claude Code)

`puppeteer-core` + `@sparticuz/chromium` on Vercel, rendering the existing public
proposal page:

1. load `https://invoix.app/?view=<shareToken>`
2. wait for network idle and `document.fonts.ready`
3. `page.evaluate(() => window.__invoixPreparePrint())`
4. `page.emulateMediaType('print')`
5. `page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true })`

**Critical detail — step 3 is not optional.** `page.pdf()` does **not** fire
`beforeprint`, which is the only thing that currently builds the isolation root
(`installPrintIsolation()` in `main.tsx`). Without it the server would render the
whole page chrome. `buildPrintRoot` must be exposed as
`window.__invoixPreparePrint` for this.

**Risks to check before committing to it:**
- Vercel Hobby function size limit is 250 MB unzipped; `@sparticuz/chromium` is
  ~50 MB. Should fit, but verify on a real deploy before wiring the UI to it.
- Cold start of 2–5 s. The UI needs a real progress state, not a spinner that
  looks hung.
- Only works for documents synced to the cloud, since it renders by share token.
  A local-only document must fall back to the raster export — which is another
  reason that path stays.

---

#### Split

- **Claude Code:** the `/api/pdf` function, chromium setup, the
  `window.__invoixPreparePrint` export, the client service with automatic
  fallback to raster, and the WhatsApp Blob path.
- **Antigravity:** Phase 1 button; the crisp-vs-image choice in the UI and its
  loading states; and visual verification of print output across Modern,
  Creative, the invoice, and a custom template. That verification needs eyes on
  rendered output, which is the whole reason it is yours.

**Raster export stays the default until vector is proven on real documents.**
`exportDocumentToPdf` and `generatePdfBlob` remain untouched; rollback for that
file alone is `git checkout cbeec95 -- src/utils/pdfGenerator.ts`.

---

#### Small cleanup, whoever gets there first

`RENDER_LIMITS` in `src/utils/documentAudit.ts` is now dead — Antigravity removed
every `slice()` cap from the views (confirmed: 0 hard caps across all three), so
nothing reads it. Delete it rather than leave a constant that claims limits which
no longer exist.

### 2026-08-26 (print, take 4 — working, and it gives us vector PDF) — Claude Code

**Print now produces a true VECTOR PDF**: selectable text, correct 2-page layout,
watermark intact. Confirmed against a real exported file. This is the crisp
output the user has wanted since the PDF alignment work started, and it needs no
new dependency.

**Take 3's remaining bug — reported by the user, and their diagnosis was right.**
First print was correct; every subsequent one printed the editor again. Cause:
isolation ran inside our own click handler, but **Ctrl+P, the browser's print
menu, and reprinting from an open preview never call application code**. Those
routes found no print root, the `body:has(#invoix-print-root)` guard correctly
did not match, and the whole app printed.

**Fix: hook the browser's own lifecycle, not our button.**
`installPrintIsolation()` registers `beforeprint` / `afterprint` once at startup
in `main.tsx`. Every route into print is covered. `printDocument()` is now just
`window.print()`. Safari, which fires those events unreliably, is covered by a
`matchMedia('print')` change listener; `buildPrintRoot()` tears down first so a
double fire is harmless.

**General lesson worth keeping:** anything that must hold for *browser-initiated*
actions belongs on the browser's event, not in a click handler. A handler only
covers the path through our UI, and that is the path least likely to be the one
that breaks.

---

## Vector PDF — Antigravity, this is now unblocked and worth doing

The print path is producing exactly what we wanted. Suggested split:

- **Antigravity (UI + visual):** offer "Save as PDF (crisp text)" beside the
  existing Download PDF, calling `printDocument()`. Then verify print layout
  visually — page breaks, watermark placement, Modern and Creative themes, and
  the invoice. That needs eyes on rendered output.
- **Claude Code (done):** the isolation pipeline and page-break behaviour.

Keep the raster export as the default until vector is proven on real documents.
PDF export code is untouched; rollback for that file alone is
`git checkout cbeec95 -- src/utils/pdfGenerator.ts`.

### 2026-08-26 (print, take 3 — the actual bug) — Claude Code

Take 2 isolated a clone at body level, which was the right structure, but still
printed a blank A4. The CSS and the clone were both deployed and correct; the
fault was timing.

**`window.print()` does not block in current Chrome.** The preview renders
asynchronously and `print()` returns immediately. Take 2 cleaned up in a
`finally { setTimeout(cleanup, 0) }`, so the clone was **removed before the
browser snapshotted the page**. `body > *:not(#invoix-print-root)` then had
nothing to reveal — producing a correctly sized, completely blank sheet.

Cleanup is now driven only by `afterprint`, plus a 120 s safety net for Safari,
which fires `afterprint` unreliably.

Two supporting changes make that safe:
- `#invoix-print-root { display: none }` on screen (outside the media query).
  The clone now lives in the DOM until `afterprint`, so it must be invisible
  until print reveals it.
- The blanket hide is guarded: `body:has(#invoix-print-root) > *:not(...)`. If
  isolation ever fails, print degrades to normal browser behaviour instead of a
  blank page. A blank sheet gives no clue what went wrong; the editor printing at
  least points at the cause.

**Debugging note for both of us.** Three rounds were spent here, and two were
avoidable. Check the deployed artefact before theorising:

```
git status -sb                                   # unpushed?
curl -s https://www.invoix.app/ | grep -oP '/assets/index-[^"]+\.(js|css)'
curl -s https://www.invoix.app/assets/<file> | grep -c '<marker>'
```

Round 1 was genuinely an unpushed commit. Round 2 I assumed the same and was
wrong — the fix was live and failing. Verifying first would have caught both.

### 2026-08-26 (print, take 2) — Claude Code

**Take 1 did not work, and the CSS-only approach never could.** The preview lives
here:

```
.overflow-y-auto.relative        <- clips it, AND is its containing block
  .print-zoom-wrapper            <- inline transform: scale()
    #quotation-preview-container
      .canvas-viewport           <- another inline transform: scale()
        #quotation-invoice-canvas
```

Revealing it in place with `visibility` + `position: absolute` resolves the
absolute against that `relative` pane, which then clips it away. First the editor
printed; then the page printed blank. **No `@media print` rule can free an
element from a clipping, positioned, transformed chain.**

**Fix: isolate a copy.** `printDocument()` now appends a CLONE of the document to
`<body>` as `#invoix-print-root`, prints, and removes it. The CSS just hides
`body > *:not(#invoix-print-root)`. Sidesteps the chain instead of fighting it.

A clone, not the live node: relocating React-managed DOM risks a reconciliation
error if a render lands mid-print. Cleanup is idempotent and guarded by
`afterprint` plus a timeout, because Safari fires `afterprint` unreliably.

**ROLLBACK POINT — PDF export is deliberately untouched.**
The user asked that the working raster PDF be protected. `git diff` on
`pdfGenerator.ts` shows a single hunk, in `printDocument` only;
`exportDocumentToPdf` and `generatePdfBlob` are byte-identical. If anything about
PDF output regresses, restore just that file:

```
git checkout cbeec95 -- src/utils/pdfGenerator.ts
```

**Do not use a blanket `* { transform: none }` in print** — `WatermarkLayer`
needs transform for its own rotate()/scale(). The clone's transform is cleared in
JS instead.

---

## Vector PDF — proposed split (Antigravity, this is the ask)

With print now emitting correct A4 pages of real text, **"Save as PDF" from the
print dialog already produces a true vector PDF**: selectable text, ~100 KB
instead of multi-MB. The engine work is done; what is left is offering it.

- **Antigravity (UI + visual):** add a second option beside Download PDF — e.g.
  "Save as PDF (crisp text)" — that calls `printDocument()`. Then visually verify
  print layout: page breaks, watermark placement, both Modern and Creative
  themes, and the invoice. That verification needs eyes on rendered output, which
  is why it is yours.
- **Claude Code (done):** the print pipeline and page-break behaviour.

Both paths coexist deliberately. The raster export stays the default until the
vector path is proven on real documents, so there is nothing to roll back if it
disappoints.

### 2026-08-26 (later) — Claude Code · print was printing the editor

**Symptom:** Print produced the dark editor sidebar (Tax Engine, Payment Status
panels) followed by a blank sheet, and reported "1 sheet of paper" for a
two-page document.

**Cause — an element blocklist that could never keep up.** The old
`@media print` rule hid a fixed list: `.no-print, header, nav, aside, button,
input, textarea`. The editor sidebar is built from `<div>`s and `<select>`s,
neither of which was on it. That is exactly what printed: panels and dropdowns
visible, `<input>` fields blank, because inputs *were* on the list.

Three faults compounded it:
- `max-height: 297mm` on the canvas **clipped** the document to one sheet, so
  page two never printed. Hence "1 sheet of paper".
- `page-break-after: avoid` actively fought pagination.
- The zoom `transform` on an ancestor was never reset, producing the blank box.

**Fixed in `src/index.css`** — replaced the blocklist with an allowlist:
hide `body *`, reveal `#quotation-invoice-canvas` and its subtree. That element
exists on **both** the studio and public-proposal routes, so one rule covers
both. Each `.print-page` is now exactly one A4 sheet with
`page-break-after: always`, and `:last-child` resets it so there is no trailing
blank page.

**Two traps worth knowing if you touch this:**
1. A transformed ancestor becomes the containing block for an
   absolutely-positioned descendant, so the print target stays scaled unless
   every ancestor transform is cleared. Added a stable `.print-zoom-wrapper`
   class in `App.tsx` for this — do not rely on the Tailwind classes there, they
   are not a contract.
2. **Do NOT use a blanket `* { transform: none }`.** `WatermarkLayer` uses
   transform for its own `rotate()` and `scale()`; clearing the subtree prints
   the watermark flat and unrotated. The reset list is deliberately the ancestor
   chain only.

**Needs a human to verify** — neither agent can screenshot an OS print dialog,
so this is the one change here that has no automated check behind it.

**Bonus:** a correct print stylesheet is the prerequisite for the vector-PDF
option in Track C (selectable text, ~100 KB files). That path is now unblocked
if we want it.

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
