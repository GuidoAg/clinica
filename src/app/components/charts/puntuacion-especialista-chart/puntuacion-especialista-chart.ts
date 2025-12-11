import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  signal,
  inject,
} from "@angular/core";
import { Chart, registerables } from "chart.js";
import { TranslocoService } from "@jsverse/transloco";
import type { PuntuacionEspecialista } from "../../../models/Encuestas/modeloEncuestas";

Chart.register(...registerables);

@Component({
  selector: "app-puntuacion-especialista-chart",
  standalone: true,
  templateUrl: "./puntuacion-especialista-chart.html",
  styleUrls: ["./puntuacion-especialista-chart.css"],
})
export class PuntuacionEspecialistaChartComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @Input() datos: PuntuacionEspecialista[] = [];
  @ViewChild("chartCanvas") chartCanvas!: ElementRef<HTMLCanvasElement>;

  private readonly translocoService = inject(TranslocoService);
  private chart?: Chart;
  cargando = signal<boolean>(true);
  private langChangeSubscription?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.cargando.set(this.datos.length === 0);

    // Suscribirse a cambios de idioma
    this.translocoService.langChanges$.subscribe(() => {
      if (this.chart && this.datos.length > 0) {
        setTimeout(() => this.renderizarGrafico(), 100);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  ngAfterViewInit(): void {
    if (this.datos.length > 0) {
      // Esperar a que las traducciones estén cargadas
      this.translocoService
        .selectTranslate("encuestasPage.grafico.titulo")
        .subscribe(() => {
          setTimeout(() => {
            this.renderizarGrafico();
            this.cargando.set(false);
          }, 100);
        });
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
            label: this.translocoService.translate(
              "encuestasPage.grafico.promedioEstrellas",
            ),
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
        devicePixelRatio: 2,
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: this.translocoService.translate(
              "encuestasPage.grafico.titulo",
            ),
            font: { size: 18, weight: "bold" },
            padding: { top: 10, bottom: 20 },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const index = context.dataIndex;
                const dato = datosTop[index];
                return [
                  `${this.translocoService.translate("encuestasPage.grafico.promedio")}: ${dato.promedioEstrellas.toFixed(1)} ${this.translocoService.translate("encuestasPage.grafico.estrellas")}`,
                  `${this.translocoService.translate("encuestasPage.grafico.valoracion")}: ${dato.promedioRango.toFixed(0)}/100`,
                  `${this.translocoService.translate("encuestasPage.grafico.encuestas")}: ${dato.totalEncuestas}`,
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
              text: this.translocoService.translate(
                "encuestasPage.grafico.ejeEstrellas",
              ),
              font: { size: 14, weight: "bold" },
            },
            ticks: {
              font: { size: 12 },
            },
            grid: {
              color: "rgba(0, 0, 0, 0.05)",
            },
          },
          y: {
            ticks: {
              font: { size: 12 },
            },
            grid: {
              display: false,
            },
          },
        },
      },
    });
  }
}
