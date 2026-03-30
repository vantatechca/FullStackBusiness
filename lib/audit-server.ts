import { sql } from '@/lib/db';

// Server-side audit log helper — fire and forget, never blocks the caller
export function logAuditServer(userId: string, userEmail: string, action: string, entityType: string, entityId?: string, details?: Record<string, any>) {
  sql`
    INSERT INTO public.audit_logs (user_id, user_email, action, entity_type, entity_id, details)
    VALUES (${userId}, ${userEmail}, ${action}, ${entityType}, ${entityId || ''}, ${JSON.stringify(details || {})})
  `.catch((err: any) => {
    console.error('[audit-server] Failed to log:', action, entityType, err?.message || err);
  });
}
