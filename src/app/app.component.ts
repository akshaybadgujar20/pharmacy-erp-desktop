import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import { ButtonDirective } from 'primeng/button';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [
    ButtonDirective
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.component.scss'
})
export class AppComponent {
}
