import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SalesDashboardPage } from './sales-dashboard.page';

describe('SalesDashboardPage', () => {
  let component: SalesDashboardPage;
  let fixture: ComponentFixture<SalesDashboardPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SalesDashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
