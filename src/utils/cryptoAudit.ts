/**
 * Cryptographic SHA-256 Hashing & Digital Certificate Engine for Invoix
 * Uses the standard Web Crypto API (supported natively across modern desktop and mobile browsers)
 */

/** Which algorithm actually produced a hash. Recorded so a certificate stays verifiable. */
export type HashAlgo = 'sha-256' | 'fallback';

export interface HashResult {
  hash: string;
  algo: HashAlgo;
}

export async function computeSha256(message: string): Promise<HashResult> {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const msgUint8 = new TextEncoder().encode(message);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return {
        hash: hashArray.map((b) => b.toString(16).padStart(2, '0')).join(''),
        algo: 'sha-256',
      };
    }
  } catch (err) {
    console.warn('Web Crypto subtle digest fallback engaged:', err);
  }

  // Non-secure context (plain HTTP). crypto.subtle is unavailable, so this is a
  // NON-cryptographic digest — it is not collision resistant and must never be
  // presented as SHA-256. The algo flag below is what keeps that honest, and it
  // is stored alongside the hash in the acceptance audit record.
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < message.length; i++) {
    const ch = message.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return { hash: `${hex1}${hex2}${hex1}${hex2}${hex1}${hex2}${hex1}${hex2}`, algo: 'fallback' };
}

/**
 * Generates an unguessable token for public client links.
 *
 * Document ids are timestamps, so a link keyed on the id can be enumerated.
 * This is 128 bits of randomness instead.
 */
export function createShareToken(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID().replace(/-/g, '');
    }
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch (err) {
    console.warn('Secure share token generation unavailable:', err);
  }
  // Last resort only; the server backfills a proper token on first cloud sync.
  return `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

export interface SignatureHashPayload {
  signatureDataUrl: string;
  documentId: string;
  invoiceNo: string;
  signerName: string;
  timestamp: string;
  totalInvestment: number;
  currencyCode: string;
}

/**
 * Computes a tamper-evident hash over the full contract payload.
 *
 * The entire signature image is hashed, not a prefix — hashing only the first N
 * characters would let two different signatures of equal length collide.
 */
export async function generateContractSignatureHash(
  payload: SignatureHashPayload
): Promise<HashResult> {
  const serialized = JSON.stringify({
    docId: payload.documentId,
    no: payload.invoiceNo,
    signer: payload.signerName.trim(),
    time: payload.timestamp,
    total: payload.totalInvestment,
    currency: payload.currencyCode,
    signature: payload.signatureDataUrl,
  });

  return computeSha256(serialized);
}

/**
 * Generates an official human-readable Certificate Identifier
 * Example: CERT-QUO-2026-782-9F4A
 */
export function generateCertificateId(docNo: string, hash: string): string {
  const cleanDoc = docNo.replace(/[^a-zA-Z0-9-]/g, '');
  const shortHash = hash.slice(0, 4).toUpperCase();
  return `CERT-${cleanDoc}-${shortHash}`;
}
