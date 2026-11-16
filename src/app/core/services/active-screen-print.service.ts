import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ActiveScreenPrintService {
  private handler: (() => void) | null = null;

  register(handler: () => void): void {
    this.handler = handler;
  }

  unregister(): void {
    this.handler = null;
  }

  print(): void {
    this.handler?.();
  }
}