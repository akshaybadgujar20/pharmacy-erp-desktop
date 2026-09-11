import { Component, input, output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { KeyboardShortcutService } from '../../core/keyboard';
import { ToolbarActionEvent } from '../../components/generic/toolbar/types/toolbar-events.types';
import { SettingListComponent } from './setting-list.component';
import { SettingService } from './setting.service';

@Component({ selector: 'app-toolbar', standalone: true, template: '' })
class AppToolbarStubComponent {
  config = input<unknown>();
  action = output<ToolbarActionEvent>();
}

@Component({ selector: 'app-grid', standalone: true, template: '' })
class AppGridStubComponent {
  config = input<unknown>();
  data = input<unknown[]>();
  loading = input(false);
}

describe('SettingListComponent', () => {
  let fixture: ComponentFixture<SettingListComponent>;
  let component: SettingListComponent;
  let settingService: jest.Mocked<Pick<SettingService, 'list'>>;
  let router: jest.Mocked<Pick<Router, 'navigate'>>;

  beforeEach(async () => {
    settingService = {
      list: jest.fn().mockReturnValue(
        of([
          {
            id: '1',
            uuid: 'uuid-1',
            companyId: '1',
            branchId: null,
            settingKey: 'gst.default_rate',
            settingName: 'GST Default Rate',
            settingValue: '18',
            dataType: 'DECIMAL',
            category: 'TAX',
            defaultValue: '18',
            description: null,
            isEditable: true,
            isEncrypted: false,
            isActive: true,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            version: 1,
          },
        ]),
      ),
    };
    router = { navigate: jest.fn().mockResolvedValue(true) };

    await TestBed.configureTestingModule({
      imports: [SettingListComponent],
      providers: [
        { provide: SettingService, useValue: settingService },
        { provide: Router, useValue: router },
        {
          provide: KeyboardShortcutService,
          useValue: {
            registerHandler: jest.fn(),
            unregisterHandler: jest.fn(),
          },
        },
      ],
    })
      .overrideComponent(SettingListComponent, {
        set: { imports: [AppToolbarStubComponent, AppGridStubComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(SettingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads settings on init', () => {
    expect(settingService.list).toHaveBeenCalled();
    expect(component.rows().length).toBe(1);
  });

  it('navigates to setting detail on edit action', () => {
    component.onGridAction({
      action: 'edit',
      row: component.rows()[0],
      source: 'row-action',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/settings', 'gst.default_rate']);
  });
});
