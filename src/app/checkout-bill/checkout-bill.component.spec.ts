import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckoutBillComponent } from './checkout-bill.component';

describe('CheckoutBillComponent', () => {
  let component: CheckoutBillComponent;
  let fixture: ComponentFixture<CheckoutBillComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CheckoutBillComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckoutBillComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
