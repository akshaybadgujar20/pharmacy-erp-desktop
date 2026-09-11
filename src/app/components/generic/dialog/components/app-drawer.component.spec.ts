import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppDrawerComponent } from './app-drawer.component';
import { DrawerConfig } from '../types/drawer.types';

describe('AppDrawerComponent', () => {
  let fixture: ComponentFixture<AppDrawerComponent>;
  let component: AppDrawerComponent;

  const config: DrawerConfig = {
    header: 'Filters',
    position: 'right',
    styleClass: 'w-80',
    footer: {
      buttons: [{ id: 'apply', label: 'Apply' }],
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppDrawerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AppDrawerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('config', config);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('maps drawer bindings from config', () => {
    expect(component.bindings().position).toBe('right');
    expect(component.bindings().styleClass).toBe('w-80');
  });

  it('emits footerAction', () => {
    const spy = jest.fn();
    component.footerAction.subscribe(spy);
    component.onFooterClick('apply');
    expect(spy).toHaveBeenCalledWith({ buttonId: 'apply' });
  });
});
