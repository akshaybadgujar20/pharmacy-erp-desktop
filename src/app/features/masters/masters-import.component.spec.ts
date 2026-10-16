import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { MastersImportComponent } from './masters-import.component';

describe('MastersImportComponent', () => {
  let fixture: ComponentFixture<MastersImportComponent>;
  let api: jest.Mocked<Pick<ApiService, 'post'>>;

  beforeEach(async () => {
    api = {
      post: jest.fn().mockReturnValue(of({ dryRun: true, rowCount: 1 })),
    };

    await TestBed.configureTestingModule({
      imports: [MastersImportComponent],
      providers: [{ provide: ApiService, useValue: api }],
    }).compileComponents();

    fixture = TestBed.createComponent(MastersImportComponent);
    fixture.detectChanges();
  });

  it('submits dry-run import', () => {
    fixture.componentInstance.form.patchValue({
      entityType: 'country',
      csvText: 'IN,India',
    });
    fixture.componentInstance.run(true);
    expect(api.post).toHaveBeenCalledWith('/masters/import', {
      entityType: 'country',
      csvText: 'IN,India',
      dryRun: true,
    });
  });
});
