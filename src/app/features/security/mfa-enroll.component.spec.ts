import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { MfaEnrollComponent } from './mfa-enroll.component';

describe('MfaEnrollComponent', () => {
  let fixture: ComponentFixture<MfaEnrollComponent>;
  let api: jest.Mocked<Pick<ApiService, 'post'>>;

  beforeEach(async () => {
    api = {
      post: jest.fn().mockReturnValue(
        of({ secret: 'SECRET', otpauthUrl: 'otpauth://test' }),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [MfaEnrollComponent],
      providers: [{ provide: ApiService, useValue: api }],
    }).compileComponents();

    fixture = TestBed.createComponent(MfaEnrollComponent);
    fixture.detectChanges();
  });

  it('starts enrollment via API', () => {
    fixture.componentInstance.start();
    expect(api.post).toHaveBeenCalledWith('/auth/mfa/enroll/start', {});
  });
});
