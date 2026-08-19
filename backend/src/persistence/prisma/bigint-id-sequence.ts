let idSequence = 0n;

/** SQLite BIGINT PKs from db push lack AUTOINCREMENT; assign ids explicitly on create. */
export function nextBigIntId(): bigint {
  idSequence += 1n;
  return idSequence;
}

export function resetBigIntIdSequence(start = 0n): void {
  idSequence = start;
}

export async function syncBigIntIdSequenceFromDb(
  queryMaxId: () => Promise<bigint | null>,
): Promise<void> {
  const maxId = await queryMaxId();
  if (maxId !== null && maxId > idSequence) {
    idSequence = maxId;
  }
}
