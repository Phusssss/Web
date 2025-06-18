import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThongBaoChungComponent } from './thong-bao-chung.component';

describe('ThongBaoChungComponent', () => {
  let component: ThongBaoChungComponent;
  let fixture: ComponentFixture<ThongBaoChungComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ThongBaoChungComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ThongBaoChungComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
