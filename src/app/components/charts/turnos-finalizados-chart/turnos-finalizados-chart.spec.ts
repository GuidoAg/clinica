import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TurnosFinalizadosChart } from './turnos-finalizados-chart';

describe('TurnosFinalizadosChart', () => {
  let component: TurnosFinalizadosChart;
  let fixture: ComponentFixture<TurnosFinalizadosChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TurnosFinalizadosChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TurnosFinalizadosChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
