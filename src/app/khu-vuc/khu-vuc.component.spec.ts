import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KhuVucComponent } from './khu-vuc.component';

describe('KhuVucComponent', () => {
  let component: KhuVucComponent;
  let fixture: ComponentFixture<KhuVucComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KhuVucComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KhuVucComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
