import {
  Component,
  ElementRef,
  ViewChild,
  inject,
  AfterViewInit,
} from "@angular/core";
import { Estadisticas } from "../../../services/estadisticas";
import type { Chart } from "chart.js";

@Component({
  selector: "app-medicos-por-especialidad-chart",
  standalone: true,
  template: `
    <div class="relative h-64 w-full">
      <canvas #canvas class="absolute inset-0 h-full w-full"></canvas>
    </div>
  `,
})
export class MedicosPorEspecialidadChart implements AfterViewInit {
  private estadisticas = inject(Estadisticas);
  private chart?: Chart;

  @ViewChild("canvas", { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit(): void {
    this.render();
  }

  private async render(): Promise<void> {
    const { Chart, ArcElement, PieController, Tooltip, Legend } = await import(
      "chart.js"
    );
    Chart.register(ArcElement, PieController, Tooltip, Legend);

    const datos = await this.estadisticas.obtenerMedicosPorEspecialidad();
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
            label: "Médicos por Especialidad",
            data,
            backgroundColor: [
              "rgba(99, 102, 241, 0.7)",
              "rgba(236, 72, 153, 0.7)",
              "rgba(34, 197, 94, 0.7)",
              "rgba(251, 146, 60, 0.7)",
              "rgba(14, 165, 233, 0.7)",
              "rgba(168, 85, 247, 0.7)",
              "rgba(245, 158, 11, 0.7)",
              "rgba(239, 68, 68, 0.7)",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || "";
                const value = context.parsed || 0;
                return `${label}: ${value} médico${value !== 1 ? "s" : ""}`;
              },
            },
          },
        },
      },
    });
  }
}
