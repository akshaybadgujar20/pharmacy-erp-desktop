import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ActiveScreenSaveService {
  private handler: (() => void) | null = null;

  register(handler: () => void): void {
    this.handler = handler;
  }

  unregister(): void {
    this.handler = null;
  }

  save(): void {
    this.handler?.();
  }
}
