import { TestBed } from '@angular/core/testing';

import { SalesReport } from './sales-report';

describe('SalesReport', () => {
  let service: SalesReport;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SalesReport);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
