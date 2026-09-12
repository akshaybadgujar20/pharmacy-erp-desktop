import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type AppLanguage = 'english' | 'marathi';

const STORAGE_KEY = 'app-language';
const DEFAULT_LANGUAGE: AppLanguage = 'english';
const SUPPORTED_LANGUAGES: AppLanguage[] = ['english', 'marathi'];

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);

  private readonly currentLanguageSignal = signal<AppLanguage>(DEFAULT_LANGUAGE);
  readonly currentLanguage = this.currentLanguageSignal.asReadonly();

  init(): void {
    const saved = this.readSavedLanguage();
    this.currentLanguageSignal.set(saved);
    this.translate.use(saved);
  }

  setLanguage(language: AppLanguage): void {
    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return;
    }

    this.currentLanguageSignal.set(language);
    this.translate.use(language);
    localStorage.setItem(STORAGE_KEY, language);
  }

  private readSavedLanguage(): AppLanguage {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.includes(saved as AppLanguage)) {
      return saved as AppLanguage;
    }
    return DEFAULT_LANGUAGE;
  }
}
