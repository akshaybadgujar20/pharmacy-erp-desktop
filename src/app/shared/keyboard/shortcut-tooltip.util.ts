export function escapeTooltipHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatShortcutTooltipHtml(
  label: string,
  shortcutLabel?: string,
): string {
  const safeLabel = escapeTooltipHtml(label);
  if (!shortcutLabel) {
    return `<span class="shortcut-tooltip"><span class="shortcut-tooltip__label">${safeLabel}</span></span>`;
  }
  const safeKey = escapeTooltipHtml(shortcutLabel);
  return `<span class="shortcut-tooltip"><span class="shortcut-tooltip__label">${safeLabel}</span><span class="shortcut-tooltip__key">${safeKey}</span></span>`;
}