/// <reference types="node" />
/**
 * GET /api/pdf?token=<shareToken>&filename=<name>.pdf
 *
 * Renders a proposal to a TRUE TEXT PDF using headless Chromium.
 *
 * Why server-side Chromium rather than building the PDF from primitives: the
 * document has three view components plus a user-designed custom template.
 * Anything that re-implements layout (jsPDF text calls, @react-pdf/renderer)
 * would have to be updated in lockstep with every design change, and would drift
 * from what the user sees on screen. This renders the components we already
 * ship, through the same @media print stylesheet the browser's own print uses.
 *
 * Authorisation is the share token itself: this endpoint exposes exactly what
 * the public proposal link already exposes, and nothing more.
 */

import chromium from '@sparticuz/chromium';
import puppeteer, { type Browser } from 'puppeteer-core';
import {
  type ApiRequest,
  type ApiResponse,
  getSupabaseAdmin,
  methodNotAllowed,
  readJsonBody,
} from './_lib/server.js';

/**
 * Share tokens only — 32 hex characters.
 *
 * This previously allowed `doc_<timestamp>` ids so legacy links kept working,
 * which meant /api/pdf?token=doc_1756... rendered any tenant's document. Ids are
 * timestamps and can be walked from a single known-good link, so accepting them
 * bypassed the whole point of an unguessable token.
 */
const TOKEN_PATTERN = /^[a-zA-Z0-9_-]{8,64}$/;

/** Chromium is the slow part; give the page itself a tighter budget. */
const NAV_TIMEOUT_MS = 25_000;
const RENDER_TIMEOUT_MS = 35_000;

function sanitizeFilename(raw: unknown): string {
  if (typeof raw !== 'string') return 'Invoix-Document.pdf';
  const cleaned = raw.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 100);
  return cleaned.endsWith('.pdf') ? cleaned : `${cleaned || 'Invoix-Document'}.pdf`;
}

/** Reconstructs the public origin from the proxy headers Vercel sets. */
function resolveOrigin(req: ApiRequest): string | null {
  const rawHost = req.headers['x-forwarded-host'] || req.headers['host'];
  const host = Array.isArray(rawHost) ? rawHost[0] : rawHost;
  if (host) {
    const rawProto = req.headers['x-forwarded-proto'];
    const proto = (Array.isArray(rawProto) ? rawProto[0] : rawProto) || 'https';
    return `${proto}://${host}`;
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return null;
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return methodNotAllowed(res, 'GET, POST');
  }

  const origin = resolveOrigin(req);
  if (!origin) {
    return void res.status(500).json({ error: 'Could not determine the site address.' });
  }

  let docPayload: unknown = null;
  let filename = 'Invoix-Document.pdf';
  let token = '';

  if (req.method === 'POST') {
    const body = readJsonBody(req) as { document?: unknown; filename?: unknown } | null;
    docPayload = body?.document || body;
    if (body?.filename) filename = sanitizeFilename(body.filename);
  } else {
    // req.query is populated by the Vercel Node runtime.
    const query = (req as unknown as { query?: Record<string, string | string[]> }).query || {};
    const rawToken = Array.isArray(query.token) ? query.token[0] : query.token;
    token = typeof rawToken === 'string' ? rawToken.trim() : '';
    if (query.filename) filename = sanitizeFilename(query.filename);

    if (!token || !TOKEN_PATTERN.test(token)) {
      return void res.status(400).json({ error: 'A valid document link token is required.' });
    }

    // Confirm the document exists BEFORE paying for a Chromium cold start.
    try {
      const admin = getSupabaseAdmin();
      const { data, error } = await admin.rpc('get_public_document', { p_token: token });
      if (error || !data) {
        return void res.status(404).json({ error: 'Document not found or this link has expired.' });
      }
    } catch (err) {
      console.error('PDF: document lookup failed:', err);
      return void res.status(500).json({ error: 'Could not verify the document.' });
    }
  }

  let browser: Browser | null = null;

  try {
    browser = await puppeteer.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
      defaultViewport: { width: 1240, height: 1754, deviceScaleFactor: 1 },
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    page.setDefaultTimeout(RENDER_TIMEOUT_MS);

    if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
      await page.setExtraHTTPHeaders({
        'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
      });
    }

    if (docPayload) {
      await page.goto(`${origin}/?render_pdf=1`, {
        waitUntil: 'domcontentloaded',
        timeout: NAV_TIMEOUT_MS,
      });

      await page.evaluate((d) => {
        const win = globalThis as { __invoixSetDocument?: (doc: unknown) => void };
        if (typeof win.__invoixSetDocument === 'function') {
          win.__invoixSetDocument(d);
        }
      }, docPayload);
    } else {
      await page.goto(`${origin}/?view=${encodeURIComponent(token)}`, {
        waitUntil: 'domcontentloaded',
        timeout: NAV_TIMEOUT_MS,
      });
    }

    // The document is fetched client-side, so the page can be "loaded" before it
    // renders. Wait for the actual A4 pages to exist.
    await page.waitForSelector('.print-page, #quotation-invoice-canvas', { timeout: RENDER_TIMEOUT_MS });

    /*
      Webfonts must resolve before layout is measured, or line breaks shift.

      The callbacks below execute in the BROWSER realm, not in Node, so `window`
      and `document` are reached through globalThis. The api tsconfig has no DOM
      lib on purpose - server code should not be able to touch DOM globals by
      accident - so these are the only places that need the cast.
    */
    await page.evaluate(async () => {
      const doc = (globalThis as { document?: { fonts?: { ready?: Promise<unknown> } } }).document;
      if (doc?.fonts?.ready) await doc.fonts.ready;
    });

    /*
      page.pdf() does NOT fire `beforeprint`, and that event is the only thing
      that builds the print isolation root. Without this call Chromium would
      render the whole page chrome - nav bar, signing form and all - instead of
      the document.
    */
    const prepared = await page.evaluate(() => {
      const win = globalThis as { __invoixPreparePrint?: () => void };
      if (typeof win.__invoixPreparePrint === 'function') {
        win.__invoixPreparePrint();
        return true;
      }
      return false;
    });

    if (!prepared) {
      console.error('PDF: window.__invoixPreparePrint is not available on the page.');
      return void res.status(500).json({ error: 'The document could not be prepared for export.' });
    }

    await page.emulateMediaType('print');

    const pdf = await page.pdf({
      format: 'a4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', String(pdf.length));
    res.setHeader('Cache-Control', 'private, max-age=60');

    return void (res as unknown as { end: (chunk: Buffer) => void }).end(Buffer.from(pdf));
  } catch (err) {
    console.error('PDF render failed:', err);
    return void res
      .status(500)
      .json({ error: 'Could not generate the PDF. Please try the standard download.' });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        console.warn('PDF: browser close failed:', closeErr);
      }
    }
  }
}
