import { Component, input, output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { KeyboardShortcutService } from '../../../core/keyboard';
import { ToolbarActionEvent } from '../../../components/generic/toolbar/types/toolbar-events.types';
import { CountryListComponent } from './country-list.component';
import { CountryService } from './country.service';

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
  totalRecords = input<number>();
}

describe('CountryListComponent', () => {
  let fixture: ComponentFixture<CountryListComponent>;
  let component: CountryListComponent;
  let countryService: jest.Mocked<Pick<CountryService, 'list' | 'delete'>>;
  let router: jest.Mocked<Pick<Router, 'navigate'>>;

  beforeEach(async () => {
    countryService = {
      list: jest.fn().mockReturnValue(
        of({
          data: [
            {
              id: '1',
              uuid: 'uuid-1',
              countryCode: 'IN',
              isoAlpha2: 'IN',
              isoAlpha3: 'IND',
              countryName: 'India',
              nationality: 'Indian',
              phoneCode: '+91',
              currencyCode: 'INR',
              timezone: 'Asia/Kolkata',
              isActive: true,
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
              deletedAt: null,
              version: 1,
            },
          ],
          pagination: { page: 1, pageSize: 25, total: 1, totalPages: 1 },
        }),
      ),
      delete: jest.fn().mockReturnValue(of(undefined)),
    };
    router = { navigate: jest.fn().mockResolvedValue(true) };

    await TestBed.configureTestingModule({
      imports: [CountryListComponent],
      providers: [
        { provide: CountryService, useValue: countryService },
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
      .overrideComponent(CountryListComponent, {
        set: { imports: [AppToolbarStubComponent, AppGridStubComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CountryListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads countries on init', () => {
    expect(countryService.list).toHaveBeenCalled();
    expect(component.rows().length).toBe(1);
    expect(component.totalRecords()).toBe(1);
  });

  it('navigates to new country on create action', () => {
    component.onToolbarAction({ action: 'create', source: 'button' });
    expect(router.navigate).toHaveBeenCalledWith(['/masters/countries/new']);
  });
});
