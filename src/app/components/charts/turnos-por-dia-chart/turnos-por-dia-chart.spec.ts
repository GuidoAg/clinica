import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TurnosPorDiaChart } from './turnos-por-dia-chart';

describe('TurnosPorDiaChart', () => {
  let component: TurnosPorDiaChart;
  let fixture: ComponentFixture<TurnosPorDiaChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TurnosPorDiaChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TurnosPorDiaChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
