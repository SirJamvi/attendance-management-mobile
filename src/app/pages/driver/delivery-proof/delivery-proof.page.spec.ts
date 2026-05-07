import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeliveryProofPage } from './delivery-proof.page';

describe('DeliveryProofPage', () => {
  let component: DeliveryProofPage;
  let fixture: ComponentFixture<DeliveryProofPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DeliveryProofPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
