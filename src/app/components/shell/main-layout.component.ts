import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import {SidebarCollapsible, SidebarModule, SidebarSide, SidebarVariant} from 'primeng/sidebar';
import { PIcon } from '@primeicons/angular/p-icon';
import { Sidebar } from '@primeicons/angular/sidebar';
import { AuthService } from '../../core/services/auth.service';
import { KeyboardShortcutService } from '../../core/keyboard';
import { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';
import { KeyboardShortcutsDialogComponent } from '../../shared/components/keyboard-shortcuts/keyboard-shortcuts-dialog.component';
import { ERP_NAV_GROUPS } from './nav.config';
import { filterNavGroups } from './nav.utils';
import {Tooltip} from 'primeng/tooltip';

interface NavItem {
  icon: string;
  label: string;
  isActive?: boolean;
  badge?: string;
  subItems?: { label: string; isActive?: boolean }[];
}
interface NavGroup {
  label: string;
  items: NavItem[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    AvatarModule,
    SidebarModule,
    ButtonModule,
    PIcon,
    TranslatePipe,
    Sidebar,
    KeyboardShortcutsDialogComponent,
    LanguageSelectorComponent,
    Tooltip,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  readonly shortcutService = inject(KeyboardShortcutService);

  variant: SidebarVariant = 'floating';
  collapsible: SidebarCollapsible = 'icon';
  side: SidebarSide = 'left';
  overlay: boolean = false;
  openOnHover: boolean = false;
  backdrop: boolean = false;

  variantOptions = [
    { label: 'Sidebar', value: 'sidebar' },
    { label: 'Floating', value: 'floating' },
    { label: 'Inset', value: 'inset' }
  ];
  collapsibleOptions = [
    { label: 'Icon', value: 'icon' },
    { label: 'Offcanvas', value: 'offcanvas' },
    { label: 'None', value: 'none' }
  ];
  sideOptions = [
    { label: 'Left', value: 'left' },
    { label: 'Right', value: 'right' }
  ];


  isMobile = signal(false);
  open = signal(true);
  private mql?: MediaQueryList;
  private mqlListener?: (e: MediaQueryListEvent) => void;

  readonly navGroups = computed(() => filterNavGroups(ERP_NAV_GROUPS, this.authService));
  readonly currentUser = this.authService.currentUser;
  loggingOut = false;

  hasActiveSub(item: NavItem): boolean {
    return !!item.subItems?.some((s) => s.isActive);
  }

  ngOnInit(): void {
    if (typeof window === 'undefined') {
      return;
    }
    this.mql = window.matchMedia('(max-width: 1023px)');
    this.isMobile.set(this.mql.matches);
    this.open.set(!this.mql.matches);
    this.mqlListener = (e) => {
      this.isMobile.set(e.matches);
      this.open.set(!e.matches);
    };
    this.mql.addEventListener('change', this.mqlListener);
  }

  ngOnDestroy(): void {
    this.mql?.removeEventListener('change', this.mqlListener!);
  }

  userInitials(): string {
    const username = this.currentUser()?.username ?? '?';
    return username.slice(0, 2).toUpperCase();
  }

  async logout(): Promise<void> {
    if (this.loggingOut) {
      return;
    }

    this.loggingOut = true;
    try {
      await this.authService.logout();
    } finally {
      this.loggingOut = false;
    }
  }
}
