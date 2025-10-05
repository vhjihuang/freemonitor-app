// packages/types/src/session.ts
export interface Session {
  id: string;
  userAgent: string;
  ipAddress: string;
  createdAt: string; // ISO format date string
  expiresAt: string; // ISO format date string
  revoked: boolean;
  lastActivityAt: string | null; // ISO format date string or null
  isCurrent: boolean;
}