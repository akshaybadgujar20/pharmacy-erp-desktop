import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { TabsModule } from 'primeng/tabs';
import { ApiClientError } from '../../../core/models/api-response.types';
import { LedgerEntriesTabComponent } from './ledger-entries-tab.component';
import { LedgerService } from './ledger.service';

@Component({
  selector: 'app-ledger-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    CheckboxModule,
    TabsModule,
    LedgerEntriesTabComponent,
  ],
  templateUrl: './ledger-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LedgerDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ledgerService = inject(LedgerService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly ledgerId = signal<string | null>(null);
  readonly isSystem = signal(false);
  readonly activeTab = signal('overview');
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal(0);

  readonly form = this.fb.nonNullable.group({
    ledgerCode: ['', Validators.required],
    ledgerName: ['', Validators.required],
    ledgerType: ['ASSET', Validators.required],
    normalBalance: ['DEBIT', Validators.required],
    parentLedgerId: [''],
    description: [''],
    isActive: [true],
  });

  ngOnInit(): void {
    const ledgerId = this.route.snapshot.paramMap.get('ledgerId');
    if (ledgerId) {
      this.isNew.set(false);
      this.ledgerId.set(ledgerId);
      this.activeTab.set(
        this.route.snapshot.url.some((segment) => segment.path === 'entries')
          ? 'entries'
          : 'overview',
      );
      this.load(ledgerId);
    }
  }

  onTabChange(tab: string | number | undefined): void {
    if (tab === undefined) {
      return;
    }
    const tabValue = String(tab);
    this.activeTab.set(tabValue);
    const id = this.ledgerId();
    if (!id) {
      return;
    }
    if (tabValue === 'entries') {
      this.router.navigate(['/finance/ledgers', id, 'entries']);
      return;
    }
    this.router.navigate(['/finance/ledgers', id]);
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    const value = this.form.getRawValue();

    if (this.isNew()) {
      this.ledgerService
        .create({
          ledgerCode: value.ledgerCode,
          ledgerName: value.ledgerName,
          ledgerType: value.ledgerType,
          normalBalance: value.normalBalance,
          parentLedgerId: value.parentLedgerId || undefined,
          description: value.description || undefined,
          isActive: value.isActive,
        })
        .subscribe({
          next: (ledger) => {
            this.saving.set(false);
            this.isNew.set(false);
            this.ledgerId.set(ledger.id);
            this.version.set(ledger.version);
            this.isSystem.set(ledger.isSystem);
            this.router.navigate(['/finance/ledgers', ledger.id], { replaceUrl: true });
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.ledgerService
      .update(this.ledgerId()!, {
        version: this.version(),
        ledgerCode: value.ledgerCode,
        ledgerName: value.ledgerName,
        ledgerType: value.ledgerType,
        normalBalance: value.normalBalance,
        parentLedgerId: value.parentLedgerId || undefined,
        description: value.description || undefined,
        isActive: value.isActive,
      })
      .subscribe({
        next: (ledger) => {
          this.version.set(ledger.version);
          this.saving.set(false);
        },
        error: (error) => this.handleError(error),
      });
  }

  deleteRecord(): void {
    const id = this.ledgerId();
    if (!id) {
      return;
    }

    this.deleting.set(true);
    this.errorMessage.set('');
    this.ledgerService.delete(id, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/finance/ledgers']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/finance/ledgers']);
  }

  private load(id: string): void {
    this.ledgerService.getById(id).subscribe({
      next: (ledger) => {
        this.version.set(ledger.version);
        this.isSystem.set(ledger.isSystem);
        this.form.patchValue({
          ledgerCode: ledger.ledgerCode,
          ledgerName: ledger.ledgerName,
          ledgerType: ledger.ledgerType,
          normalBalance: ledger.normalBalance,
          parentLedgerId: ledger.parentLedgerId ?? '',
          description: ledger.description ?? '',
          isActive: ledger.isActive,
        });
        if (ledger.isSystem) {
          this.form.controls.ledgerCode.disable();
        }
      },
      error: (error) => this.handleError(error),
    });
  }

  private handleError(error: unknown): void {
    this.saving.set(false);
    this.errorMessage.set(
      error instanceof ApiClientError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Request failed',
    );
  }
}
