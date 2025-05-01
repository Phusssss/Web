import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThangThaiPhongComponent } from './thang-thai-phong.component';

describe('ThangThaiPhongComponent', () => {
  let component: ThangThaiPhongComponent;
  let fixture: ComponentFixture<ThangThaiPhongComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ThangThaiPhongComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ThangThaiPhongComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
