import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TurnosPorMedicoChart } from './turnos-por-medico-chart';

describe('TurnosPorMedicoChart', () => {
  let component: TurnosPorMedicoChart;
  let fixture: ComponentFixture<TurnosPorMedicoChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TurnosPorMedicoChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TurnosPorMedicoChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
