import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DailyReportCreatePage } from './daily-report-create.page';

describe('DailyReportCreatePage', () => {
  let component: DailyReportCreatePage;
  let fixture: ComponentFixture<DailyReportCreatePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DailyReportCreatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
