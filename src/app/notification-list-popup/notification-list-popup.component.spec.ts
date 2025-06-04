import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationListPopupComponent } from './notification-list-popup.component';

describe('NotificationListPopupComponent', () => {
  let component: NotificationListPopupComponent;
  let fixture: ComponentFixture<NotificationListPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NotificationListPopupComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationListPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
