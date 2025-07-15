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
  selector: 'app-acciones-paciente',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './acciones-paciente.html',
})
export class AccionesPaciente implements OnInit {
  @Input() cita!: CitaCompletaTurnos;
  @Output() cerrar = new EventEmitter<void>();
  @Output() accionRealizada = new EventEmitter<string>();

  cargando = signal(false);

  mostrarFormularioCancelar = false;
  mostrarFormularioEncuesta = false;
  mostrarFormularioCalificar = false;

  comentarioCancelar = '';
  comentarioCalificar = '';

  encuestaForm!: FormGroup;

  constructor(
    private turnos: Turnos,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.encuestaForm = this.fb.group({
      nombre: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      pregunta1: ['', Validators.required],
      pregunta2: ['', Validators.required],
      pregunta3: ['', Validators.required],
    });
  }

  get puedeCancelar() {
    return (
      this.cita.estado !== 'realizado' &&
      this.cita.estado !== 'cancelado' &&
      !this.mostrarFormularioCancelar &&
      !this.mostrarFormularioEncuesta &&
      !this.mostrarFormularioCalificar
    );
  }

  get puedeVerResenia() {
    return !!this.cita.resenia && this.cita.resenia.trim().length > 0;
  }

  get puedeCompletarEncuesta() {
    return (
      this.cita.estado === 'realizado' &&
      (!this.cita.resenia || this.cita.resenia.trim() === '') &&
      this.puedeVerResenia &&
      !this.mostrarFormularioEncuesta &&
      !this.mostrarFormularioCancelar &&
      !this.mostrarFormularioCalificar
    );
  }

  get puedeCalificar() {
    return (
      this.cita.estado === 'realizado' &&
      !this.mostrarFormularioCalificar &&
      !this.mostrarFormularioCancelar &&
      !this.mostrarFormularioEncuesta
    );
  }

  cancelarAccionCancelar() {
    this.mostrarFormularioCancelar = false;
    this.comentarioCancelar = '';
  }

  confirmarCancelarTurno() {
    if (!this.comentarioCancelar.trim()) return;

    this.cargando.set(true);
    this.turnos
      .cancelarCitaPaciente(this.cita, this.comentarioCancelar.trim())
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

  mostrarEncuesta() {
    this.mostrarFormularioEncuesta = true;
  }

  cancelarAccionEncuesta() {
    this.mostrarFormularioEncuesta = false;
    this.encuestaForm.reset();
  }
  enviarEncuesta() {
    if (this.encuestaForm.invalid) return;

    this.cargando.set(true);
    const encuesta: EncuestaTurnos = this.encuestaForm.value;
    encuesta.id = this.cita.citaId;

    this.turnos
      .cargarEncuesta(this.cita, encuesta)
      .then((res) => {
        this.cargando.set(false);
        if (res.success) {
          this.snackBar.open('Encuesta registrada exitosamente.', 'Cerrar', {
            duration: 3000,
          });
          this.accionRealizada.emit('encuesta');
          this.cerrar.emit();
        } else {
          this.snackBar.open(res.message ?? 'Ocurrió un error', 'Cerrar', {
            duration: 4000,
          });
        }
      })
      .finally(() => {
        this.mostrarFormularioEncuesta = false;
        this.encuestaForm.reset();
      });
  }

  cancelarAccionCalificar() {
    this.mostrarFormularioCalificar = false;
    this.comentarioCalificar = '';
  }

  confirmarCalificarAtencion() {
    if (!this.comentarioCalificar.trim()) return;

    this.cargando.set(true);
    this.turnos
      .cargarComentarioAtencion(this.cita, this.comentarioCalificar.trim())
      .then((res) => {
        this.cargando.set(false);
        if (res.success) {
          this.snackBar.open('Atención calificada exitosamente.', 'Cerrar', {
            duration: 3000,
          });
          this.accionRealizada.emit('calificacion');
          this.cerrar.emit();
        } else {
          this.snackBar.open(res.message ?? 'Ocurrió un error', 'Cerrar', {
            duration: 4000,
          });
        }
      })
      .finally(() => {
        this.mostrarFormularioCalificar = false;
        this.comentarioCalificar = '';
      });
  }

  // Método para ver reseña, si lo necesitas, puede ser algo simple
  verResenia() {
    if (this.cita.resenia) {
      this.snackBar.open(this.cita.resenia, 'Cerrar', { duration: 5000 });
    }
  }

  cerrarModal() {
    this.cerrar.emit();
  }
}
