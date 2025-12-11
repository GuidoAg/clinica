import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EncuestasService } from "../../../services/encuestas";
import type { EstadisticasEncuestas } from "../../../models/Encuestas/modeloEncuestas";
import { LoadingOverlayService } from "../../../services/loading-overlay-service";
import { PuntuacionEspecialistaChartComponent } from "../../charts/puntuacion-especialista-chart/puntuacion-especialista-chart";
import { exportarEncuestasPdf } from "../../../helpers/exportar-encuestas-pdf";
import { TranslocoModule } from "@jsverse/transloco";
import { trigger, style, transition, animate } from "@angular/animations";

// Constantes para mapeo de etiquetas
const ETIQUETAS_RADIO: Record<string, string> = {
  excelente: "Excelente",
  "muy-bueno": "Muy bueno",
  bueno: "Bueno",
  regular: "Regular",
  malo: "Malo",
};

const ETIQUETAS_ASPECTOS: Record<string, string> = {
  puntualidad: "Puntualidad",
  profesionalismo: "Profesionalismo",
  claridad: "Claridad en las explicaciones",
  empatia: "Empatía",
  instalaciones: "Instalaciones limpias",
  "tiempo-espera": "Poco tiempo de espera",
  seguimiento: "Buen seguimiento",
  recomendaria: "Lo recomendaría",
};

const ICONOS_TENDENCIA: Record<string, string> = {
  excelente: "😊",
  buena: "🙂",
  regular: "😐",
  critica: "😟",
};

@Component({
  selector: "app-encuestas",
  standalone: true,
  imports: [
    CommonModule,
    PuntuacionEspecialistaChartComponent,
    TranslocoModule,
  ],
  templateUrl: "./encuestas.html",
  styleUrl: "./encuestas.css",
  animations: [
    trigger("slideInFromRight", [
      transition(":enter", [
        style({
          transform: "translateX(150%)",
          opacity: 0,
        }),
        animate(
          "600ms cubic-bezier(0.35, 0, 0.25, 1)",
          style({
            transform: "translateX(0)",
            opacity: 1,
          }),
        ),
      ]),
    ]),
  ],
})
export class Encuestas implements OnInit {
  private readonly encuestasService = inject(EncuestasService);
  private readonly loading = inject(LoadingOverlayService);

  readonly estadisticas = signal<EstadisticasEncuestas | null>(null);
  mostrarContenido = false;

  async ngOnInit() {
    await this.cargarEstadisticas();

    // Activar la animación después de un pequeño delay
    setTimeout(() => {
      this.mostrarContenido = true;
    }, 100);
  }

  async cargarEstadisticas() {
    this.loading.show();
    try {
      const stats = await this.encuestasService.obtenerEstadisticas();
      this.estadisticas.set(stats);
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    } finally {
      this.loading.hide();
    }
  }

  obtenerEtiquetaRadio(valor: string): string {
    return ETIQUETAS_RADIO[valor] || valor;
  }

  obtenerEtiquetaAspecto(valor: string): string {
    return ETIQUETAS_ASPECTOS[valor] || valor;
  }

  obtenerColorEstrellas(estrellas: number): string {
    if (estrellas >= 4) return "text-green-600";
    if (estrellas >= 3) return "text-yellow-600";
    return "text-red-600";
  }

  obtenerIconoTendencia(promedio: number): string {
    if (promedio >= 4.5) return ICONOS_TENDENCIA["excelente"];
    if (promedio >= 3.5) return ICONOS_TENDENCIA["buena"];
    if (promedio >= 2.5) return ICONOS_TENDENCIA["regular"];
    return ICONOS_TENDENCIA["critica"];
  }

  obtenerClavesTendencia(): string[] {
    const tendencia = this.estadisticas()?.tendenciaGeneral;
    if (!tendencia) return [];
    return tendencia.split("|");
  }

  generarEstrellas(cantidad: number): string {
    return "⭐".repeat(cantidad);
  }

  async exportarEncuestasPdf() {
    const stats = this.estadisticas();
    if (!stats) {
      console.error("No hay estadísticas disponibles para exportar");
      return;
    }

    this.loading.show();
    try {
      await exportarEncuestasPdf(stats);
    } catch (error) {
      console.error("Error al exportar PDF:", error);
    } finally {
      this.loading.hide();
    }
  }
}
