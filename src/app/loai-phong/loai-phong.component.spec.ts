import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoaiPhongComponent } from './loai-phong.component';

describe('LoaiPhongComponent', () => {
  let component: LoaiPhongComponent;
  let fixture: ComponentFixture<LoaiPhongComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoaiPhongComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoaiPhongComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
