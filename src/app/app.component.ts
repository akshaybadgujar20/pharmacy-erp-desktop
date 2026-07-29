import { Component, ChangeDetectionStrategy } from '@angular/core';
import {MatIcon} from '@angular/material/icon';
import {RouterLinkActive, RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [
    MatIcon,
    RouterOutlet,
    RouterLinkActive
  ],
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'pharmacy-erp';
  isCollapsed = false;

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }
}
