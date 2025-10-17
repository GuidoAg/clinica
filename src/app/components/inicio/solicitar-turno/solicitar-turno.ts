import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';

import { Turnos } from '../../../services/turnos';
import { EspecialistaTurnos } from '../../../models/Turnos/EspecialistaTurnos';
import { EspecialidadTurnos } from '../../../models/Turnos/EspecialidadTurnos';
import { LoadingOverlayService } from '../../../services/loading-overlay-service';
import { CitaTurnos } from '../../../models/Turnos/CitaTurnos';
import { TrackImage } from '../../../directivas/track-image';
import { LoadingWrapper } from '../../loading-wrapper/loading-wrapper';
import { Usuario } from '../../../models/Auth/Usuario';
import { Observable, Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthSupabase } from '../../../services/auth-supabase';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger,
  animateChild,
  state,
  keyframes,
} from '@angular/animations';

@Component({
  selector: 'app-solicitar-turno',
  standalone: true,
  imports: [TrackImage, LoadingWrapper],
  templateUrl: './solicitar-turno.html',
  styleUrl: './solicitar-turno.css',
  animations: [
    trigger('especialidadAnimacion', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.5)' }),
        animate(
          '400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          style({ opacity: 1, transform: 'scale(1)' }),
        ),
      ]),
    ]),

    trigger('listaAnimacion', [
      transition(':enter', [
        query('@especialidadAnimacion', stagger(150, animateChild()), {
          optional: true,
        }),
      ]),
    ]),
  ],
})
export class SolicitarTurno implements OnInit, OnDestroy {
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

  cargando = signal(false);

  constructor(
    private turnosService: Turnos,
    private loadin: LoadingOverlayService,
    private authSupabase: AuthSupabase,
    private snackBar: MatSnackBar,
  ) {
    this.usuario$ = this.authSupabase.user$;
  }

  especialistasValidados = computed(() =>
    this.especialistas().filter((e) => e.validadoAdmin === true),
  );

  // 🟡 Nuevas señales computadas
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
      if (!usuario) {
        this.usuarioActual = null;
        return;
      }
      // Asegurar que id sea número
      usuario.id =
        typeof usuario.id === 'string' ? Number(usuario.id) : usuario.id;

      this.usuarioActual = usuario;
    });

    this.especialistas.set(await this.turnosService.obtenerEspecialistas());

    this.loadin.hide();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async seleccionarEspecialista(e: EspecialistaTurnos) {
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

    const fechas = await this.turnosService.calcularFechasDisponibles(
      this.especialistaSeleccionado()!.id,
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
    const paciente = this.usuarioActual;

    if (!fecha || !hora || !especialista || !especialidad || !paciente) {
      console.error('Datos incompletos para agendar la cita');
      return;
    }

    const miFechaHora = new Date(`${fecha}T${hora}:00`);

    const cita: CitaTurnos = {
      fechaHora: miFechaHora,
      duracionMin: especialidad.duracion,
      pacienteId: paciente.id,
      especialistaId: especialista.id,
      especialidadId: especialidad.id,
      estado: 'solicitado',
      comentarioPaciente: ' ',
      comentarioEspecialista: ' ',
      resenia: ' ',
    };

    try {
      const resultado = await this.turnosService.darAltaCita(cita);
      console.log('Cita creada exitosamente', resultado);

      this.snackBar.open('Cita agendada', 'exito', {
        duration: 4000,
        panelClass: ['bg-blue-600', 'text-white'],
      });
      this.especialistaSeleccionado.set(null);
      this.especialidadSeleccionada.set(null);
      this.fechaSeleccionada.set(null);
      this.horaSelecionada.set(null);
    } catch (error) {
      console.error('Error al cargar la cita:', error);

      this.snackBar.open('Ups algo salio mal', 'error', {
        duration: 4000,
        panelClass: ['bg-red-600', 'text-white'],
      });
      this.especialistaSeleccionado.set(null);
      this.especialidadSeleccionada.set(null);
      this.fechaSeleccionada.set(null);
      this.horaSelecionada.set(null);
    }
  }
}
