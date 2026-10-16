import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { LoyaltyProgramRow, LoyaltyProgramService } from './loyalty-program.service';

@Component({
  selector: 'app-loyalty-program-list',
  standalone: true,
  template: `
    <section>
      <h2>Loyalty programs</h2>
      <ul>
        @for (row of rows(); track row.id) {
          <li>{{ row.programCode }} — {{ row.programName }}</li>
        }
      </ul>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoyaltyProgramListComponent implements OnInit {
  private readonly loyaltyPrograms = inject(LoyaltyProgramService);
  readonly rows = signal<LoyaltyProgramRow[]>([]);

  ngOnInit(): void {
    this.loyaltyPrograms.list().subscribe({
      next: ({ data }) => this.rows.set(data),
    });
  }
}
