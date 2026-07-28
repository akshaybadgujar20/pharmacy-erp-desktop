import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { SidebarModule } from 'primeng/sidebar';

@Component({
  selector: 'app-root',
  imports: [
    ButtonModule,
    SidebarModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'pharmacy-erp';
  navItems = [
    { label: 'Dashboard', icon: 'pi pi-home' },
    { label: 'Analytics', icon: 'pi pi-chart-bar' },
    { label: 'Users', icon: 'pi pi-users' },
    { label: 'Settings', icon: 'pi pi-cog' }
  ];
}
