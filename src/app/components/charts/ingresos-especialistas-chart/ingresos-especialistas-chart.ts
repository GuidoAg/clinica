import {
  Component,
  ElementRef,
  ViewChild,
  inject,
  AfterViewInit,
} from "@angular/core";
import { Estadisticas } from "../../../services/estadisticas";

@Component({
  selector: "app-ingresos-especialistas-chart",
  standalone: true,
  template: `
    <div class="relative h-80 w-full">
      <canvas #canvas class="absolute inset-0 h-full w-full"></canvas>
    </div>
  `,
})
export class IngresosEspecialistasChart implements AfterViewInit {
  private estadisticas = inject(Estadisticas);
  private chart?: any;

  @ViewChild("canvas", { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit(): void {
    this.render();
  }

  async render(): Promise<void> {
    const {
      Chart,
      LineElement,
      LineController,
      PointElement,
      CategoryScale,
      LinearScale,
      Tooltip,
      Legend,
      Filler,
    } = await import("chart.js");
    Chart.register(
      LineElement,
      LineController,
      PointElement,
      CategoryScale,
      LinearScale,
      Tooltip,
      Legend,
      Filler,
    );

    const { datos, maxY } =
      await this.estadisticas.obtenerIngresosEspecialistas60Dias();

    const labels = datos.map((d) => d.fecha_hora);
    const data = datos.map((d) => d.cantidad);

    const canvas = this.canvasRef.nativeElement;
    this.chart?.destroy();

    this.chart = new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Ingresos de Especialistas (últimos 60 días)",
            data,
            borderColor: "rgba(54, 162, 235, 1)",
            backgroundColor: "rgba(54, 162, 235, 0.1)",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 2,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: maxY,
            ticks: {
              stepSize: 5,
              precision: 0,
            },
          },
          x: {
            ticks: {
              maxTicksLimit: 20,
              callback: function (value, index) {
                const label = labels[index];
                if (!label) return "";
                if (index % Math.ceil(labels.length / 20) === 0) {
                  return label;
                }
                return "";
              },
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              title: function (context) {
                return context[0].label || "";
              },
            },
          },
        },
      },
    });
  }
}
