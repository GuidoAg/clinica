import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatSnackBar } from "@angular/material/snack-bar";
import { AuthSupabase } from "../../../../services/auth-supabase";
import { Usuario } from "../../../../models/Auth/Usuario";
import { Observable, firstValueFrom } from "rxjs";
import { LoadingOverlayService } from "../../../../services/loading-overlay-service";
import { Turnos } from "../../../../services/turnos";
import { CitaCompletaTurnos } from "../../../../models/Turnos/CitaCompletaTurnos";
import { ExportarPdf } from "../../../../services/exportar-pdf";
import {
  exportarHistoriaClinicaPdf,
  obtenerEspecialidadesUnicas,
} from "../../../../helpers/exportar-historia-clinica";
import { TranslocoModule } from "@jsverse/transloco";
import { TrackImage } from "../../../../directivas/track-image";
import { LoadingWrapper } from "../../../loading-wrapper/loading-wrapper";
import {
  trigger,
  style,
  transition,
  animate,
  keyframes,
} from "@angular/animations";

@Component({
  selector: "app-perfil-paciente",
  imports: [CommonModule, TranslocoModule, TrackImage, LoadingWrapper],
  templateUrl: "./perfil-paciente.html",
  styleUrl: "./perfil-paciente.css",
  animations: [
    trigger("slideInFromRight", [
      transition(":enter", [
        animate(
          "1000ms ease-out",
          keyframes([
            style({
              transform: "rotate(-360deg) scale(0.3)",
              opacity: 0,
              offset: 0,
            }),
            style({
              transform: "rotate(-180deg) scale(0.7)",
              opacity: 0.5,
              offset: 0.5,
            }),
            style({
              transform: "rotate(-30deg) scale(1.05)",
              opacity: 1,
              offset: 0.8,
            }),
            style({
              transform: "rotate(0deg) scale(1)",
              opacity: 1,
              offset: 1,
            }),
          ]),
        ),
      ]),
    ]),
  ],
})
export class PerfilPaciente implements OnInit {
  usuario$: Observable<Usuario | null>;
  citas: CitaCompletaTurnos[] = [];
  especialidades: string[] = [];
  mostrarModalDescarga = false;
  especialidadSeleccionada: string | null = null;
  mostrarContenido = false;

  constructor(
    private authSupabase: AuthSupabase,
    private loadingOverlay: LoadingOverlayService,
    private turnosService: Turnos,
    private exportarPdf: ExportarPdf,
    private snackBar: MatSnackBar,
  ) {
    this.usuario$ = this.authSupabase.user$;
  }

  async ngOnInit(): Promise<void> {
    this.loadingOverlay.hide();
    const usuario = await firstValueFrom(this.usuario$);

    if (usuario) {
      console.log("Usuario cargado en ngOnInit:", usuario.urlImagenFondo);
      await this.cargarHistorialClinico(usuario.id);
    }

    // Activar la animación después de un pequeño delay
    setTimeout(() => {
      this.mostrarContenido = true;
    }, 100);
  }

  async cargarHistorialClinico(usuarioId: number): Promise<void> {
    try {
      this.citas = await this.turnosService.obtenerCitasPaciente(usuarioId);

      this.citas = this.citas.filter((cita) => cita.estado === "completado");

      this.especialidades = obtenerEspecialidadesUnicas(this.citas);

      console.log(`Historia clínica cargada: ${this.citas.length} citas`);
    } catch (error) {
      console.error("Error al cargar historia clínica:", error);
    }
  }

  abrirModalDescarga(): void {
    if (this.citas.length === 0) {
      this.snackBar.open(
        "No tienes citas completadas para generar la historia clínica.",
        "Cerrar",
        { duration: 4000 },
      );
      return;
    }
    this.mostrarModalDescarga = true;
  }

  cerrarModalDescarga(): void {
    this.mostrarModalDescarga = false;
    this.especialidadSeleccionada = null;
  }

  seleccionarEspecialidad(especialidad: string | null): void {
    this.especialidadSeleccionada = especialidad;
  }

  async descargarHistoriaClinica(): Promise<void> {
    const usuario = await firstValueFrom(this.usuario$);

    if (!usuario) {
      this.snackBar.open(
        "No se pudo obtener la información del usuario.",
        "Cerrar",
        { duration: 4000 },
      );
      return;
    }

    try {
      await exportarHistoriaClinicaPdf(usuario, this.citas, this.exportarPdf, {
        especialidadFiltro: this.especialidadSeleccionada || undefined,
        incluirDatosDinamicos: true,
      });

      this.cerrarModalDescarga();
    } catch (error) {
      console.error("Error al generar PDF:", error);
      this.snackBar.open(
        "Error al generar la historia clínica. Por favor, intenta nuevamente.",
        "Cerrar",
        { duration: 5000 },
      );
    }
  }

  contarCitasPorEspecialidad(especialidad: string): number {
    return this.citas.filter((c) => c.especialidadNombre === especialidad)
      .length;
  }
}
