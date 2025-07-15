// src/app/components/charts/log-ingreso-chart/log-ingreso-chart.ts
import {
  Component,
  ElementRef,
  ViewChild,
  inject,
  AfterViewInit,
} from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { Estadisticas } from '../../../services/estadisticas';

@Component({
  selector: 'log-ingreso-chart',
  standalone: true,
  template: `<canvas #canvas class="mx-auto h-64 w-full max-w-xl"></canvas>`,
})
export class LogIngresoChart implements AfterViewInit {
  private estadisticas = inject(Estadisticas);

  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit(): void {
    this.render();
  }

  private async render() {
    Chart.register(...registerables);

    const datos = await this.estadisticas.obtenerLogIngresos();
    // datos: Array<{ fecha: string, ... }>, sin 'cantidad'

    // Agrupar por fecha y contar ocurrencias
    const agrupado = datos.reduce(
      (acc, curr) => {
        const fecha = curr.fecha.split('T')[0]; // si fecha incluye tiempo, solo día
        acc[fecha] = (acc[fecha] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const labels = Object.keys(agrupado).sort();
    const data = labels.map((fecha) => agrupado[fecha]);

    new Chart(this.canvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Ingresos al Sistema por Día',
            data,
            backgroundColor: 'rgba(255, 159, 64, 0.7)',
            borderColor: 'rgba(255, 159, 64, 1)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              precision: 0,
            },
          },
        },
      },
    });
  }
}
