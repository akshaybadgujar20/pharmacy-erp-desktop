import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ActiveScreenSearchService {
  private handler: (() => void) | null = null;

  register(handler: () => void): void {
    this.handler = handler;
  }

  unregister(): void {
    this.handler = null;
  }

  focus(): void {
    this.handler?.();
  }
}