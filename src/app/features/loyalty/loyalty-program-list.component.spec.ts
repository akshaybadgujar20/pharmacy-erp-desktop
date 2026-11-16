import { Component, input, output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { ActiveScreenSearchService } from '../../core/services/active-screen-search.service';
import { KeyboardShortcutService } from '../../core/keyboard';
import { ToolbarActionEvent } from '../../components/generic/toolbar/types/toolbar-events.types';
import { LoyaltyProgramListComponent } from './loyalty-program-list.component';
import { LoyaltyProgramService } from './loyalty-program.service';

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

describe('LoyaltyProgramListComponent', () => {
  let fixture: ComponentFixture<LoyaltyProgramListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoyaltyProgramListComponent],
      providers: [
        { provide: Router, useValue: { navigate: jest.fn() } },
        {
          provide: LoyaltyProgramService,
          useValue: {
            list: jest.fn(() =>
              of({ data: [], pagination: { total: 0, page: 1, pageSize: 25 } }),
            ),
          },
        },
        {
          provide: KeyboardShortcutService,
          useValue: {
            registerHandler: jest.fn(),
            unregisterHandler: jest.fn(),
          },
        },
        {
          provide: ActiveScreenSearchService,
          useValue: { register: jest.fn(), unregister: jest.fn() },
        },
      ],
    })
      .overrideComponent(LoyaltyProgramListComponent, {
        set: {
          imports: [AppToolbarStubComponent, AppGridStubComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(LoyaltyProgramListComponent);
    fixture.componentInstance.ngOnInit();
  });

  it('loads programs on init', () => {
    const service = TestBed.inject(LoyaltyProgramService);
    expect(service.list).toHaveBeenCalled();
  });
});