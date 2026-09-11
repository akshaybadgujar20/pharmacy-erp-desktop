import { ToastMessageOptions } from 'primeng/api';
import { mergeToastMessageConfig } from './toast-defaults';
import { ToastMessageConfig } from '../types/toast-message.types';

export function toPrimeMessage(config: ToastMessageConfig): ToastMessageOptions {
  const merged = mergeToastMessageConfig(config);

  const message: ToastMessageOptions = {
    severity: merged.severity,
    summary: merged.summary,
    detail: merged.detail,
    life: merged.sticky ? undefined : merged.life,
    sticky: merged.sticky,
    closable: merged.closable,
    key: merged.key,
    icon: merged.icon,
    styleClass: merged.styleClass,
  };

  return message;
}
