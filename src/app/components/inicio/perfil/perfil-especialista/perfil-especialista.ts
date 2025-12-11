import { Component, OnInit, OnDestroy } from "@angular/core";

import { AuthSupabase } from "../../../../services/auth-supabase";
import { Usuario } from "../../../../models/Auth/Usuario";
import { Observable, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { LoadingOverlayService } from "../../../../services/loading-overlay-service";
import { FormatoDniPipe } from "../../../../pipes/formato-dni-pipe";
import { FormatoBoolSiNOPipe } from "../../../../pipes/formato-bool-si-no-pipe";
import { Horarios } from "../../horarios/horarios";
import { FormsModule } from "@angular/forms";
import { EspecialistaEspecialidad } from "../../../../services/especialista-especialidad";
import { MatSnackBar } from "@angular/material/snack-bar";
import { AgregarEspecialidad } from "../../agregar-especialidad/agregar-especialidad";
import { TranslocoModule } from "@jsverse/transloco";
import { TrackImage } from "../../../../directivas/track-image";
import { LoadingWrapper } from "../../../loading-wrapper/loading-wrapper";
import { trigger, style, transition, animate } from "@angular/animations";

@Component({
  selector: "app-perfil-especialista",
  standalone: true,
  imports: [
    FormatoDniPipe,
    FormatoBoolSiNOPipe,
    Horarios,
    FormsModule,
    AgregarEspecialidad,
    TranslocoModule,
    TrackImage,
    LoadingWrapper,
  ],
  templateUrl: "./perfil-especialista.html",
  styleUrl: "./perfil-especialista.css",
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
export class PerfilEspecialista implements OnInit, OnDestroy {
  usuario$: Observable<Usuario | null>;
  usuarioActual: Usuario | null = null;
  mostrarPopupHorarios = false;
  mostrarPopupAgregarEspecialidad = false;
  mostrarContenido = false;

  private destroy$ = new Subject<void>();

  constructor(
    private authSupabase: AuthSupabase,
    private loadingOverlay: LoadingOverlayService,
    private especialistaEspecialidad: EspecialistaEspecialidad,
    private snackBar: MatSnackBar,
  ) {
    this.usuario$ = this.authSupabase.user$;
  }

  ngOnInit() {
    this.loadingOverlay.hide();
    this.usuario$.pipe(takeUntil(this.destroy$)).subscribe((usuario) => {
      if (!usuario) {
        this.usuarioActual = null;
        return;
      }
      usuario.id =
        typeof usuario.id === "string" ? Number(usuario.id) : usuario.id;

      this.usuarioActual = usuario;
    });

    // Activar la animación después de un pequeño delay
    setTimeout(() => {
      this.mostrarContenido = true;
    }, 100);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  abrirPopupHorarios() {
    if (!this.usuarioActual) {
      console.warn("No hay usuario cargado para mostrar horarios");
      return;
    }
    this.mostrarPopupHorarios = true;
  }

  cerrarPopupHorarios() {
    this.mostrarPopupHorarios = false;
  }

  async guardarDuracion(especialidad: {
    id: number;
    duracion?: number;
    nombre: string;
    urlIcono?: string;
  }) {
    if (!this.usuarioActual?.id) {
      this.snackBar.open("No hay usuario válido para guardar.", "Cerrar", {
        duration: 4000,
        panelClass: ["bg-red-600", "text-white"],
      });
      return;
    }

    const duracion = especialidad.duracion;

    if (!duracion || duracion < 30 || duracion > 60) {
      this.snackBar.open(
        `Duración inválida para ${especialidad.nombre}. Debe estar entre 30 y 60 minutos.`,
        "Cerrar",
        {
          duration: 4000,
          panelClass: ["bg-red-600", "text-white"],
        },
      );
      return;
    }

    const ok = await this.especialistaEspecialidad.actualizarDuracion(
      especialidad.id,
      this.usuarioActual.id,
      duracion,
    );

    if (ok) {
      this.snackBar.open(
        `Duración actualizada para ${especialidad.nombre}`,
        "Cerrar",
        {
          duration: 3000,
          panelClass: ["bg-green-600", "text-white"],
        },
      );
      await this.authSupabase.recargarUsuario();
    } else {
      this.snackBar.open(
        `Error al actualizar duración de ${especialidad.nombre}`,
        "Cerrar",
        {
          duration: 4000,
          panelClass: ["bg-red-600", "text-white"],
        },
      );
    }
  }

  abrirPopupAgregarEspecialidad() {
    if (!this.usuarioActual) {
      this.snackBar.open(
        "No hay usuario cargado para agregar especialidad",
        "Cerrar",
        {
          duration: 3000,
          panelClass: ["bg-red-600", "text-white"],
        },
      );
      return;
    }
    this.mostrarPopupAgregarEspecialidad = true;
  }

  cerrarPopupAgregarEspecialidad() {
    this.mostrarPopupAgregarEspecialidad = false;
  }

  async onEspecialidadAgregada(nombreEspecialidad: string) {
    if (!this.usuarioActual?.id) return;

    this.snackBar.open("Agregando especialidad...", undefined, {
      duration: 1000,
    });

    const respuesta =
      await this.authSupabase.agregarEspecialidadSiNoExiste(nombreEspecialidad);

    if (!respuesta.success || !respuesta.data) {
      this.snackBar.open("Error al agregar especialidad", "Cerrar", {
        panelClass: ["bg-red-600", "text-white"],
        duration: 4000,
      });
      return;
    }

    const especialidadId = respuesta.data;

    const ok = await this.especialistaEspecialidad.agregarEspecialidad(
      this.usuarioActual.id,
      especialidadId,
    );

    if (!ok) {
      this.snackBar.open("Error al asignar la especialidad", "Cerrar", {
        panelClass: ["bg-red-600", "text-white"],
        duration: 4000,
      });
      return;
    }

    await this.authSupabase.recargarUsuario();

    this.usuarioActual = this.authSupabase.getCurrentUser();

    this.snackBar.open("Especialidad agregada con éxito", "Cerrar", {
      panelClass: ["bg-green-600", "text-white"],
      duration: 3000,
    });

    this.cerrarPopupAgregarEspecialidad();
  }
}
