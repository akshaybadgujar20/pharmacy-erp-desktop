import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { KeyboardShortcutService } from '../../core/keyboard';
import { ShortcutTooltipDirective } from './shortcut-tooltip.directive';

@Component({
  standalone: true,
  imports: [ShortcutTooltipDirective],
  template: `<button appShortcutTooltip="Save" shortcutId="global.save">Save</button>`,
})
class HostComponent {}

describe('ShortcutTooltipDirective', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        provideNoopAnimations(),
        {
          provide: KeyboardShortcutService,
          useValue: {
            bindingsChanged: jest.fn(),
            getLabel: jest.fn(() => 'Ctrl+S'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renders host button with shortcut tooltip directive', () => {
    const button = fixture.nativeElement.querySelector('button');
    expect(button?.textContent?.trim()).toBe('Save');
  });
});