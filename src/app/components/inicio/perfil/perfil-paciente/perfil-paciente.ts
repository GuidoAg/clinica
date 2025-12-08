import { Component, OnInit, AfterViewInit } from "@angular/core";
import { CommonModule } from "@angular/common";
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

@Component({
  selector: "app-perfil-paciente",
  imports: [CommonModule],
  templateUrl: "./perfil-paciente.html",
  styleUrl: "./perfil-paciente.css",
})
export class PerfilPaciente implements OnInit, AfterViewInit {
  usuario$: Observable<Usuario | null>;
  citas: CitaCompletaTurnos[] = [];
  especialidades: string[] = [];
  mostrarModalDescarga = false;
  especialidadSeleccionada: string | null = null;

  constructor(
    private authSupabase: AuthSupabase,
    private loading: LoadingOverlayService,
    private turnosService: Turnos,
    private exportarPdf: ExportarPdf,
  ) {
    this.usuario$ = this.authSupabase.user$;
  }

  async ngOnInit(): Promise<void> {
    const usuario = await firstValueFrom(this.usuario$);

    if (usuario) {
      console.log("Usuario cargado en ngOnInit:", usuario.urlImagenFondo);
      await this.cargarHistorialClinico(usuario.id);
    }
  }

  ngAfterViewInit(): void {
    this.loading.hide();
  }

  async cargarHistorialClinico(usuarioId: number): Promise<void> {
    try {
      this.loading.show();
      this.citas = await this.turnosService.obtenerCitasPaciente(usuarioId);

      // Filtrar solo citas completadas para la historia clínica
      this.citas = this.citas.filter((cita) => cita.estado === "completado");

      this.especialidades = obtenerEspecialidadesUnicas(this.citas);

      console.log(`Historia clínica cargada: ${this.citas.length} citas`);
    } catch (error) {
      console.error("Error al cargar historia clínica:", error);
    } finally {
      this.loading.hide();
    }
  }

  abrirModalDescarga(): void {
    if (this.citas.length === 0) {
      alert("No tienes citas completadas para generar la historia clínica.");
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
      alert("No se pudo obtener la información del usuario.");
      return;
    }

    try {
      this.loading.show();

      await exportarHistoriaClinicaPdf(usuario, this.citas, this.exportarPdf, {
        especialidadFiltro: this.especialidadSeleccionada || undefined,
        incluirDatosDinamicos: true,
      });

      this.cerrarModalDescarga();
    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert(
        "Error al generar la historia clínica. Por favor, intenta nuevamente.",
      );
    } finally {
      this.loading.hide();
    }
  }

  contarCitasPorEspecialidad(especialidad: string): number {
    return this.citas.filter((c) => c.especialidadNombre === especialidad)
      .length;
  }
}
