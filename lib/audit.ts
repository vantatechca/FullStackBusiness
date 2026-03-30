// Client-side audit log helper — fire and forget
export function logAudit(action: string, entityType: string, entityId?: string, details?: Record<string, any>) {
  fetch('/api/audit-logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, entity_type: entityType, entity_id: entityId || '', details: details || {} }),
  }).catch(() => {}); // silent — never block the UI
}
