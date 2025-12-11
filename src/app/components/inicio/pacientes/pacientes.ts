import { Component, OnDestroy, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Turnos } from "../../../services/turnos";
import { CitaCompletaTurnos } from "../../../models/Turnos/CitaCompletaTurnos";
import { AuthSupabase } from "../../../services/auth-supabase";
import { Usuario } from "../../../models/Auth/Usuario";
import { Observable, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { UsuariosService } from "../../../services/usuarios";
import { trigger, transition, style, animate } from "@angular/animations";
import { UnidadMedidaPipe } from "../../../pipes/unidad-medida-pipe";
import { EstadoCita } from "../../../enums/EstadoCita";
import { LoadingOverlayService } from "../../../services/loading-overlay-service";

interface PacienteConCitas {
  paciente: Usuario;
  citas: CitaCompletaTurnos[];
}

@Component({
  selector: "app-pacientes",
  imports: [CommonModule, FormsModule, UnidadMedidaPipe],
  templateUrl: "./pacientes.html",
  styleUrl: "./pacientes.css",
  animations: [
    trigger("scaleIn", [
      transition(":enter", [
        style({ transform: "scale(0.3)", opacity: 0 }),
        animate("600ms ease-out", style({ transform: "scale(1)", opacity: 1 })),
      ]),
    ]),
  ],
})
export class Pacientes implements OnInit, OnDestroy {
  usuario$: Observable<Usuario | null>;
  usuarioActual: Usuario | null = null;
  private destroy$ = new Subject<void>();

  citas = signal<CitaCompletaTurnos[]>([]);
  cargando = signal(true);

  pacientesConCitas: PacienteConCitas[] = [];

  pacienteSeleccionado = signal<PacienteConCitas | null>(null);
  panelAnimando = signal(false);

  constructor(
    private turnosService: Turnos,
    private authSupabase: AuthSupabase,
    private usuariosService: UsuariosService,
    private loading: LoadingOverlayService,
  ) {
    this.usuario$ = this.authSupabase.user$;
  }

  ngOnInit() {
    this.usuario$.pipe(takeUntil(this.destroy$)).subscribe(async (usuario) => {
      if (!usuario) {
        this.usuarioActual = null;
        return;
      }

      usuario.id =
        typeof usuario.id === "string" ? Number(usuario.id) : usuario.id;
      this.usuarioActual = usuario;

      await this.cargarCitasYPacientes();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async cargarCitasYPacientes() {
    this.cargando.set(true);

    try {
      if (this.usuarioActual?.id == null) {
        this.pacientesConCitas = [];
        this.cargando.set(false);
        return;
      }

      const citasEspecialista =
        await this.turnosService.obtenerCitasEspecialista(
          this.usuarioActual.id,
        );

      const citasCompletadas = citasEspecialista.filter(
        (c) => c.estado === EstadoCita.COMPLETADO,
      );

      const agrupadas = new Map<number, CitaCompletaTurnos[]>();
      for (const cita of citasCompletadas) {
        if (!agrupadas.has(cita.pacienteId)) agrupadas.set(cita.pacienteId, []);
        agrupadas.get(cita.pacienteId)!.push(cita);
      }

      const todosUsuarios = await this.usuariosService.obtenerTodosUsuarios();
      const pacientes = todosUsuarios.filter((u) => u.rol === "paciente");

      this.pacientesConCitas = pacientes
        .filter((p) => agrupadas.has(p.id))
        .map((paciente) => {
          const citasPaciente = agrupadas.get(paciente.id)!;
          const citasOrdenadas = citasPaciente
            .sort(
              (a, b) =>
                new Date(b.fechaHora).getTime() -
                new Date(a.fechaHora).getTime(),
            )
            .slice(0, 3);
          return {
            paciente,
            citas: citasOrdenadas,
          };
        });
    } catch (e) {
      console.error("Error cargando citas y pacientes", e);
      this.pacientesConCitas = [];
    } finally {
      this.cargando.set(false);
      this.loading.hide();
    }
  }

  seleccionarPaciente(paciente: PacienteConCitas) {
    const panelYaAbierto = this.pacienteSeleccionado() !== null;

    if (panelYaAbierto) {
      // Si el panel ya está abierto, solo actualizar contenido sin animación
      this.pacienteSeleccionado.set(paciente);
      return;
    }

    // Panel cerrado: bloquear clicks durante la animación
    this.panelAnimando.set(true);
    this.pacienteSeleccionado.set(paciente);

    // Desbloquear después que termine la transición
    setTimeout(() => {
      this.panelAnimando.set(false);
    }, 700);
  }

  cerrarHistoriaClinica() {
    this.panelAnimando.set(true);
    this.pacienteSeleccionado.set(null);

    // Desbloquear después que termine la transición
    setTimeout(() => {
      this.panelAnimando.set(false);
    }, 700);
  }
}
