import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { SettingDetailComponent } from './setting-detail.component';
import { SettingService } from './setting.service';

describe('SettingDetailComponent', () => {
  let fixture: ComponentFixture<SettingDetailComponent>;
  let component: SettingDetailComponent;
  let settingService: jest.Mocked<Pick<SettingService, 'getByKey' | 'update'>>;

  const setting = {
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
  };

  beforeEach(async () => {
    settingService = {
      getByKey: jest.fn().mockReturnValue(of(setting)),
      update: jest.fn().mockReturnValue(of({ ...setting, version: 2, settingValue: '20' })),
    };

    await TestBed.configureTestingModule({
      imports: [SettingDetailComponent],
      providers: [
        { provide: SettingService, useValue: settingService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => 'gst.default_rate' } },
          },
        },
        { provide: Router, useValue: { navigate: jest.fn().mockResolvedValue(true) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads setting by key on init', () => {
    expect(settingService.getByKey).toHaveBeenCalledWith('gst.default_rate');
    expect(component.setting()?.settingKey).toBe('gst.default_rate');
    expect(component.form.controls.settingValue.value).toBe('18');
  });

  it('updates setting with version and value', () => {
    component.form.controls.settingValue.setValue('20');
    component.save();

    expect(settingService.update).toHaveBeenCalledWith('gst.default_rate', {
      version: 1,
      settingValue: '20',
    });
    expect(component.version()).toBe(2);
  });
});
