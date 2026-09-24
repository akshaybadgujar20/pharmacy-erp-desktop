import {Component, inject} from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import {LoadingService} from '../../services/loading.service';
@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [ProgressSpinnerModule],
  template: `
    @if (loadingService.isLoading()) {
      <div class="loading-overlay">
        <p-progress-spinner
          fill="transparent"
          aria-label="Loading"
          animationDuration="1s"
          ariaLabel="Loading">
        </p-progress-spinner>
      </div>
    }
  `,
  styleUrl: './loading-overlay.component.scss'
})
export class LoadingOverlayComponent {

  protected readonly loadingService = inject(LoadingService);
}
