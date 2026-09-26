import {AfterViewInit, Directive, ElementRef,} from '@angular/core';

@Directive({
  selector: 'p-inputotp[appPinInput]',
  standalone: true,
})
export class PinInputDirective implements AfterViewInit {
  constructor(
    private readonly elementRef: ElementRef<HTMLElement>,
  ) {}

  ngAfterViewInit(): void {
    const inputs =
      this.elementRef.nativeElement.querySelectorAll<HTMLInputElement>('input');

    inputs.forEach((input, index) => {
      input.type = 'text';
      input.inputMode = 'numeric';
      input.autocomplete = 'off';
      input.name = `login-pin-${index}`;

      // Keep the visual masking.
      input.style.setProperty('-webkit-text-security', 'disc');
    });
  }
}
