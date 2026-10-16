import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { LoyaltyProgramRow, LoyaltyProgramService } from './loyalty-program.service';

@Component({
  selector: 'app-loyalty-program-list',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <section>
      <h2>Loyalty programs</h2>
      <button pButton type="button" label="New program" (click)="create()"></button>
      <ul>
        @for (row of rows(); track row.id) {
          <li>
            <button pButton type="button" [text]="true" (click)="open(row)">
              {{ row.programCode }} — {{ row.programName }}
            </button>
          </li>
        }
      </ul>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoyaltyProgramListComponent implements OnInit {
  private readonly loyaltyPrograms = inject(LoyaltyProgramService);
  private readonly router = inject(Router);
  readonly rows = signal<LoyaltyProgramRow[]>([]);

  ngOnInit(): void {
    this.loyaltyPrograms.list().subscribe({
      next: ({ data }) => this.rows.set(data),
    });
  }

  create(): void {
    this.router.navigate(['/loyalty/programs/new']);
  }

  open(row: LoyaltyProgramRow): void {
    this.router.navigate(['/loyalty/programs', row.id]);
  }
}
