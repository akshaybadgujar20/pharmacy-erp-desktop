# AppToast / NotificationService

Configuration-driven toast notifications for pharmacy ERP screens. Wraps PrimeNG `Toast` and `MessageService` behind a typed service API.

## Location

```text
src/app/components/generic/toast/
```

Mount `<app-toast-host />` once in the app shell. Call `NotificationService` from features and interceptors.

## Setup

`MessageService` is provided in `app.config.ts`. The root component renders the toast host:

```html
<app-toast-host />
<router-outlet />
```

## Usage

```ts
import { inject } from '@angular/core';
import { NotificationService } from '../../components/generic/toast';

private notification = inject(NotificationService);

onSave() {
  this.customerService.create(dto).subscribe({
    next: () => this.notification.success('Saved', 'Customer created successfully'),
    error: (err) => this.notification.showApiError(err),
  });
}
```

### Generic show

```ts
this.notification.show({
  severity: 'warn',
  summary: 'Check this',
  detail: 'Some fields may need your attention.',
  life: 5000,
});
```

### Loading promise pattern

```ts
await this.notification.runWithLoadingToast({
  task: () => firstValueFrom(this.api.export()),
  loading: { summary: 'Exporting...', detail: 'This may take a moment.' },
  onSuccess: () => ({ summary: 'Export complete', detail: 'File is ready.' }),
  onError: (err) => ({
    summary: 'Export failed',
    detail: err instanceof Error ? err.message : 'Unknown error',
  }),
});
```

### Custom host config

```html
<app-toast-host [config]="{ position: 'bottom-center', mode: 'expanded' }" />
```

## API

| Method | Purpose |
|--------|---------|
| `show(config)` | Show a toast from `ToastMessageConfig` |
| `success/info/warn/error(summary, detail?, overrides?)` | Severity shorthands |
| `clear(key?)` | Dismiss keyed or all toasts |
| `showApiError(error)` | Map `ApiClientError` / HTTP errors to error toast |
| `runWithLoadingToast(config)` | Sticky loading toast, then success/error result |

## Types

- `ToastHostConfig` — global presentation (`position`, `mode`, `key`, `stackVisibleLimit`)
- `ToastMessageConfig` — per-notification (`severity`, `summary`, `detail`, `life`, `sticky`, `icon`)
- `ToastPromiseConfig<T>` — async helper config

## Conventions

- Features call `NotificationService`; do not inject PrimeNG `MessageService` directly.
- Resolve i18n strings in the feature before calling the service.
- HTTP errors are surfaced automatically via `error.interceptor.ts` except auth redirect codes.

## Tests

```bash
npm test -- --testPathPatterns=generic/toast
```
