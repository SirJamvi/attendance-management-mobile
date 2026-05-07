import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CashAdvancePage } from './cash-advance.page';

describe('CashAdvancePage', () => {
  let component: CashAdvancePage;
  let fixture: ComponentFixture<CashAdvancePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CashAdvancePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
