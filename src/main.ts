import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

import {
  ModuleRegistry,
  AllCommunityModule,
  provideGlobalGridOptions
} from 'ag-grid-community';

ModuleRegistry.registerModules([
  AllCommunityModule
]);

provideGlobalGridOptions({
  theme: 'legacy'
});

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
