import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DriverHistoryPage } from './driver-history.page';

describe('DriverHistoryPage', () => {
  let component: DriverHistoryPage;
  let fixture: ComponentFixture<DriverHistoryPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DriverHistoryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
