import { Component, OnInit, OnDestroy, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { AuthSupabase } from "../../../services/auth-supabase";
import { Usuario } from "../../../models/Auth/Usuario";
import { Observable, firstValueFrom } from "rxjs";
import { Turnos } from "../../../services/turnos";
import { CitaCompletaTurnos } from "../../../models/Turnos/CitaCompletaTurnos";
import { MatIconModule } from "@angular/material/icon";
import { LoadingOverlayService } from "../../../services/loading-overlay-service";
import { EstadoCita } from "../../../enums/EstadoCita";
import { Supabase } from "../../../supabase";
import { TABLA } from "../../../constantes";
import type { RealtimeChannel } from "@supabase/supabase-js";

@Component({
  selector: "app-entrada",
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: "./entrada.html",
  styleUrl: "./entrada.css",
})
export class Entrada implements OnInit, OnDestroy {
  usuario$: Observable<Usuario | null>;
  usuarioActual: Usuario | null = null;
  private realtimeChannel?: RealtimeChannel;

  proximosTurnos = signal<CitaCompletaTurnos[]>([]);
  cargando = signal(true);

  constructor(
    private authSupabase: AuthSupabase,
    private turnosService: Turnos,
    private router: Router,
    private loading: LoadingOverlayService,
  ) {
    this.usuario$ = this.authSupabase.user$;
  }

  async ngOnInit(): Promise<void> {
    this.usuarioActual = await firstValueFrom(this.usuario$);

    if (this.usuarioActual) {
      await this.cargarDatos();

      this.suscribirseACambiosCitas();
    }
  }

  ngOnDestroy(): void {
    if (this.realtimeChannel) {
      Supabase.removeChannel(this.realtimeChannel);
    }
  }

  /**
   * Suscribe al componente a cambios en tiempo real en la tabla citas
   */
  private suscribirseACambiosCitas(): void {
    if (!this.usuarioActual?.id) return;

    const userId = this.usuarioActual.id;
    const rol = this.usuarioActual.rol;

    this.realtimeChannel = Supabase.channel("citas-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: TABLA.CITAS,
          filter:
            rol === "paciente"
              ? `paciente_id=eq.${userId}`
              : `especialista_id=eq.${userId}`,
        },
        () => {
          this.cargarDatos();
        },
      )
      .subscribe();
  }

  async cargarDatos(): Promise<void> {
    if (!this.usuarioActual?.id) return;

    this.cargando.set(true);

    try {
      let todasLasCitas: CitaCompletaTurnos[] = [];

      if (this.usuarioActual.rol === "paciente") {
        todasLasCitas = await this.turnosService.obtenerCitasPaciente(
          this.usuarioActual.id,
        );
      } else if (this.usuarioActual.rol === "especialista") {
        todasLasCitas = await this.turnosService.obtenerCitasEspecialista(
          this.usuarioActual.id,
        );
      }

      this.proximosTurnos.set(
        this.turnosService.obtenerProximosTurnos(todasLasCitas, 3),
      );
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      this.cargando.set(false);
    }
  }

  formatearFecha(fecha: Date): string {
    return new Date(fecha).toLocaleDateString("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  getFechaActual(): string {
    return new Date().toLocaleDateString("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  formatearHora(fecha: Date): string {
    return new Date(fecha).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  getEstadoClase(estado: string): string {
    const clases: Record<string, string> = {
      [EstadoCita.SOLICITADO]: "bg-yellow-100 text-yellow-800",
      [EstadoCita.ACEPTADO]: "bg-green-100 text-green-800",
      [EstadoCita.RECHAZADO]: "bg-red-100 text-red-800",
      [EstadoCita.CANCELADO]: "bg-gray-100 text-gray-800",
      [EstadoCita.COMPLETADO]: "bg-blue-100 text-blue-800",
    };
    return clases[estado] || "bg-gray-100 text-gray-800";
  }

  navegarA(ruta: string): void {
    if (
      ruta !== "mis-turnos-especialista" &&
      ruta !== "pacientes" &&
      ruta !== "mis-turnos-paciente"
    ) {
      this.loading.show();
    }

    const rutaCompleta = `/home/${ruta}`;
    if (this.router.url === rutaCompleta) {
      if (ruta !== "mis-turnos-especialista") {
        this.loading.hide();
      }
      return;
    }

    this.router.navigate([rutaCompleta]);
  }
}
