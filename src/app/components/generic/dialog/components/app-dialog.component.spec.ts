import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppDialogComponent } from './app-dialog.component';
import { DialogConfig } from '../types/dialog.types';

describe('AppDialogComponent', () => {
  let fixture: ComponentFixture<AppDialogComponent>;
  let component: AppDialogComponent;

  const config: DialogConfig = {
    header: 'Edit Profile',
    footer: {
      buttons: [
        { id: 'cancel', label: 'Cancel', severity: 'secondary', variant: 'outlined' },
        { id: 'save', label: 'Save' },
      ],
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AppDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('config', config);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('merges config bindings', () => {
    expect(component.bindings().header).toBe('Edit Profile');
    expect(component.bindings().modal).toBe(true);
  });

  it('emits footerAction with button id', () => {
    const spy = jest.fn();
    component.footerAction.subscribe(spy);
    component.onFooterClick('save');
    expect(spy).toHaveBeenCalledWith({ buttonId: 'save' });
  });
});
