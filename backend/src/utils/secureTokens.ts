import crypto from 'crypto';

/**
 * Refresh tokens and password-reset tokens are random opaque strings, not
 * JWTs — we hand the raw value to the client but store only a SHA-256 hash,
 * the same pattern GitHub/Auth0 use for API keys. A stolen database dump
 * can't be replayed as a session or reset link.
 */
export const generateOpaqueToken = (): string => crypto.randomBytes(48).toString('base64url');

export const hashToken = (token: string): string => crypto.createHash('sha256').update(token).digest('hex');
