import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { SelectModule } from 'primeng/select';
import {
  AppLanguage,
  LanguageService,
} from '../../../core/services/language.service';

interface LanguageOption {
  value: AppLanguage;
  labelKey: string;
}

interface DisplayOption {
  value: AppLanguage;
  label: string;
}

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [FormsModule, SelectModule, TranslatePipe],
  templateUrl: './language-selector.component.html',
  styleUrl: './language-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSelectorComponent implements OnInit, OnDestroy {
  private readonly languageService = inject(LanguageService);
  private readonly translate = inject(TranslateService);
  private langChangeSub?: Subscription;

  private readonly options: LanguageOption[] = [
    { value: 'english', labelKey: 'language.english' },
    { value: 'marathi', labelKey: 'language.marathi' },
  ];

  readonly selectedLanguage = computed(() => this.languageService.currentLanguage());
  readonly displayOptions = signal<DisplayOption[]>([]);

  ngOnInit(): void {
    this.refreshDisplayOptions();
    this.langChangeSub = this.translate.onLangChange.subscribe(() => {
      this.refreshDisplayOptions();
    });
  }

  ngOnDestroy(): void {
    this.langChangeSub?.unsubscribe();
  }

  onLanguageChange(language: AppLanguage): void {
    this.languageService.setLanguage(language);
  }

  private refreshDisplayOptions(): void {
    this.displayOptions.set(
      this.options.map((option) => ({
        value: option.value,
        label: this.translate.instant(option.labelKey),
      })),
    );
  }
}
