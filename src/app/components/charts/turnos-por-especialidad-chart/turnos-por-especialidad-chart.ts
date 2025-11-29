import {
  Component,
  ElementRef,
  ViewChild,
  inject,
  AfterViewInit,
} from "@angular/core";
import { Estadisticas } from "../../../services/estadisticas";

@Component({
  selector: "app-turnos-por-especialidad-chart",
  standalone: true,
  template: `
    <div class="relative h-64 w-full">
      <canvas #canvas class="absolute inset-0 h-full w-full"></canvas>
    </div>
  `,
})
export class TurnosPorEspecialidadChart implements AfterViewInit {
  private estadisticas = inject(Estadisticas);
  private chart?: any;

  @ViewChild("canvas", { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit(): void {
    this.render();
  }

  private async render(): Promise<void> {
    // Lazy loading: cargar Chart.js y componentes solo cuando se necesiten
    const { Chart, ArcElement, PieController, Tooltip, Legend } = await import(
      "chart.js"
    );
    Chart.register(ArcElement, PieController, Tooltip, Legend);

    const datos = await this.estadisticas.obtenerTurnosPorEspecialidad();
    const labels = datos.map((d) => d.especialidad);
    const data = datos.map((d) => d.cantidad);

    const canvas = this.canvasRef.nativeElement;
    this.chart?.destroy();

    this.chart = new Chart(canvas, {
      type: "pie",
      data: {
        labels,
        datasets: [
          {
            label: "Turnos por Especialidad",
            data,
            backgroundColor: [
              "rgba(255, 99, 132, 0.7)",
              "rgba(54, 162, 235, 0.7)",
              "rgba(255, 206, 86, 0.7)",
              "rgba(75, 192, 192, 0.7)",
              "rgba(153, 102, 255, 0.7)",
              "rgba(255, 159, 64, 0.7)",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    });
  }
}
