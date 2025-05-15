import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoodsIssueComponent } from './goods-issue.component';

describe('GoodsIssueComponent', () => {
  let component: GoodsIssueComponent;
  let fixture: ComponentFixture<GoodsIssueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GoodsIssueComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GoodsIssueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
