import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetAccountComponent } from './set-account.component';

describe('SetAccountComponent', () => {
  let component: SetAccountComponent;
  let fixture: ComponentFixture<SetAccountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SetAccountComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SetAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
