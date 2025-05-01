import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QRManagerComponent } from './qrmanager.component';

describe('QRManagerComponent', () => {
  let component: QRManagerComponent;
  let fixture: ComponentFixture<QRManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QRManagerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QRManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
