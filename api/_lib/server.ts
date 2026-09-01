/// <reference types="node" />
/**
 * Shared server-side helpers for the Invoix Vercel functions.
 *
 * Everything here runs on the server only. None of these environment variables
 * carry a VITE_ prefix, so Vite will never inline them into the browser bundle.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** Minimal shape of a Vercel Node function request/response. */
export interface ApiRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  on(event: string, listener: (chunk: unknown) => void): void;
}

export interface ApiResponse {
  status(code: number): ApiResponse;
  json(body: unknown): void;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`);
  }
  return value;
}

/**
 * Supabase client bound to the service-role key. Bypasses RLS, so it is the
 * only thing on the platform allowed to write profiles.plan.
 */
export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error('Missing required server environment variable: SUPABASE_URL or VITE_SUPABASE_URL');
  }
  if (!key) {
    throw new Error('Missing required server environment variable: SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY');
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Resolves the calling user from their Supabase access token.
 *
 * The user id is NEVER read from the request body — a caller could put any id
 * there and buy a plan for, or as, someone else.
 */
export async function getUserFromRequest(
  req: ApiRequest,
  admin: SupabaseClient
): Promise<{ id: string; email?: string } | null> {
  const raw = req.headers['authorization'];
  const header = Array.isArray(raw) ? raw[0] : raw;
  if (!header || !header.startsWith('Bearer ')) return null;

  const token = header.slice('Bearer '.length).trim();
  if (!token) return null;

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;

  return { id: data.user.id, email: data.user.email ?? undefined };
}

/** Reads a JSON body whether the runtime pre-parsed it or not. */
export function readJsonBody(req: ApiRequest): Record<string, unknown> {
  if (req.body && typeof req.body === 'object') {
    return req.body as Record<string, unknown>;
  }
  if (typeof req.body === 'string' && req.body.length > 0) {
    try {
      return JSON.parse(req.body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return {};
}

/** Collects the untouched request body, needed for webhook signature checks. */
export function readRawBody(req: ApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    // Some runtimes hand us the body already buffered.
    if (typeof req.body === 'string') return resolve(req.body);
    if (req.body instanceof Buffer) return resolve(req.body.toString('utf8'));

    const chunks: Buffer[] = [];
    let settled = false;

    req.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    });
    req.on('end', () => {
      if (settled) return;
      settled = true;
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('error', (err) => {
      if (settled) return;
      settled = true;
      reject(err);
    });
  });
}

export function methodNotAllowed(res: ApiResponse, allowed: string): void {
  res.setHeader('Allow', allowed);
  res.status(405).json({ error: 'Method not allowed' });
}
