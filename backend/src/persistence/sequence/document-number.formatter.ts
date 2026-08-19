export interface FormatDocumentNumberInput {
  prefix?: string | null;
  suffix?: string | null;
  paddingLength: number;
  format?: string | null;
  sequenceValue: bigint;
  branchCode?: string;
}

export function formatDocumentNumber(input: FormatDocumentNumberInput): string {
  const seq = String(input.sequenceValue).padStart(input.paddingLength, '0');
  const prefix = input.prefix ?? '';
  const suffix = input.suffix ?? '';
  const branchCode = input.branchCode ?? '';

  if (input.format) {
    return input.format
      .replace('{PREFIX}', prefix)
      .replace('{BR}', branchCode)
      .replace('{SEQ}', seq)
      .replace('{SUFFIX}', suffix);
  }

  if (prefix && branchCode) {
    return `${prefix}-${branchCode}-${seq}${suffix}`;
  }
  if (prefix) {
    return `${prefix}-${seq}${suffix}`;
  }
  return `${seq}${suffix}`;
}
