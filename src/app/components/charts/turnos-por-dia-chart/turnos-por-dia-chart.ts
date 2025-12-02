import {
  Component,
  ElementRef,
  inject,
  ViewChild,
  AfterViewInit,
} from "@angular/core";
import { Estadisticas } from "../../../services/estadisticas";

@Component({
  selector: "app-turnos-por-dia-chart",
  standalone: true,
  template: `<canvas #canvas class="mx-auto h-64 w-full"></canvas>`,
})
export class TurnosPorDiaChart implements AfterViewInit {
  private estadisticas = inject(Estadisticas);

  @ViewChild("canvas", { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  async ngAfterViewInit() {
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
    const canvas = this.canvasRef.nativeElement;

    const datos = await this.estadisticas.obtenerTurnosPorDia();
    const labels = datos.map((d) => d.fecha);
    const data = datos.map((d) => d.cantidad);

    new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Turnos por Día",
            data,
            backgroundColor: "rgba(54, 162, 235, 0.7)",
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
