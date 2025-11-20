import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VisitReportListPage } from './visit-report-list.page';

describe('VisitReportListPage', () => {
  let component: VisitReportListPage;
  let fixture: ComponentFixture<VisitReportListPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(VisitReportListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
