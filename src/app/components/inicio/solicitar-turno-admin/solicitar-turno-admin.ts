import { Component, OnDestroy, OnInit, computed, signal } from "@angular/core";

import { Turnos } from "../../../services/turnos";
import { EspecialistaTurnos } from "../../../models/Turnos/EspecialistaTurnos";
import { EspecialidadTurnos } from "../../../models/Turnos/EspecialidadTurnos";
import { LoadingOverlayService } from "../../../services/loading-overlay-service";
import { CitaTurnos } from "../../../models/Turnos/CitaTurnos";
import { TrackImage } from "../../../directivas/track-image";
import { LoadingWrapper } from "../../loading-wrapper/loading-wrapper";
import { Usuario } from "../../../models/Auth/Usuario";
import { Observable, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { AuthSupabase } from "../../../services/auth-supabase";
import { MatSnackBar } from "@angular/material/snack-bar";
import { UsuariosService } from "../../../services/usuarios";
import { EstadoCita } from "../../../enums/EstadoCita";
import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger,
  animateChild,
} from "@angular/animations";

@Component({
  selector: "app-solicitar-turno-admin",
  imports: [TrackImage, LoadingWrapper],
  templateUrl: "./solicitar-turno-admin.html",
  styleUrl: "./solicitar-turno-admin.css",
  animations: [
    trigger("slideInFromRight", [
      transition("true => false", []),
      transition("* => true", [
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

    // Animación para botones individuales con bounce
    trigger("botonBounce", [
      transition(":enter", [
        style({ opacity: 0, transform: "scale(0.3) translateY(-20px)" }),
        animate(
          "500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)",
          style({ opacity: 1, transform: "scale(1) translateY(0)" }),
        ),
      ]),
    ]),

    // Animación para contenedores de listas
    trigger("listaStagger", [
      transition(":enter", [
        query("@botonBounce", stagger(80, animateChild()), {
          optional: true,
        }),
      ]),
    ]),

    trigger("especialidadAnimacion", [
      transition(":enter", [
        style({ opacity: 0, transform: "scale(0.5)" }),
        animate(
          "400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          style({ opacity: 1, transform: "scale(1)" }),
        ),
      ]),
    ]),

    trigger("listaAnimacion", [
      transition(":enter", [
        query("@especialidadAnimacion", stagger(150, animateChild()), {
          optional: true,
        }),
      ]),
    ]),
  ],
})
export class SolicitarTurnoAdmin implements OnInit, OnDestroy {
  usuario$: Observable<Usuario | null>;
  usuarioActual: Usuario | null = null;

  private destroy$ = new Subject<void>();

  especialistas = signal<EspecialistaTurnos[]>([]);
  especialidades = signal<EspecialidadTurnos[]>([]);
  fechasDisponibles = signal<string[]>([]);
  horariosDisponibles = signal<string[]>([]);

  especialistaSeleccionado = signal<EspecialistaTurnos | null>(null);
  especialidadSeleccionada = signal<EspecialidadTurnos | null>(null);
  fechaSeleccionada = signal<string | null>(null);
  horaSelecionada = signal<string | null>(null);

  especialidadesBuscadas = signal(false);
  diasBuscados = signal(false);
  horasBuscadas = signal(false);
  especialistasBuscados = signal(false);

  pacientes = signal<Usuario[]>([]);
  pacienteSeleccionado = signal<Usuario | null>(null);

  cargando = signal(false);

  mostrarContenido = false;
  primeraVezAnimando = true;

  constructor(
    private turnosService: Turnos,
    private loadin: LoadingOverlayService,
    private authSupabase: AuthSupabase,
    private snackBar: MatSnackBar,
    private usuariosService: UsuariosService,
  ) {
    this.usuario$ = this.authSupabase.user$;
  }

  especialistasValidados = computed(() =>
    this.especialistas().filter((e) => e.validadoAdmin === true),
  );

  noHayEspecialistas = computed(
    () =>
      this.especialistasBuscados() === true &&
      this.especialistas().length === 0,
  );

  noHayEspecialidades = computed(
    () =>
      this.especialistaSeleccionado() !== null &&
      this.especialidadesBuscadas() === true &&
      this.especialidades().length === 0,
  );

  noHayFechas = computed(
    () =>
      this.especialidadSeleccionada() !== null &&
      this.diasBuscados() === true &&
      this.fechasDisponibles().length === 0,
  );

  noHayHorarios = computed(
    () =>
      this.fechaSeleccionada() !== null &&
      this.horasBuscadas() === true &&
      this.horariosDisponibles().length === 0,
  );

  async ngOnInit() {
    this.usuario$.pipe(takeUntil(this.destroy$)).subscribe((usuario) => {
      if (!usuario) return;
      usuario.id =
        typeof usuario.id === "string" ? Number(usuario.id) : usuario.id;
      this.usuarioActual = usuario;
    });

    const [todosEspecialistas, pacientesData] = await Promise.all([
      this.turnosService.obtenerEspecialistas(),
      this.usuariosService.obtenerPacientesVerificados(),
    ]);

    const especialistasValidados = todosEspecialistas.filter(
      (e) => e.validadoAdmin === true && e.activo === true,
    );

    this.loadin.hide();

    // Activar la animación después de un pequeño delay
    setTimeout(() => {
      this.mostrarContenido = true;

      // Mostrar pacientes y especialistas con un delay adicional para que se vea la animación
      setTimeout(() => {
        this.pacientes.set(pacientesData);
        this.especialistas.set(especialistasValidados);
        this.especialistasBuscados.set(true);
      }, 200);
    }, 100);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  seleccionarPaciente(p: Usuario) {
    this.pacienteSeleccionado.set(p);
  }

  async seleccionarEspecialista(e: EspecialistaTurnos) {
    this.primeraVezAnimando = false;
    this.especialistaSeleccionado.set(e);
    this.especialidadSeleccionada.set(null);
    this.fechaSeleccionada.set(null);
    this.horaSelecionada.set(null);
    this.horariosDisponibles.set([]);
    this.fechasDisponibles.set([]);

    this.especialidadesBuscadas.set(false);
    this.diasBuscados.set(false);
    this.horasBuscadas.set(false);

    this.cargando.set(true);
    const especialidades =
      await this.turnosService.obtenerEspecialidadesDeEspecialista(e.id);
    this.especialidades.set(especialidades);
    this.especialidadesBuscadas.set(true);
    this.cargando.set(false);
  }

  async seleccionarEspecialidad(es: EspecialidadTurnos) {
    this.especialidadSeleccionada.set(es);
    this.fechaSeleccionada.set(null);
    this.horaSelecionada.set(null);
    this.horariosDisponibles.set([]);
    this.cargando.set(true);

    const fechas = await this.turnosService.obtenerFechasConHorariosDisponibles(
      this.especialistaSeleccionado()!.id,
      es.duracion,
      15,
      new Date(),
      this.pacienteSeleccionado()?.id,
    );
    this.fechasDisponibles.set(fechas);
    this.diasBuscados.set(true);
    this.cargando.set(false);
  }

  async seleccionarFecha(fecha: string) {
    this.horaSelecionada.set(null);
    this.fechaSeleccionada.set(fecha);
    this.cargando.set(true);

    const horarios = await this.turnosService.obtenerHorariosDisponibles(
      fecha,
      this.especialistaSeleccionado()!.id,
      this.especialidadSeleccionada()!.duracion,
      this.pacienteSeleccionado()?.id,
    );
    this.horariosDisponibles.set(horarios);
    this.horasBuscadas.set(true);
    this.cargando.set(false);
  }

  seleccionarHorario(hora: string) {
    this.horaSelecionada.set(hora);
  }

  async cargarCita() {
    const fecha = this.fechaSeleccionada();
    const hora = this.horaSelecionada();
    const especialista = this.especialistaSeleccionado();
    const especialidad = this.especialidadSeleccionada();
    const paciente = this.pacienteSeleccionado();

    if (!fecha || !hora || !especialista || !especialidad || !paciente) {
      console.error("Datos incompletos para agendar la cita");
      return;
    }

    const miFechaHora = new Date(`${fecha}T${hora}:00`);

    const cita: CitaTurnos = {
      fechaHora: miFechaHora,
      duracionMin: especialidad.duracion,
      pacienteId: paciente.id,
      especialistaId: especialista.id,
      especialidadId: especialidad.id,
      estado: EstadoCita.SOLICITADO,
      comentarioPaciente: " ",
      comentarioEspecialista: " ",
      resenia: " ",
    };

    try {
      const resultado = await this.turnosService.darAltaCita(cita);

      if (resultado.success) {
        this.snackBar.open("Cita agendada exitosamente", "✓", {
          duration: 4000,
          panelClass: ["bg-green-600", "text-white"],
        });

        this.pacienteSeleccionado.set(null);
        this.especialistaSeleccionado.set(null);
        this.especialidadSeleccionada.set(null);
        this.fechaSeleccionada.set(null);
        this.horaSelecionada.set(null);
      } else {
        const mensaje =
          resultado.errorCode === "horario_no_disponible"
            ? "El horario seleccionado ya no está disponible. Por favor, selecciona otro horario."
            : resultado.message || "No se pudo agendar la cita";

        this.snackBar.open(mensaje, "✕", {
          duration: 6000,
          panelClass: ["bg-red-600", "text-white"],
        });

        if (resultado.errorCode === "horario_no_disponible") {
          this.horaSelecionada.set(null);
          this.cargando.set(true);
          const horarios = await this.turnosService.obtenerHorariosDisponibles(
            this.fechaSeleccionada()!,
            this.especialistaSeleccionado()!.id,
            this.especialidadSeleccionada()!.duracion,
            this.pacienteSeleccionado()?.id,
          );
          this.horariosDisponibles.set(horarios);
          this.cargando.set(false);
        }
      }
    } catch (error) {
      console.error("Error al cargar la cita:", error);
      this.snackBar.open("Error inesperado al procesar la solicitud", "✕", {
        duration: 4000,
        panelClass: ["bg-red-600", "text-white"],
      });
    }
  }
}
