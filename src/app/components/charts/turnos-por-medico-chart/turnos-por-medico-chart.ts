import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { Estadisticas } from '../../../services/estadisticas';
import { Chart, registerables } from 'chart.js';

@Component({
  selector: 'turnos-por-medico-chart',
  standalone: true,
  template: `
    <div class="relative h-64 w-full">
      <canvas #canvas class="absolute inset-0 h-full w-full"></canvas>
    </div>
  `,
})
export class TurnosPorMedicoChart {
  private estadisticas = inject(Estadisticas);
  private chart?: Chart;

  @ViewChild('canvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  async render(desde: string, hasta: string): Promise<void> {
    Chart.register(...registerables);

    const datos = await this.estadisticas.obtenerTurnosPorMedico(desde, hasta);
    const labels = datos.map((d) => d.nombre);
    const data = datos.map((d) => d.cantidad);

    const canvas = this.canvasRef.nativeElement;
    this.chart?.destroy();

    this.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Turnos por Médico',
            data,
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
            borderColor: 'rgba(75, 192, 192, 1)',
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
