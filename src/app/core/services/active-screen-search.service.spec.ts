import { TestBed } from '@angular/core/testing';
import { ActiveScreenSearchService } from './active-screen-search.service';

describe('ActiveScreenSearchService', () => {
  let service: ActiveScreenSearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActiveScreenSearchService);
  });

  it('invokes registered focus handler', () => {
    const focus = jest.fn();
    service.register(focus);
    service.focus();
    expect(focus).toHaveBeenCalled();
  });

  it('clears handler on unregister', () => {
    const focus = jest.fn();
    service.register(focus);
    service.unregister();
    service.focus();
    expect(focus).not.toHaveBeenCalled();
  });
});