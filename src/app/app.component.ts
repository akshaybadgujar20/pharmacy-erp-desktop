import { Component, inject } from '@angular/core';
import {MatIcon} from '@angular/material/icon';
import {NavigationEnd, Router, RouterLinkActive, RouterOutlet, RouterLink} from '@angular/router';
import { filter, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { ShortcutHelpComponent } from './shared/components/shortcut-help/shortcut-help.component';
import { KeyboardShortcutService } from './core/services/keyboard-shortcut.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [
    MatIcon,
    RouterOutlet,
    RouterLinkActive,
    RouterLink,
    ShortcutHelpComponent,
  ],
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly keyboardShortcuts = inject(KeyboardShortcutService);

  title = 'pharmacy-erp';
  isCollapsed = false;

  readonly isLoginRoute = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url.startsWith('/login')),
    ),
    { initialValue: this.router.url.startsWith('/login') },
  );

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }
}
