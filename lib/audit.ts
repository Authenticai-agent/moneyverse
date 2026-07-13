import { Prisma } from '@prisma/client';
import { getPrisma, getRlsContext, withRlsContext, withSystemContext } from './prisma';

export type AuditAction =
  | 'auth.register'
  | 'auth.login'
  | 'auth.refresh'
  | 'auth.logout'
  | 'auth.refresh_reuse_detected'
  | 'auth.csrf_failed'
  | 'auth.rate_limited'
  | 'family.created'
  | 'child_profile.created'
  | 'child_profile.viewed'
  | 'child_profile.deleted'
  | 'lesson.started'
  | 'lesson.completed'
  | 'lesson.answered'
  | 'xp.awarded'
  | 'ledger.entry.created'
  | 'savings.goal.created'
  | 'savings.goal.updated'
  | 'savings.goal.allocated';

export type AuditResult = 'success' | 'failure' | 'blocked' | 'warning';

async function insertAuditEvent(
  db: Prisma.TransactionClient,
  args: {
    actorId?: string;
    action: AuditAction;
    targetType: string;
    targetId?: string;
    result: AuditResult;
    reasonCode?: string;
    correlationId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  await db.$executeRaw`
    INSERT INTO "audit_events" ("id", "actor_id", "action", "target_type", "target_id", "result", "reason_code", "correlation_id", "metadata")
    VALUES (
      gen_random_uuid(),
      ${args.actorId ?? null}::uuid,
      ${args.action},
      ${args.targetType},
      ${args.targetId ?? null}::uuid,
      ${args.result},
      ${args.reasonCode ?? null},
      ${args.correlationId ?? null},
      ${JSON.stringify(redactMetadata(args.metadata)) ?? null}::jsonb
    )
  `;
}

export async function auditEvent(args: {
  actorId?: string;
  action: AuditAction;
  targetType: string;
  targetId?: string;
  result: AuditResult;
  reasonCode?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const ctx = getRlsContext();
  if (!ctx) {
    if (args.actorId) {
      return withRlsContext({ userId: args.actorId }, async (tx) => {
        await insertAuditEvent(tx, args);
      });
    }
    return withSystemContext(async (tx) => {
      await insertAuditEvent(tx, args);
    });
  }

  const db = getPrisma();
  if (!args.actorId && !ctx.bypass) {
    await db.$executeRaw`SELECT set_config('app.bypass_rls', 'true', true)`;
    try {
      await insertAuditEvent(db, args);
    } finally {
      await db.$executeRaw`SELECT set_config('app.bypass_rls', '', true)`;
    }
  } else {
    await insertAuditEvent(db, args);
  }
}

export async function securityEvent(args: {
  actorId?: string;
  action: string;
  targetType: string;
  targetId?: string;
  result: AuditResult;
  reasonCode?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const db = getPrisma();
  await db.securityEvent.create({
    data: {
      actorId: args.actorId,
      action: args.action,
      targetType: args.targetType,
      targetId: args.targetId,
      result: args.result,
      reasonCode: args.reasonCode,
      correlationId: args.correlationId,
      metadata: redactMetadata(args.metadata) as Prisma.InputJsonValue,
    },
  });
}

function redactMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!metadata) return undefined;
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === 'string' && isSensitiveKey(key)) {
      redacted[key] = '[REDACTED]';
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return (
    lower.includes('password') ||
    lower.includes('token') ||
    lower.includes('secret') ||
    lower.includes('pin') ||
    lower.includes('credential') ||
    lower.includes('card')
  );
}
