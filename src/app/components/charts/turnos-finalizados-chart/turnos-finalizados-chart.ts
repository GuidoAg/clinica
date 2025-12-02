import { Component, ElementRef, ViewChild, inject } from "@angular/core";
import { Estadisticas } from "../../../services/estadisticas";

@Component({
  selector: "app-turnos-finalizados-por-medico-chart",
  standalone: true,
  template: `
    <div class="relative h-64 w-full">
      <canvas #canvas class="absolute inset-0 h-full w-full"></canvas>
    </div>
  `,
})
export class TurnosFinalizadosPorMedicoChart {
  private estadisticas = inject(Estadisticas);
  private chart?: any;

  @ViewChild("canvas", { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  async render(desde: string, hasta: string): Promise<void> {
    const {
      Chart,
      BarElement,
      BarController,
      CategoryScale,
      LinearScale,
      Tooltip,
      Legend,
    } = await import("chart.js");
    Chart.register(
      BarElement,
      BarController,
      CategoryScale,
      LinearScale,
      Tooltip,
      Legend,
    );

    const datos = await this.estadisticas.obtenerTurnosFinalizadosPorMedico(
      desde,
      hasta,
    );
    const labels = datos.map((d) => d.nombre);
    const data = datos.map((d) => d.cantidad);

    this.chart?.destroy();

    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Turnos Finalizados por Médico",
            data,
            backgroundColor: "rgba(153, 102, 255, 0.7)",
            borderColor: "rgba(153, 102, 255, 1)",
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
