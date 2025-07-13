import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Turnos } from '../../../services/turnos';
import { EspecialistaTurnos } from '../../../models/Turnos/EspecialistaTurnos';
import { EspecialidadTurnos } from '../../../models/Turnos/EspecialidadTurnos';
import { LoadingOverlayService } from '../../../services/loading-overlay-service';

import { TrackImage } from '../../../directivas/track-image';
import { LoadingWrapper } from '../../loading-wrapper/loading-wrapper';

@Component({
  selector: 'app-solicitar-turno',
  standalone: true,
  imports: [CommonModule, TrackImage, LoadingWrapper],
  templateUrl: './solicitar-turno.html',
  styleUrl: './solicitar-turno.css',
})
export class SolicitarTurno implements OnInit {
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

  constructor(
    private turnosService: Turnos,
    private loadin: LoadingOverlayService,
  ) {}

  async ngOnInit() {
    this.especialistas.set(await this.turnosService.obtenerEspecialistas());
    this.loadin.hide();
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

    console.log('Turno seleccionado:', {
      especialista: this.especialistaSeleccionado(),
      especialidad: this.especialidadSeleccionada(),
      fecha: this.fechaSeleccionada(),
      horas: this.horaSelecionada(),
    });
  }
}
