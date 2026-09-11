import fs from 'fs';
import path from 'path';

const root = path.join(process.cwd(), 'src', 'app', 'features');

function write(rel, content) {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
}

function dateUtil(module) {
  return `export function toEpochMs(isoDate: string): string {
  return String(new Date(isoDate).getTime());
}

export function optionalEpochMs(isoDate: string): string | undefined {
  if (!isoDate.trim()) {
    return undefined;
  }
  return toEpochMs(isoDate);
}

export function nullableEpochMs(isoDate: string): string | null | undefined {
  if (!isoDate.trim()) {
    return null;
  }
  return toEpochMs(isoDate);
}

export function fromEpochMs(epoch: string): string {
  return new Date(Number(epoch)).toISOString();
}
`;
}

function workflowInterface() {
  return `export interface WorkflowRequest {
  version: number;
  remarks?: string;
}
`;
}

function genModels(entity) {
  const iface = entity.responseFields
    .map((f) => `  ${f.name}: ${f.type};`)
    .join('\n');
  const createFields = entity.createFields
    .map((f) => `  ${f.name}${f.optional ? '?' : ''}: ${f.tsType};`)
    .join('\n');
  const updateFields = entity.updateFields
    .map((f) => `  ${f.name}${f.optional ? '?' : ''}: ${f.tsType};`)
    .join('\n');

  return `export interface ${entity.entityName} {
  id: string;
${iface}
  version: number;
}

export interface Create${entity.entityName}Request {
${createFields}
}

export interface Update${entity.entityName}Request {
  version: number;
${updateFields}
}

${workflowInterface()}`;
}

function genItemModels(item) {
  const iface = item.responseFields
    .map((f) => `  ${f.name}: ${f.type};`)
    .join('\n');
  const createFields = item.createFields
    .map((f) => `  ${f.name}${f.optional ? '?' : ''}: ${f.tsType};`)
    .join('\n');
  const updateFields = item.updateFields
    .map((f) => `  ${f.name}${f.optional ? '?' : ''}: ${f.tsType};`)
    .join('\n');

  return `export interface ${item.entityName} {
  id: string;
${iface}
  version: number;
}

export interface Create${item.entityName}Request {
${createFields}
}

export interface Update${item.entityName}Request {
  version: number;
${updateFields}
}`;
}

function genService(entity, modulePrefix) {
  const workflowMethods = (entity.workflowActions || [])
    .map((action) => {
      const method = action.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      return `
  ${method}(id: string, body: WorkflowRequest): Observable<${entity.entityName}> {
    return this.api.post<${entity.entityName}>(\`\${this.basePath}/\${id}/${action}\`, body);
  }`;
    })
    .join('');

  return `import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  Create${entity.entityName}Request,
  ${entity.entityName},
  Update${entity.entityName}Request,
  WorkflowRequest,
} from './${entity.filePrefix}.models';

@Injectable({ providedIn: 'root' })
export class ${entity.serviceName} {
  private readonly api = inject(ApiService);
  private readonly basePath = '${entity.apiPath}';

  list(params: Record<string, string>): Observable<{
    data: ${entity.entityName}[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<${entity.entityName}>(this.basePath, params);
  }

  getById(id: string): Observable<${entity.entityName}> {
    return this.api.get<${entity.entityName}>(\`\${this.basePath}/\${id}\`);
  }

  create(body: Create${entity.entityName}Request): Observable<${entity.entityName}> {
    return this.api.post<${entity.entityName}>(this.basePath, body);
  }

  update(id: string, body: Update${entity.entityName}Request): Observable<${entity.entityName}> {
    return this.api.patch<${entity.entityName}>(\`\${this.basePath}/\${id}\`, body);
  }

  delete(id: string, version: number): Observable<void> {
    return this.api.delete<void>(\`\${this.basePath}/\${id}\`, {
      version: String(version),
    });
  }${workflowMethods}
}
`;
}

function genItemService(entity, item) {
  const updatePerm = item.updateUsesUpdatePerm ? 'UPDATE' : 'UPDATE';
  return `import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  Create${item.entityName}Request,
  ${item.entityName},
  Update${item.entityName}Request,
} from './${item.filePrefix}.models';

@Injectable({ providedIn: 'root' })
export class ${item.serviceName} {
  private readonly api = inject(ApiService);

  list(
    parentId: string,
    params: Record<string, string>,
  ): Observable<{ data: ${item.entityName}[]; pagination: Pagination }> {
    return this.api.getPaginated<${item.entityName}>(
      \`${entity.apiPath}/\${parentId}/items\`,
      params,
    );
  }

  getById(parentId: string, id: string): Observable<${item.entityName}> {
    return this.api.get<${item.entityName}>(
      \`${entity.apiPath}/\${parentId}/items/\${id}\`,
    );
  }

  create(parentId: string, body: Create${item.entityName}Request): Observable<${item.entityName}> {
    return this.api.post<${item.entityName}>(
      \`${entity.apiPath}/\${parentId}/items\`,
      body,
    );
  }

  update(
    parentId: string,
    id: string,
    body: Update${item.entityName}Request,
  ): Observable<${item.entityName}> {
    return this.api.patch<${item.entityName}>(
      \`${entity.apiPath}/\${parentId}/items/\${id}\`,
      body,
    );
  }

  delete(parentId: string, id: string, version: number): Observable<void> {
    return this.api.delete<void>(\`${entity.apiPath}/\${parentId}/items/\${id}\`, {
      version: String(version),
    });
  }
}
`;
}

function genGrid(entity) {
  const cols = entity.listColumns
    .map(
      (c) =>
        `    { field: '${c.field}', headerName: '${c.header}', sortable: true${c.type ? `, type: '${c.type}'` : ''}${c.filterable ? ', filterable: true' : ''} },`,
    )
    .join('\n');

  return `import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { ${entity.entityName} } from './${entity.filePrefix}.models';

export const ${entity.gridConst}: GridConfig<${entity.entityName}> = {
  id: '${entity.filePrefix}-grid',
  columns: [
${cols}
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    { id: 'edit', label: 'Edit', icon: 'pi pi-pencil', permission: '${entity.permission}:UPDATE' },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: '${entity.permission}:DELETE',
      confirmation: true,
    },
  ],
};
`;
}

function genItemGrid(item, entity) {
  const cols = item.listColumns
    .map(
      (c) =>
        `    { field: '${c.field}', headerName: '${c.header}', sortable: true${c.type ? `, type: '${c.type}'` : ''} },`,
    )
    .join('\n');

  return `import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { ${item.entityName} } from './${item.filePrefix}.models';

export const ${item.gridConst}: GridConfig<${item.entityName}> = {
  id: '${item.filePrefix}-grid',
  columns: [
${cols}
  ],
  row: { getId: (row) => row.id },
  pagination: { enabled: true, serverSide: true, pageSize: 10 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    {
      id: 'edit',
      label: 'Edit',
      icon: 'pi pi-pencil',
      permission: '${entity.permission}:UPDATE',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: '${entity.permission}:DELETE',
      confirmation: true,
    },
  ],
};
`;
}

function genToolbar(entity) {
  return `import { ToolbarConfig } from '../../../components/generic/toolbar/types/toolbar.types';

export const ${entity.toolbarConst}: ToolbarConfig = {
  id: '${entity.filePrefix}-toolbar',
  layout: { direction: 'horizontal', align: 'between' },
  items: [
    { type: 'spacer' },
    {
      type: 'button',
      id: 'refresh',
      label: 'Refresh',
      icon: 'pi pi-refresh',
      variant: 'outlined',
      shortcutId: 'global.refresh',
    },
    {
      type: 'button',
      id: 'create',
      label: 'New ${entity.entityLabel}',
      icon: 'pi pi-plus',
      severity: 'primary',
      shortcutId: 'global.new',
      permission: '${entity.permission}:CREATE',
    },
  ],
};
`;
}

function genListComponent(entity, moduleRoute) {
  return `import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { KeyboardShortcutService } from '../../../core/keyboard';
import { AppGridComponent } from '../../../components/generic/grid';
import { AppToolbarComponent } from '../../../components/generic/toolbar';
import {
  GridActionEvent,
  GridFilterChange,
  GridPageChange,
  GridRowClickEvent,
} from '../../../components/generic/grid/types/grid-events.types';
import { ToolbarActionEvent } from '../../../components/generic/toolbar/types/toolbar-events.types';
import { toListParams } from '../../../shared/utils/list-query.util';
import { ${entity.gridConst} } from './${entity.filePrefix}-grid.config';
import { ${entity.toolbarConst} } from './${entity.filePrefix}-toolbar.config';
import { ${entity.entityName} } from './${entity.filePrefix}.models';
import { ${entity.serviceName} } from './${entity.filePrefix}.service';

@Component({
  selector: 'app-${entity.selectorPrefix}-list',
  standalone: true,
  imports: [AppToolbarComponent, AppGridComponent],
  templateUrl: './${entity.filePrefix}-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ${entity.listClass} implements OnInit, OnDestroy {
  private readonly service = inject(${entity.serviceName});
  private readonly router = inject(Router);
  private readonly shortcuts = inject(KeyboardShortcutService);

  readonly toolbarConfig = ${entity.toolbarConst};
  readonly gridConfig = ${entity.gridConst};
  readonly rows = signal<${entity.entityName}[]>([]);
  readonly loading = signal(false);
  readonly totalRecords = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly search = signal('');

  ngOnInit(): void {
    this.shortcuts.registerHandler('global.refresh', () => this.load());
    this.shortcuts.registerHandler('global.new', () => this.onNew());
    this.load();
  }

  ngOnDestroy(): void {
    this.shortcuts.unregisterHandler('global.refresh');
    this.shortcuts.unregisterHandler('global.new');
  }

  onToolbarAction(event: ToolbarActionEvent): void {
    if (event.action === 'refresh') {
      this.load();
    }
    if (event.action === 'create') {
      this.onNew();
    }
  }

  onPageChange(event: GridPageChange): void {
    this.page.set(event.page);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  onFilterChange(event: GridFilterChange): void {
    this.search.set(event.globalSearch ?? '');
    this.page.set(1);
    this.load();
  }

  onGridAction(event: GridActionEvent<${entity.entityName}>): void {
    if (!event.row) {
      return;
    }
    if (event.action === 'edit') {
      this.router.navigate(['${moduleRoute}', event.row.id]);
    }
    if (event.action === 'delete') {
      this.service.delete(event.row.id, event.row.version).subscribe({
        next: () => this.load(),
      });
    }
  }

  onRowDoubleClick(event: GridRowClickEvent<${entity.entityName}>): void {
    this.router.navigate(['${moduleRoute}', event.row.id]);
  }

  private onNew(): void {
    this.router.navigate(['${moduleRoute}/new']);
  }

  private load(): void {
    this.loading.set(true);
    this.service.list(toListParams(this.page(), this.pageSize(), this.search())).subscribe({
      next: (result) => {
        this.rows.set(result.data);
        this.totalRecords.set(result.pagination.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
`;
}

function genListHtml() {
  return `<div class="page-layout">
  <app-toolbar [config]="toolbarConfig" (action)="onToolbarAction($event)" />
  <app-grid
    [config]="gridConfig"
    [data]="rows()"
    [loading]="loading()"
    [totalRecords]="totalRecords()"
    (pageChange)="onPageChange($event)"
    (filterChange)="onFilterChange($event)"
    (action)="onGridAction($event)"
    (rowDoubleClick)="onRowDoubleClick($event)"
  />
</div>
`;
}

function formFieldHtml(field, readonlyExpr = '!isDraft()') {
  if (field.kind === 'boolean') {
    const id = `${field.name}Field`;
    return `        <div class="detail-form__field">
          <p-checkbox formControlName="${field.name}" [binary]="true" inputId="${id}" [disabled]="${readonlyExpr}" />
          <label for="${id}">${field.label}</label>
        </div>`;
  }
  const inputType = field.kind === 'number' ? 'number' : 'text';
  const readonly = field.readonlyOnEdit ? `[readonly]="${readonlyExpr}"` : '';
  return `        <div class="detail-form__field">
          <label for="${field.name}">${field.label}</label>
          <input pInputText id="${field.name}" type="${inputType}" formControlName="${field.name}" ${readonly} />
        </div>`;
}

function genDetailComponent(entity, moduleRoute, dateUtilImport, extraTabs = []) {
  const formInit = entity.formFields
    .map((f) => {
      if (f.kind === 'boolean') return `    ${f.name}: [${f.default ?? false}],`;
      if (f.kind === 'number') return `    ${f.name}: [${f.default ?? 'null as number | null'}${f.required ? ', Validators.required' : ''}],`;
      return `    ${f.name}: [''${f.required ? ', Validators.required' : ''}],`;
    })
    .join('\n');

  const patchOnLoad = entity.formFields
    .map((f) => {
      if (f.kind === 'number') return `          ${f.name}: entity.${f.name},`;
      if (f.kind === 'boolean') return `          ${f.name}: entity.${f.name},`;
      if (f.date) return `          ${f.name}: fromEpochMs(entity.${f.name}),`;
      return `          ${f.name}: entity.${f.name} ?? '',`;
    })
    .join('\n');

  const createBody = entity.createFields
    .map((f) => {
      if (f.date) return `          ${f.name}: ${f.optional ? `optionalEpochMs(value.${f.name})` : `toEpochMs(value.${f.name})`},`;
      if (f.optional && f.kind === 'string')
        return `          ${f.name}: value.${f.name} || undefined,`;
      if (f.optional && f.kind === 'number')
        return `          ${f.name}: value.${f.name} ?? undefined,`;
      return `          ${f.name}: value.${f.name}${f.kind === 'number' ? '!' : ''},`;
    })
    .join('\n');

  const updateBody = entity.updateFields
    .map((f) => {
      if (f.date && f.nullable)
        return `        ${f.name}: nullableEpochMs(value.${f.name}),`;
      if (f.date) return `        ${f.name}: toEpochMs(value.${f.name}),`;
      if (f.optional && f.kind === 'string')
        return `        ${f.name}: value.${f.name} || undefined,`;
      if (f.nullable) return `        ${f.name}: value.${f.name} || null,`;
      return `        ${f.name}: value.${f.name},`;
    })
    .join('\n');

  const workflowMethods = (entity.workflowActions || [])
    .map((action) => {
      const method = action.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      const label = action
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      return `
  ${method}(): void {
    const id = this.entityId();
    if (!id) {
      return;
    }
    this.workflowInProgress.set(true);
    this.errorMessage.set('');
    this.service.${method}(id, { version: this.version() }).subscribe({
      next: (entity) => {
        this.workflowInProgress.set(false);
        this.version.set(entity.version);
        this.status.set(entity.status);
      },
      error: (error) => {
        this.workflowInProgress.set(false);
        this.handleError(error);
      },
    });
  }`;
    })
    .join('');

  const workflowButtons = (entity.workflowActions || [])
    .map((action) => {
      const method = action.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      const label = action
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      return `            <button pButton type="button" severity="secondary" [disabled]="workflowInProgress()" (click)="${method}()">
              ${label}
            </button>`;
    })
    .join('\n');

  const tabImports = extraTabs.map((t) => t.import).join('\n');
  const tabComponents = extraTabs.map((t) => t.component).join(',\n    ');
  const extraTabList = extraTabs
    .map((t) => `      <p-tab value="${t.value}">${t.label}</p-tab>`)
    .join('\n');
  const extraTabPanels = extraTabs
    .map(
      (t) => `      <p-tabpanel value="${t.value}">
        <${t.selector} [${t.inputName}]="entityId()!" [editable]="isDraft()" />
      </p-tabpanel>`,
    )
    .join('\n');

  const dateFields = entity.formFields.filter((f) => f.date && f.defaultToday);
  const datePatchInit = dateFields.length
    ? `    this.form.patchValue({\n${dateFields.map((f) => `      ${f.name}: new Date().toISOString(),`).join('\n')}\n    });`
    : '';

  const statusField = entity.responseFields.find((f) => f.name === 'status');
  const numberField = entity.responseFields.find((f) => f.name.includes('Number'));

  return `import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
import { fromEpochMs, nullableEpochMs, optionalEpochMs, toEpochMs } from '../${dateUtilImport}';
import { ${entity.itemTabClass} } from './${entity.filePrefix}-items-tab.component';
${extraTabs.map((t) => t.tsImport).join('\n')}
import { ${entity.serviceName} } from './${entity.filePrefix}.service';

@Component({
  selector: 'app-${entity.selectorPrefix}-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    CheckboxModule,
    TabsModule,
    ${entity.itemTabClass}${tabComponents ? ',\n    ' + tabComponents : ''},
  ],
  templateUrl: './${entity.filePrefix}-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ${entity.detailClass} implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(${entity.serviceName});
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly entityId = signal<string | null>(null);
  readonly status = signal('DRAFT');
  readonly activeTab = signal('overview');
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly workflowInProgress = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal(0);
  readonly isDraft = computed(() => this.status() === 'DRAFT');

  readonly form = this.fb.nonNullable.group({
${formInit}
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('${entity.routeParam}');
    if (id) {
      this.isNew.set(false);
      this.entityId.set(id);
      this.activeTab.set(
        this.route.snapshot.url.some((segment) => segment.path === 'items'${extraTabs.map((t) => ` || segment.path === '${t.pathSegment}'`).join('')})
          ? (this.route.snapshot.url.find((segment) => segment.path === 'items'${extraTabs.map((t) => ` || segment.path === '${t.pathSegment}'`).join('')})?.path ?? 'overview')
          : 'overview',
      );
      this.load(id);
      return;
    }
${datePatchInit}
  }

  onTabChange(tab: string | number): void {
    const tabValue = String(tab);
    this.activeTab.set(tabValue);
    const id = this.entityId();
    if (!id) {
      return;
    }
    if (tabValue === 'items') {
      this.router.navigate(['${moduleRoute}', id, 'items']);
      return;
    }${extraTabs
      .map(
        (t) => `
    if (tabValue === '${t.value}') {
      this.router.navigate(['${moduleRoute}', id, '${t.pathSegment}']);
      return;
    }`,
      )
      .join('')}
    this.router.navigate(['${moduleRoute}', id]);
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    const value = this.form.getRawValue();

    if (this.isNew()) {
      this.service
        .create({
${createBody}
        })
        .subscribe({
          next: (entity) => {
            this.saving.set(false);
            this.isNew.set(false);
            this.entityId.set(entity.id);
            this.status.set(entity.status);
            this.version.set(entity.version);
            this.router.navigate(['${moduleRoute}', entity.id], { replaceUrl: true });
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.service
      .update(this.entityId()!, {
        version: this.version(),
${updateBody}
      })
      .subscribe({
        next: (entity) => {
          this.version.set(entity.version);
          this.status.set(entity.status);
          this.saving.set(false);
        },
        error: (error) => this.handleError(error),
      });
  }
${workflowMethods}

  deleteRecord(): void {
    const id = this.entityId();
    if (!id) {
      return;
    }

    this.deleting.set(true);
    this.errorMessage.set('');
    this.service.delete(id, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['${moduleRoute}']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['${moduleRoute}']);
  }

  private load(id: string): void {
    this.service.getById(id).subscribe({
      next: (entity) => {
        this.version.set(entity.version);
        this.status.set(entity.status);
        this.form.patchValue({
${patchOnLoad}
        });
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
`;
}

function genDetailHtml(entity, extraTabs = []) {
  const fields = entity.formFields.map((f) => formFieldHtml(f)).join('\n');
  const workflowButtons = (entity.workflowActions || [])
    .map((action) => {
      const method = action.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      const label = action
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      return `            <button pButton type="button" severity="secondary" [disabled]="workflowInProgress()" (click)="${method}()">
              ${label}
            </button>`;
    })
    .join('\n');

  const extraTabList = extraTabs
    .map((t) => `      <p-tab value="${t.value}">${t.label}</p-tab>`)
    .join('\n');
  const extraTabPanels = extraTabs
    .map(
      (t) => `      <p-tabpanel value="${t.value}">
        <${t.selector} [${t.inputName}]="entityId()!" [editable]="isDraft()" />
      </p-tabpanel>`,
    )
    .join('\n');

  return `<p-tabs [value]="activeTab()" (valueChange)="onTabChange($event)">
  <p-tablist>
    <p-tab value="overview">Overview</p-tab>
    @if (entityId()) {
      <p-tab value="items">Items</p-tab>
${extraTabList}
    }
  </p-tablist>
  <p-tabpanels>
    <p-tabpanel value="overview">
      @if (!isNew()) {
        <p class="detail-form__status">Status: {{ status() }}</p>
      }
      <form class="detail-form" [formGroup]="form" (ngSubmit)="save()">
${fields}
        <div class="detail-form__actions">
          @if (isDraft()) {
            <button pButton type="submit" severity="primary" [disabled]="saving() || form.invalid">
              Save
            </button>
          }
          @if (!isNew() && isDraft()) {
            <button pButton type="button" severity="danger" [disabled]="deleting()" (click)="deleteRecord()">
              Delete
            </button>
          }
${workflowButtons}
          <button pButton type="button" severity="secondary" variant="outlined" (click)="goBack()">
            Back
          </button>
        </div>
        @if (errorMessage()) {
          <p class="detail-form__error">{{ errorMessage() }}</p>
        }
      </form>
    </p-tabpanel>
    @if (entityId()) {
      <p-tabpanel value="items">
        <app-${entity.selectorPrefix}-items-tab
          [${entity.routeParam}]="entityId()!"
          [editable]="isDraft()"
        />
      </p-tabpanel>
${extraTabPanels}
    }
  </p-tabpanels>
</p-tabs>
`;
}

function genItemsTab(entity, item, dateUtilImport) {
  const formInit = item.formFields
    .map((f) => {
      if (f.kind === 'boolean') return `    ${f.name}: [${f.default ?? false}],`;
      if (f.kind === 'number') return `    ${f.name}: [${f.default ?? 0}${f.required ? ', Validators.required' : ''}],`;
      return `    ${f.name}: [''${f.required ? ', Validators.required' : ''}],`;
    })
    .join('\n');

  const patchEdit = item.formFields
    .map((f) => {
      if (f.kind === 'number') return `      ${f.name}: item.${f.name} ?? ${f.default ?? 0},`;
      if (f.kind === 'boolean') return `      ${f.name}: item.${f.name},`;
      if (f.date) return `      ${f.name}: fromEpochMs(item.${f.name}),`;
      return `      ${f.name}: item.${f.name} ?? '',`;
    })
    .join('\n');

  const createBody = item.createFields
    .map((f) => {
      if (f.date) return `        ${f.name}: ${f.optional ? `optionalEpochMs(value.${f.name})` : `toEpochMs(value.${f.name})`},`;
      if (f.optional && f.kind === 'string')
        return `        ${f.name}: value.${f.name} || undefined,`;
      if (f.optional && f.kind === 'number')
        return `        ${f.name}: value.${f.name} || undefined,`;
      return `        ${f.name}: value.${f.name},`;
    })
    .join('\n');

  const updateBody = item.updateFields
    .map((f) => {
      if (f.optional && f.kind === 'string')
        return `          ${f.name}: value.${f.name} || undefined,`;
      if (f.optional && f.kind === 'number')
        return `          ${f.name}: value.${f.name} || undefined,`;
      return `          ${f.name}: value.${f.name},`;
    })
    .join('\n');

  const dialogFields = item.formFields
    .map((f) => {
      if (f.kind === 'boolean') {
        return `    <div class="detail-form__field">
      <p-checkbox formControlName="${f.name}" [binary]="true" inputId="item${f.name}" />
      <label for="item${f.name}">${f.label}</label>
    </div>`;
      }
      const type = f.kind === 'number' ? 'number' : 'text';
      return `    <div class="detail-form__field">
      <label for="item${f.name}">${f.label}</label>
      <input pInputText id="item${f.name}" type="${type}" formControlName="${f.name}" />
    </div>`;
    })
    .join('\n');

  return {
    ts: `import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { AppGridComponent } from '../../../components/generic/grid';
import {
  GridActionEvent,
  GridFilterChange,
  GridPageChange,
} from '../../../components/generic/grid/types/grid-events.types';
import { toListParams } from '../../../shared/utils/list-query.util';
import { ${item.gridConst} } from './${item.filePrefix}-grid.config';
import { ${item.entityName} } from './${item.filePrefix}.models';
import { ${item.serviceName} } from './${item.filePrefix}.service';

@Component({
  selector: 'app-${entity.selectorPrefix}-items-tab',
  standalone: true,
  imports: [
    AppGridComponent,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    CheckboxModule,
  ],
  templateUrl: './${entity.filePrefix}-items-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ${entity.itemTabClass} {
  private readonly fb = inject(FormBuilder);
  private readonly itemService = inject(${item.serviceName});

  readonly ${entity.routeParam} = input.required<string>();
  readonly editable = input(true);

  readonly gridConfig = ${item.gridConst};
  readonly rows = signal<${item.entityName}[]>([]);
  readonly loading = signal(false);
  readonly totalRecords = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly search = signal('');
  readonly dialogVisible = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly editingVersion = signal(0);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
${formInit}
  });

  constructor() {
    effect(() => {
      const id = this.${entity.routeParam}();
      if (id) {
        this.load();
      }
    });
  }

  onPageChange(event: GridPageChange): void {
    this.page.set(event.page);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  onFilterChange(event: GridFilterChange): void {
    this.search.set(event.globalSearch ?? '');
    this.page.set(1);
    this.load();
  }

  onGridAction(event: GridActionEvent<${item.entityName}>): void {
    if (!event.row || !this.editable()) {
      return;
    }
    if (event.action === 'edit') {
      this.openEdit(event.row);
    }
    if (event.action === 'delete') {
      this.itemService
        .delete(this.${entity.routeParam}(), event.row.id, event.row.version)
        .subscribe({ next: () => this.load() });
    }
  }

  openCreate(): void {
    this.editingId.set(null);
    this.editingVersion.set(0);
    this.form.reset({
${item.formFields.map((f) => `      ${f.name}: ${f.kind === 'boolean' ? (f.default ?? false) : f.kind === 'number' ? (f.default ?? 0) : "''"},`).join('\n')}
    });
    this.dialogVisible.set(true);
  }

  openEdit(item: ${item.entityName}): void {
    this.editingId.set(item.id);
    this.editingVersion.set(item.version);
    this.form.patchValue({
${patchEdit}
    });
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    const value = this.form.getRawValue();
    const parentId = this.${entity.routeParam}();

    if (this.editingId()) {
      this.itemService
        .update(parentId, this.editingId()!, {
          version: this.editingVersion(),
${updateBody}
        })
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.closeDialog();
            this.load();
          },
          error: () => this.saving.set(false),
        });
      return;
    }

    this.itemService
      .create(parentId, {
${createBody}
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.closeDialog();
          this.load();
        },
        error: () => this.saving.set(false),
      });
  }

  private load(): void {
    this.loading.set(true);
    this.itemService
      .list(this.${entity.routeParam}(), toListParams(this.page(), this.pageSize(), this.search()))
      .subscribe({
        next: (result) => {
          this.rows.set(result.data);
          this.totalRecords.set(result.pagination.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
`,
    html: `<div class="nested-tab">
  @if (editable()) {
    <div class="nested-tab__actions">
      <button pButton type="button" severity="primary" (click)="openCreate()">New Item</button>
    </div>
  }
  <app-grid
    [config]="gridConfig"
    [data]="rows()"
    [loading]="loading()"
    [totalRecords]="totalRecords()"
    (pageChange)="onPageChange($event)"
    (filterChange)="onFilterChange($event)"
    (action)="onGridAction($event)"
  />
</div>

<p-dialog
  [visible]="dialogVisible()"
  [modal]="true"
  [header]="editingId() ? 'Edit Item' : 'New Item'"
  [style]="{ width: '32rem' }"
  (onHide)="closeDialog()"
>
  <form class="detail-form" [formGroup]="form" (ngSubmit)="save()">
${dialogFields}
    <div class="detail-form__actions">
      <button pButton type="submit" severity="primary" [disabled]="saving() || form.invalid">
        Save
      </button>
      <button pButton type="button" severity="secondary" variant="outlined" (click)="closeDialog()">
        Cancel
      </button>
    </div>
  </form>
</p-dialog>
`,
  };
}

function genEntity(entity, moduleRoute, dateUtilImport, extraTabs = []) {
  const folder = `${entity.moduleFolder}/${entity.folder}`;
  write(`${folder}/${entity.filePrefix}.models.ts`, genModels(entity));
  write(`${folder}/${entity.filePrefix}.service.ts`, genService(entity));
  write(`${folder}/${entity.filePrefix}-grid.config.ts`, genGrid(entity));
  write(`${folder}/${entity.filePrefix}-toolbar.config.ts`, genToolbar(entity));
  write(`${folder}/${entity.filePrefix}-list.component.ts`, genListComponent(entity, moduleRoute));
  write(`${folder}/${entity.filePrefix}-list.component.html`, genListHtml());
  write(`${folder}/${entity.filePrefix}-detail.component.ts`, genDetailComponent(entity, moduleRoute, dateUtilImport, extraTabs));
  write(`${folder}/${entity.filePrefix}-detail.component.html`, genDetailHtml(entity, extraTabs));

  const item = entity.item;
  write(`${folder}/${item.filePrefix}.models.ts`, genItemModels(item));
  write(`${folder}/${item.filePrefix}.service.ts`, genItemService(entity, item));
  write(`${folder}/${item.filePrefix}-grid.config.ts`, genItemGrid(item, entity));
  const tab = genItemsTab(entity, item, dateUtilImport);
  write(`${folder}/${entity.filePrefix}-items-tab.component.ts`, tab.ts);
  write(`${folder}/${entity.filePrefix}-items-tab.component.html`, tab.html);
}

function genRoutes(moduleFolder, routePrefix, entities, extraRoutes = '') {
  const blocks = entities
    .map((e) => {
      const tabRoutes = (e.extraTabRoutes || [])
        .map(
          (t) => `      {
        path: ':${e.routeParam}/${t.path}',
        loadComponent: () =>
          import('./${e.folder}/${e.filePrefix}-detail.component').then(
            (m) => m.${e.detailClass},
          ),
      },`,
        )
        .join('\n');
      return `  {
    path: '${e.routeSegment}',
    canActivate: [permissionGuard('${e.permission}:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./${e.folder}/${e.filePrefix}-list.component').then(
            (m) => m.${e.listClass},
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('${e.permission}:CREATE')],
        loadComponent: () =>
          import('./${e.folder}/${e.filePrefix}-detail.component').then(
            (m) => m.${e.detailClass},
          ),
      },
      {
        path: ':${e.routeParam}/items',
        loadComponent: () =>
          import('./${e.folder}/${e.filePrefix}-detail.component').then(
            (m) => m.${e.detailClass},
          ),
      },
${tabRoutes}
      {
        path: ':${e.routeParam}',
        loadComponent: () =>
          import('./${e.folder}/${e.filePrefix}-detail.component').then(
            (m) => m.${e.detailClass},
          ),
      },
    ],
  },`;
    })
    .join('\n');

  write(
    `${moduleFolder}/${moduleFolder.split('/').pop()}.routes.ts`,
    `import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const ${moduleFolder.split('/').pop()}Routes: Routes = [
${blocks}
${extraRoutes}
];
`,
  );
}

// --- Entity definitions ---
const purchaseEntities = [
  {
    moduleFolder: 'purchase',
    folder: 'purchase-orders',
    filePrefix: 'purchase-order',
    selectorPrefix: 'purchase-order',
    apiPath: '/purchase-orders',
    routeSegment: 'orders',
    routeParam: 'purchaseOrderId',
    permission: 'PURCHASE:PURCHASE_ORDER',
    entityName: 'PurchaseOrder',
    entityLabel: 'Purchase Order',
    serviceName: 'PurchaseOrderService',
    listClass: 'PurchaseOrderListComponent',
    detailClass: 'PurchaseOrderDetailComponent',
    itemTabClass: 'PurchaseOrderItemsTabComponent',
    gridConst: 'PURCHASE_ORDER_GRID_CONFIG',
    toolbarConst: 'PURCHASE_ORDER_TOOLBAR_CONFIG',
    workflowActions: ['submit', 'approve', 'reject', 'send', 'force-close', 'cancel'],
    responseFields: [
      { name: 'uuid', type: 'string' },
      { name: 'purchaseOrderNumber', type: 'string' },
      { name: 'supplierId', type: 'string' },
      { name: 'branchId', type: 'string' },
      { name: 'orderDate', type: 'string' },
      { name: 'expectedDeliveryDate', type: 'string | null' },
      { name: 'grossAmount', type: 'number | null' },
      { name: 'discountAmount', type: 'number | null' },
      { name: 'taxAmount', type: 'number | null' },
      { name: 'netAmount', type: 'number | null' },
      { name: 'status', type: 'string' },
      { name: 'remarks', type: 'string | null' },
    ],
    listColumns: [
      { field: 'purchaseOrderNumber', header: 'PO Number', filterable: true },
      { field: 'supplierId', header: 'Supplier ID', filterable: true },
      { field: 'orderDate', header: 'Order Date' },
      { field: 'status', header: 'Status', filterable: true },
      { field: 'netAmount', header: 'Net Amount', type: 'currency' },
    ],
    createFields: [
      { name: 'branchId', tsType: 'string' },
      { name: 'supplierId', tsType: 'string' },
      { name: 'orderDate', tsType: 'string' },
      { name: 'expectedDeliveryDate', tsType: 'string', optional: true },
      { name: 'remarks', tsType: 'string', optional: true },
    ],
    updateFields: [
      { name: 'expectedDeliveryDate', tsType: 'string | null', optional: true, nullable: true, date: true },
      { name: 'remarks', tsType: 'string', optional: true },
    ],
    formFields: [
      { name: 'branchId', label: 'Branch ID', required: true, readonlyOnEdit: true },
      { name: 'supplierId', label: 'Supplier ID', required: true },
      { name: 'orderDate', label: 'Order Date', required: true, date: true, defaultToday: true },
      { name: 'expectedDeliveryDate', label: 'Expected Delivery Date', date: true },
      { name: 'remarks', label: 'Remarks' },
    ],
    item: {
      filePrefix: 'purchase-order-item',
      entityName: 'PurchaseOrderItem',
      serviceName: 'PurchaseOrderItemService',
      gridConst: 'PURCHASE_ORDER_ITEM_GRID_CONFIG',
      responseFields: [
        { name: 'uuid', type: 'string' },
        { name: 'purchaseOrderId', type: 'string' },
        { name: 'medicineId', type: 'string' },
        { name: 'unitId', type: 'string' },
        { name: 'lineNumber', type: 'number' },
        { name: 'orderedQuantity', type: 'number | null' },
        { name: 'unitPrice', type: 'number | null' },
        { name: 'lineAmount', type: 'number | null' },
        { name: 'isClosed', type: 'boolean' },
      ],
      listColumns: [
        { field: 'medicineId', header: 'Medicine ID' },
        { field: 'orderedQuantity', header: 'Qty', type: 'number' },
        { field: 'unitPrice', header: 'Unit Price', type: 'currency' },
        { field: 'lineAmount', header: 'Line Amount', type: 'currency' },
        { field: 'isClosed', header: 'Closed', type: 'boolean' },
      ],
      createFields: [
        { name: 'medicineId', tsType: 'string' },
        { name: 'unitId', tsType: 'string' },
        { name: 'orderedQuantity', tsType: 'number' },
        { name: 'unitPrice', tsType: 'number' },
        { name: 'conversionFactor', tsType: 'number', optional: true },
        { name: 'discountPercent', tsType: 'number', optional: true },
        { name: 'discountAmount', tsType: 'number', optional: true },
        { name: 'taxPercent', tsType: 'number', optional: true },
        { name: 'taxAmount', tsType: 'number', optional: true },
        { name: 'isClosed', tsType: 'boolean', optional: true },
      ],
      updateFields: [
        { name: 'medicineId', tsType: 'string', optional: true },
        { name: 'unitId', tsType: 'string', optional: true },
        { name: 'orderedQuantity', tsType: 'number', optional: true },
        { name: 'unitPrice', tsType: 'number', optional: true },
        { name: 'conversionFactor', tsType: 'number', optional: true },
        { name: 'discountPercent', tsType: 'number', optional: true },
        { name: 'discountAmount', tsType: 'number', optional: true },
        { name: 'taxPercent', tsType: 'number', optional: true },
        { name: 'taxAmount', tsType: 'number', optional: true },
        { name: 'isClosed', tsType: 'boolean', optional: true },
      ],
      formFields: [
        { name: 'medicineId', label: 'Medicine ID', required: true },
        { name: 'unitId', label: 'Unit ID', required: true },
        { name: 'orderedQuantity', label: 'Ordered Qty', kind: 'number', required: true },
        { name: 'unitPrice', label: 'Unit Price', kind: 'number', required: true },
        { name: 'discountPercent', label: 'Discount %', kind: 'number' },
        { name: 'taxPercent', label: 'Tax %', kind: 'number' },
        { name: 'isClosed', label: 'Closed', kind: 'boolean' },
      ],
    },
  },
];

write('purchase/purchase-date.util.ts', dateUtil('purchase'));

for (const entity of purchaseEntities) {
  genEntity(entity, '/purchase/orders', 'purchase-date.util');
}

genRoutes('purchase', '/purchase', purchaseEntities);

console.log('Generated purchase module (partial - extend script for remaining entities)');
