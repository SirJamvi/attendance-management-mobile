import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeaveCreatePage } from './leave-create.page';

describe('LeaveCreatePage', () => {
  let component: LeaveCreatePage;
  let fixture: ComponentFixture<LeaveCreatePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LeaveCreatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
