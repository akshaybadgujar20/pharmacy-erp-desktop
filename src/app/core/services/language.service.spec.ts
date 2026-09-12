import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  let languageService: LanguageService;
  let translate: jest.Mocked<Pick<TranslateService, 'use'>>;

  beforeEach(() => {
    localStorage.clear();
    translate = {
      use: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        LanguageService,
        { provide: TranslateService, useValue: translate },
      ],
    });

    languageService = TestBed.inject(LanguageService);
  });

  it('initializes with english when no saved language exists', () => {
    languageService.init();

    expect(languageService.currentLanguage()).toBe('english');
    expect(translate.use).toHaveBeenCalledWith('english');
  });

  it('initializes from localStorage when a saved language exists', () => {
    localStorage.setItem('app-language', 'marathi');

    languageService.init();

    expect(languageService.currentLanguage()).toBe('marathi');
    expect(translate.use).toHaveBeenCalledWith('marathi');
  });

  it('setLanguage switches translate and persists to localStorage', () => {
    languageService.setLanguage('marathi');

    expect(languageService.currentLanguage()).toBe('marathi');
    expect(translate.use).toHaveBeenCalledWith('marathi');
    expect(localStorage.getItem('app-language')).toBe('marathi');
  });
});
