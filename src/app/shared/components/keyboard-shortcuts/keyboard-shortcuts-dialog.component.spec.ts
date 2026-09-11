import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { KeyboardShortcutService } from '../../../core/keyboard';
import { KeyboardShortcutsDialogComponent } from './keyboard-shortcuts-dialog.component';

describe('KeyboardShortcutsDialogComponent', () => {
  let fixture: ComponentFixture<KeyboardShortcutsDialogComponent>;
  let component: KeyboardShortcutsDialogComponent;
  let shortcutService: KeyboardShortcutService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KeyboardShortcutsDialogComponent],
      providers: [provideTranslateService()],
    }).compileComponents();

    fixture = TestBed.createComponent(KeyboardShortcutsDialogComponent);
    component = fixture.componentInstance;
    shortcutService = TestBed.inject(KeyboardShortcutService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('lists shortcuts grouped by category', () => {
    const groups = shortcutService.listByCategory();
    expect(groups.length).toBeGreaterThan(0);
    expect(groups[0].shortcuts.length).toBeGreaterThan(0);
  });

  it('opens and closes via service signal', () => {
    shortcutService.openDialog();
    expect(shortcutService.dialogVisible()).toBe(true);

    component.onDialogHide();
    expect(shortcutService.dialogVisible()).toBe(false);
  });

  it('enters and exits capture mode', () => {
    const shortcut = shortcutService.list()[0];
    component.startCapture(shortcut);
    expect(component.isCapturing(shortcut.id)).toBe(true);

    component.cancelCapture();
    expect(component.capturingId()).toBeNull();
  });
});
