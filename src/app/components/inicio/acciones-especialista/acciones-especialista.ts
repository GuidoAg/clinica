import {
  Component,
  EventEmitter,
  Output,
  Input,
  OnInit,
  signal,
  WritableSignal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Turnos } from '../../../services/turnos';
import { CitaCompletaTurnos } from '../../../models/Turnos/CitaCompletaTurnos';
import { EncuestaTurnos } from '../../../models/Turnos/EncuestaTurnos';

@Component({
  selector: 'app-acciones-especialista',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './acciones-especialista.html',
  styleUrl: './acciones-especialista.css',
})
export class AccionesEspecialista {
  @Input() cita!: CitaCompletaTurnos;
  @Output() cerrar = new EventEmitter<void>();
  @Output() accionRealizada = new EventEmitter<string>();

  cargando = signal(false);

  mostrarFormularioCancelar = false;
  mostrarFormularioRechazar = false;
  mostrarFormularioAceptar = false;
  mostrarFormularioFinalizar = false;
  mostrarFormularioResenia = false;

  comentarioCancelar = '';
  comentarioRechazar = '';
  reseniaFinalizar = '';

  constructor(
    private turnos: Turnos,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
  ) {}

  get puedeCancelar() {
    return (
      this.cita.estado !== 'completado' &&
      this.cita.estado !== 'cancelado' &&
      this.cita.estado !== 'aceptado' &&
      this.cita.estado !== 'rechazado' &&
      !this.mostrarFormularioCancelar &&
      !this.mostrarFormularioAceptar &&
      !this.mostrarFormularioFinalizar &&
      !this.mostrarFormularioRechazar &&
      !this.mostrarFormularioResenia
    );
  }

  get puedeRechazar() {
    return (
      this.cita.estado !== 'completado' &&
      this.cita.estado !== 'cancelado' &&
      this.cita.estado !== 'aceptado' &&
      this.cita.estado !== 'rechazado' &&
      !this.mostrarFormularioCancelar &&
      !this.mostrarFormularioAceptar &&
      !this.mostrarFormularioFinalizar &&
      !this.mostrarFormularioRechazar &&
      !this.mostrarFormularioResenia
    );
  }

  get puedeAceptar() {
    return (
      this.cita.estado !== 'completado' &&
      this.cita.estado !== 'cancelado' &&
      this.cita.estado !== 'aceptado' &&
      this.cita.estado !== 'rechazado' &&
      !this.mostrarFormularioCancelar &&
      !this.mostrarFormularioAceptar &&
      !this.mostrarFormularioFinalizar &&
      !this.mostrarFormularioRechazar &&
      !this.mostrarFormularioResenia
    );
  }

  get puedeFinalizar() {
    return (
      this.cita.estado === 'aceptado' &&
      !this.mostrarFormularioCancelar &&
      !this.mostrarFormularioAceptar &&
      !this.mostrarFormularioFinalizar &&
      !this.mostrarFormularioRechazar &&
      !this.mostrarFormularioResenia
    );
  }

  get puedeVerResenia() {
    return !!this.cita.resenia && this.cita.resenia.trim().length > 0;
  }

  cancelarAccionCancelar() {
    this.mostrarFormularioCancelar = false;
    this.comentarioCancelar = '';
  }

  confirmarCancelarTurno() {
    if (!this.comentarioCancelar.trim()) return;

    this.cargando.set(true);
    this.turnos
      .cancelarCitaEspecialista(this.cita, this.comentarioCancelar.trim())
      .then((res) => {
        this.cargando.set(false);
        if (res.success) {
          this.snackBar.open('Turno cancelado exitosamente.', 'Cerrar', {
            duration: 3000,
          });
          this.accionRealizada.emit('cancelado');
          this.cerrar.emit();
        } else {
          this.snackBar.open(res.message ?? 'Ocurrió un error', 'Cerrar', {
            duration: 4000,
          });
        }
      })
      .finally(() => {
        this.mostrarFormularioCancelar = false;
        this.comentarioCancelar = '';
      });
  }

  cancelarAccionRechazar() {
    this.mostrarFormularioRechazar = false;
    this.comentarioRechazar = '';
  }

  confirmarRechazarTurno() {
    if (!this.comentarioRechazar.trim()) return;

    this.cargando.set(true);
    this.turnos
      .rechazarCitaEspecialista(this.cita, this.comentarioRechazar.trim())
      .then((res) => {
        this.cargando.set(false);
        if (res.success) {
          this.snackBar.open('Turno rechazado exitosamente.', 'Cerrar', {
            duration: 3000,
          });
          this.accionRealizada.emit('rechazado');
          this.cerrar.emit();
        } else {
          this.snackBar.open(res.message ?? 'Ocurrió un error', 'Cerrar', {
            duration: 4000,
          });
        }
      })
      .finally(() => {
        this.mostrarFormularioRechazar = false;
        this.comentarioRechazar = '';
      });
  }

  cancelarAccionAceptar() {
    this.mostrarFormularioAceptar = false;
  }

  confirmarAceptarTurno() {
    this.cargando.set(true);
    this.turnos
      .aceptarCitaEspecialista(this.cita)
      .then((res) => {
        this.cargando.set(false);
        if (res.success) {
          this.snackBar.open('Turno aceptado exitosamente.', 'Cerrar', {
            duration: 3000,
          });
          this.accionRealizada.emit('aceptado');
          this.cerrar.emit();
        } else {
          this.snackBar.open(res.message ?? 'Ocurrió un error', 'Cerrar', {
            duration: 4000,
          });
        }
      })
      .finally(() => {
        this.mostrarFormularioAceptar = false;
      });
  }

  cancelarAccionFinalizar() {
    this.mostrarFormularioFinalizar = false;
    this.reseniaFinalizar = '';
  }

  confirmarFinalizarTurno() {
    if (!this.reseniaFinalizar.trim()) return;

    this.cargando.set(true);
    this.turnos
      .completarCitaEspecialista(this.cita, this.reseniaFinalizar.trim())
      .then((res) => {
        this.cargando.set(false);
        if (res.success) {
          this.snackBar.open('Turno finalizado exitosamente.', 'Cerrar', {
            duration: 3000,
          });
          this.accionRealizada.emit('completado');
          this.cerrar.emit();
        } else {
          this.snackBar.open(res.message ?? 'Ocurrió un error', 'Cerrar', {
            duration: 4000,
          });
        }
      })
      .finally(() => {
        this.mostrarFormularioFinalizar = false;
        this.reseniaFinalizar = '';
      });
  }

  verResenia() {
    this.mostrarFormularioResenia = true;
  }

  volverDesdeVistaResenia() {
    this.mostrarFormularioResenia = false;
  }

  cerrarModal() {
    this.cerrar.emit();
  }
}
