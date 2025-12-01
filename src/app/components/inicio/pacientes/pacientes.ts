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
    trigger("slideInRight", [
      transition(":enter", [
        style({ transform: "translateX(100%)", opacity: 0 }),
        animate(
          "600ms ease-in-out",
          style({ transform: "translateX(0)", opacity: 1 }),
        ),
      ]),
      transition(":leave", [
        animate(
          "400ms ease-in",
          style({ transform: "translateX(100%)", opacity: 0 }),
        ),
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

  constructor(
    private turnosService: Turnos,
    private authSupabase: AuthSupabase,
    private usuariosService: UsuariosService,
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
    }
  }

  seleccionarPaciente(paciente: PacienteConCitas) {
    this.pacienteSeleccionado.set(paciente);
  }

  cerrarHistoriaClinica() {
    this.pacienteSeleccionado.set(null);
  }
}
