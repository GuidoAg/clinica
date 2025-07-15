import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TurnosPorEspecialidadChart } from './turnos-por-especialidad-chart';

describe('TurnosPorEspecialidadChart', () => {
  let component: TurnosPorEspecialidadChart;
  let fixture: ComponentFixture<TurnosPorEspecialidadChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TurnosPorEspecialidadChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TurnosPorEspecialidadChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
