import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogIngresoChart } from './log-ingreso-chart';

describe('LogIngresoChart', () => {
  let component: LogIngresoChart;
  let fixture: ComponentFixture<LogIngresoChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogIngresoChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogIngresoChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
