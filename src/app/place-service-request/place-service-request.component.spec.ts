import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaceServiceRequestComponent } from './place-service-request.component';

describe('PlaceServiceRequestComponent', () => {
  let component: PlaceServiceRequestComponent;
  let fixture: ComponentFixture<PlaceServiceRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlaceServiceRequestComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlaceServiceRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
