import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AttendanceScreenPage } from './attendance-screen.page';

describe('AttendanceScreenPage', () => {
  let component: AttendanceScreenPage;
  let fixture: ComponentFixture<AttendanceScreenPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendanceScreenPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
