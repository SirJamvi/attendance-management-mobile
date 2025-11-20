import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VisitReportCreatePage } from './visit-report-create.page';

describe('VisitReportCreatePage', () => {
  let component: VisitReportCreatePage;
  let fixture: ComponentFixture<VisitReportCreatePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(VisitReportCreatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
