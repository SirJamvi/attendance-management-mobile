import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeaveListPage } from './leave-list.page';

describe('LeaveListPage', () => {
  let component: LeaveListPage;
  let fixture: ComponentFixture<LeaveListPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LeaveListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
