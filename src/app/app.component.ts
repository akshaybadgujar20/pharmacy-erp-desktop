import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppDialogShellComponent } from './components/generic/dialog/shell/app-dialog-shell.component';
import { AppToastHostComponent } from './components/generic/toast/app-toast-host.component';
import { LanguageService } from './core/services/language.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AppToastHostComponent, AppDialogShellComponent],
  template: '<app-toast-host /><app-dialog-shell /><router-outlet />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  private readonly languageService = inject(LanguageService);

  ngOnInit(): void {
    this.languageService.init();
  }
}
