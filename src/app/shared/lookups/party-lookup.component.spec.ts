import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PartyService } from '../../features/party/parties/party.service';
import { PartyLookupComponent } from './party-lookup.component';

describe('PartyLookupComponent', () => {
  let fixture: ComponentFixture<PartyLookupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartyLookupComponent],
      providers: [
        {
          provide: PartyService,
          useValue: {
            list: jest.fn(() =>
              of({
                data: [{ id: '1', displayName: 'Acme', partyType: 'ORGANIZATION' }],
                pagination: { total: 1, page: 1, pageSize: 20 },
              }),
            ),
            getById: jest.fn(() =>
              of({
                id: '1',
                displayName: 'Acme',
                partyType: 'ORGANIZATION',
                version: '1',
              }),
            ),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PartyLookupComponent);
    fixture.detectChanges();
  });

  it('searches parties', () => {
    const service = TestBed.inject(PartyService);
    fixture.componentInstance.search('Acme');
    expect(service.list).toHaveBeenCalled();
  });
});
