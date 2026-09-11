import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { AppToastHostComponent } from './app-toast-host.component';

describe('AppToastHostComponent', () => {
  let fixture: ComponentFixture<AppToastHostComponent>;
  let component: AppToastHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppToastHostComponent],
      providers: [MessageService],
    }).compileComponents();

    fixture = TestBed.createComponent(AppToastHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('merges default host configuration', () => {
    expect(component.mergedConfig()).toEqual(
      expect.objectContaining({
        position: 'top-right',
        mode: 'stack',
        stackVisibleLimit: 3,
        key: 'app',
      }),
    );
  });

  it('applies supplied host configuration', () => {
    fixture.componentRef.setInput('config', {
      position: 'bottom-center',
      key: 'custom',
      mode: 'expanded',
    });
    fixture.detectChanges();

    expect(component.mergedConfig()).toEqual(
      expect.objectContaining({
        position: 'bottom-center',
        key: 'custom',
        mode: 'expanded',
      }),
    );
  });

  it('renders p-toast host', () => {
    const toast = fixture.nativeElement.querySelector('p-toast');
    expect(toast).toBeTruthy();
  });
});
