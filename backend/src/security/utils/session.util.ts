import type { TxClient } from '../../persistence/prisma/prisma-tx.type';

export async function invalidateUserSessions(
  tx: TxClient,
  userId: bigint,
  reason: string,
): Promise<void> {
  const now = BigInt(Date.now());

  await tx.userSession.updateMany({
    where: { userId, isActive: true, deletedAt: null },
    data: {
      isActive: false,
      logoutTime: now,
      logoutReason: reason,
      updatedAt: now,
    },
  });
}

export async function invalidateSessionsForRole(
  tx: TxClient,
  roleId: bigint,
  reason: string,
): Promise<void> {
  const userRoles = await tx.userRole.findMany({
    where: { roleId, isActive: true, deletedAt: null },
    select: { userId: true },
  });

  const userIds = [...new Set(userRoles.map((userRole) => userRole.userId))];

  for (const userId of userIds) {
    await invalidateUserSessions(tx, userId, reason);
  }
}
