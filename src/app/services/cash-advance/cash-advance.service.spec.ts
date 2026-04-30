import { TestBed } from '@angular/core/testing';

import { CashAdvance } from './cash-advance.service';

describe('CashAdvance', () => {
  let service: CashAdvance;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CashAdvance);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
