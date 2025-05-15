import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundStatisticsComponent } from './fund-statistics.component';

describe('FundStatisticsComponent', () => {
  let component: FundStatisticsComponent;
  let fixture: ComponentFixture<FundStatisticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FundStatisticsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FundStatisticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
