import { registerLocaleData } from '@angular/common';
import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import localeEnIn from '@angular/common/locales/en-IN';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { routes } from './app.routes';

registerLocaleData(localeEnIn);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withXhr(), withInterceptors([authInterceptor, errorInterceptor])),
    providePrimeNG({
      license: 'eyJpZCI6IjQ0OWVhMmFlLTE0YzYtNGJmMy05YWRkLTdkMGQwNWQzMTc3YyIsInByb2R1Y3QiOiJwcmltZXVpIiwidGllciI6ImNvbW11bml0eSIsInR5cGUiOiJkZXYiLCJpYXQiOjE3ODg0MzUzNTksImV4cCI6MTgxOTk3MTM1OX0.o3kcNwc9vXJp8jrhJHbEjAD4bVyq_Mof_cR4Kp9ZowYt9H2PzQgR3fZsEcAN69EK6SsRcflToocZ0XT19-dOAQ',
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: false,
        },
      },
    }),
    provideTranslateService({
      fallbackLang: 'english',
      lang: 'english',
      loader: provideTranslateHttpLoader({
        prefix: './i18n/',
        suffix: '.json',
      }),
    }),
    { provide: LOCALE_ID, useValue: 'en-IN' },
    MessageService,
    ConfirmationService,
    DialogService,
  ],
};
