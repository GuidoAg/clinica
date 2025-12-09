import {
  Component,
  Input,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  signal,
} from "@angular/core";
import { Chart, registerables } from "chart.js";
import type { PuntuacionEspecialista } from "../../../models/Encuestas/modeloEncuestas";

Chart.register(...registerables);

@Component({
  selector: "app-puntuacion-especialista-chart",
  standalone: true,
  templateUrl: "./puntuacion-especialista-chart.html",
  styleUrls: ["./puntuacion-especialista-chart.css"],
})
export class PuntuacionEspecialistaChartComponent
  implements OnInit, AfterViewInit
{
  @Input() datos: PuntuacionEspecialista[] = [];
  @ViewChild("chartCanvas") chartCanvas!: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;
  cargando = signal<boolean>(true);

  ngOnInit(): void {
    this.cargando.set(this.datos.length === 0);
  }

  ngAfterViewInit(): void {
    if (this.datos.length > 0) {
      setTimeout(() => {
        this.renderizarGrafico();
        this.cargando.set(false);
      }, 100);
    }
  }

  private renderizarGrafico(): void {
    const ctx = this.chartCanvas.nativeElement.getContext("2d");
    if (!ctx) return;

    // Destruir gráfico anterior si existe
    if (this.chart) {
      this.chart.destroy();
    }

    // Obtener los datos limitados a top 10
    const datosTop = this.datos.slice(0, 10);

    // Generar colores basados en la puntuación
    const colores = datosTop.map((dato) => {
      if (dato.promedioEstrellas >= 4.5) return "rgba(34, 197, 94, 0.8)"; // Verde
      if (dato.promedioEstrellas >= 3.5) return "rgba(234, 179, 8, 0.8)"; // Amarillo
      if (dato.promedioEstrellas >= 2.5) return "rgba(249, 115, 22, 0.8)"; // Naranja
      return "rgba(239, 68, 68, 0.8)"; // Rojo
    });

    this.chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: datosTop.map((d) => d.especialista),
        datasets: [
          {
            label: "Promedio de Estrellas",
            data: datosTop.map((d) => d.promedioEstrellas),
            backgroundColor: colores,
            borderColor: colores.map((c) => c.replace("0.8", "1")),
            borderWidth: 1,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: "Puntuación Promedio por Especialista",
            font: { size: 16, weight: "bold" },
            padding: { top: 10, bottom: 20 },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const index = context.dataIndex;
                const dato = datosTop[index];
                return [
                  `Promedio: ${dato.promedioEstrellas.toFixed(1)} ⭐`,
                  `Valoración: ${dato.promedioRango.toFixed(0)}/100`,
                  `Encuestas: ${dato.totalEncuestas}`,
                ];
              },
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 5,
            title: {
              display: true,
              text: "Estrellas",
            },
            grid: {
              color: "rgba(0, 0, 0, 0.05)",
            },
          },
          y: {
            grid: {
              display: false,
            },
          },
        },
      },
    });
  }
}
