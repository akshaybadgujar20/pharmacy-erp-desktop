const maps = new Map<string, Map<string, bigint>>();
let idSequence = 0n;

/** SQLite BIGINT PKs from db push lack AUTOINCREMENT; assign ids explicitly on create. */
export function nextId(): bigint {
  idSequence += 1n;
  return idSequence;
}

export function resetIdSequence(start = 0n): void {
  idSequence = start;
}

export function register(model: string, uuid: string, id: bigint): void {
  if (!maps.has(model)) maps.set(model, new Map());
  maps.get(model)!.set(uuid, id);
}

export function resolve(model: string, uuid: string): bigint {
  const id = maps.get(model)?.get(uuid);
  if (id === undefined) {
    throw new Error(`Missing ${model} uuid=${uuid} in id registry`);
  }
  return id;
}

export function tryResolve(model: string, uuid: string): bigint | undefined {
  return maps.get(model)?.get(uuid);
}

export function clearRegistry(): void {
  maps.clear();
  resetIdSequence();
}

export function decimal(value: number | string): string {
  return typeof value === 'number' ? value.toFixed(2) : value;
}

export function docNumber(prefix: string, branchCode: string, seq: number, pad = 6): string {
  return `${prefix}-${branchCode}-${String(seq).padStart(pad, '0')}`;
}
