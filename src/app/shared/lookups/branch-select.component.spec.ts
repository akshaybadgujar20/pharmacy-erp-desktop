import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BranchService } from '../../features/configuration/branches/branch.service';
import { BranchSelectComponent } from './branch-select.component';

describe('BranchSelectComponent', () => {
  let fixture: ComponentFixture<BranchSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BranchSelectComponent],
      providers: [
        {
          provide: BranchService,
          useValue: {
            list: jest.fn(() =>
              of({
                data: [
                  {
                    id: '1',
                    branchCode: 'HO',
                    branchName: 'Head Office',
                  },
                ],
                pagination: { total: 1, page: 1, pageSize: 100 },
              }),
            ),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BranchSelectComponent);
    fixture.detectChanges();
  });

  it('loads branches into the select', () => {
    const service = TestBed.inject(BranchService);
    expect(service.list).toHaveBeenCalled();
    expect(fixture.componentInstance.options()).toEqual([
      { label: 'HO — Head Office', value: '1' },
    ]);
  });
});
