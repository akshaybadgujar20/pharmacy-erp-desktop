import {

  ChangeDetectionStrategy,

  Component,

  computed,

  inject,

  OnInit,

  signal,

} from '@angular/core';

import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';

import { InputTextModule } from 'primeng/inputtext';

import { ApiClientError } from '../../core/models/api-response.types';

import { AppGridComponent } from '../../components/generic/grid';

import { GridConfig } from '../../components/generic/grid/types/grid.types';

import { GridPageChange } from '../../components/generic/grid/types/grid-events.types';

import { toListParams } from '../../shared/utils/list-query.util';

import { ReportRunResult } from './report.models';

import { ReportService } from './report.service';



@Component({

  selector: 'app-report-runner',

  standalone: true,

  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, AppGridComponent],

  templateUrl: './report-runner.component.html',

  changeDetection: ChangeDetectionStrategy.OnPush,

})

export class ReportRunnerComponent implements OnInit {

  private readonly fb = inject(FormBuilder);

  private readonly reportService = inject(ReportService);

  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);



  readonly reportId = signal('');

  readonly running = signal(false);

  readonly errorMessage = signal('');

  readonly rows = signal<Record<string, unknown>[]>([]);

  readonly totalRecords = signal(0);

  readonly page = signal(1);

  readonly pageSize = signal(25);

  readonly serverSide = signal(false);



  readonly form = this.fb.nonNullable.group({

    fromDate: [''],

    toDate: [''],

    branchId: [''],

    search: [''],

  });



  readonly gridConfig = computed<GridConfig<Record<string, unknown>>>(() => ({

    id: 'report-runner-grid',

    columns: this.columns().map((column) => ({

      field: column.key,

      headerName: column.label,

      type: this.mapColumnType(column.type),

      align: column.align,

      sortable: true,

    })),

    row: { getId: (row) => JSON.stringify(row) },

    pagination: {

      enabled: true,

      serverSide: this.serverSide(),

      pageSize: this.pageSize(),

    },

    filtering: { enabled: false },

  }));



  private readonly columns = signal<ReportRunResult['columns']>([]);



  ngOnInit(): void {

    const reportId = this.route.snapshot.paramMap.get('reportId');

    if (reportId) {

      this.reportId.set(reportId);

    }

  }



  runReport(): void {

    this.page.set(1);

    this.execute();

  }



  onPageChange(event: GridPageChange): void {

    this.page.set(event.page);

    this.pageSize.set(event.pageSize);

    if (this.serverSide()) {

      this.execute();

    }

  }



  goBack(): void {

    this.router.navigate(['/reports']);

  }



  private execute(): void {

    const reportId = this.reportId();

    if (!reportId) {

      return;

    }



    this.running.set(true);

    this.errorMessage.set('');

    const value = this.form.getRawValue();

    const params: Record<string, string> = {

      ...toListParams(this.page(), this.pageSize(), value.search),

    };



    if (value.fromDate.trim()) {

      params['fromDate'] = value.fromDate.trim();

    }

    if (value.toDate.trim()) {

      params['toDate'] = value.toDate.trim();

    }

    if (value.branchId.trim()) {

      params['branchId'] = value.branchId.trim();

    }



    this.reportService.run(reportId, params).subscribe({

      next: (result) => {

        this.columns.set(result.columns);

        this.rows.set(result.rows);

        this.serverSide.set(!!result.pagination);

        this.totalRecords.set(result.pagination?.total ?? result.rows.length);

        this.running.set(false);

      },

      error: (error) => {

        this.running.set(false);

        this.errorMessage.set(

          error instanceof ApiClientError

            ? error.message

            : error instanceof Error

              ? error.message

              : 'Request failed',

        );

      },

    });

  }



  private mapColumnType(

    type: string,

  ): 'text' | 'number' | 'currency' | 'date' | 'datetime' | 'boolean' {

    switch (type) {

      case 'number':

        return 'number';

      case 'decimal':

        return 'currency';

      case 'date':

        return 'date';

      case 'datetime':

        return 'datetime';

      case 'boolean':

        return 'boolean';

      default:

        return 'text';

    }

  }

}


