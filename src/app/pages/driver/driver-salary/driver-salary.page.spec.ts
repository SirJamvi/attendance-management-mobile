import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DriverSalaryPage } from './driver-salary.page';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SalaryService } from 'src/app/services/salary.service';

describe('DriverSalaryPage', () => {
  let component: DriverSalaryPage;
  let fixture: ComponentFixture<DriverSalaryPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverSalaryPage, HttpClientTestingModule], // Import Standalone Component & HTTP Mock
      providers: [SalaryService]
    }).compileComponents();

    fixture = TestBed.createComponent(DriverSalaryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});