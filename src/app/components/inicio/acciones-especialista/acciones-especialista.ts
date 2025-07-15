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
import { RegistroMedicoTurnos } from '../../../models/Turnos/RegistroMedicoTurnos';
import { DatoDinamicoTurnos } from '../../../models/Turnos/DatoDinamicoTurnos';

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
  mostrarFormularioHistoriaClinica = false;

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
      !this.mostrarFormularioHistoriaClinica &&
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
      !this.mostrarFormularioHistoriaClinica &&
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
      !this.mostrarFormularioHistoriaClinica &&
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
      !this.mostrarFormularioHistoriaClinica &&
      !this.mostrarFormularioResenia
    );
  }

  get puedeCargarHistoriaClinica() {
    return (
      this.cita.estado === 'completado' &&
      !this.yaTieneHistoriaClinica &&
      !this.mostrarFormularioCancelar &&
      !this.mostrarFormularioAceptar &&
      !this.mostrarFormularioFinalizar &&
      !this.mostrarFormularioRechazar &&
      !this.mostrarFormularioResenia &&
      !this.mostrarFormularioHistoriaClinica
    );
  }

  get puedeVerResenia() {
    return (
      !!this.cita.resenia &&
      this.cita.resenia.trim().length > 0 &&
      !this.mostrarFormularioCancelar &&
      !this.mostrarFormularioAceptar &&
      !this.mostrarFormularioFinalizar &&
      !this.mostrarFormularioRechazar &&
      !this.mostrarFormularioResenia &&
      !this.mostrarFormularioHistoriaClinica
    );
  }

  get yaTieneHistoriaClinica(): boolean {
    return (
      this.cita.alturaCm !== null &&
      this.cita.pesoKg !== null &&
      this.cita.temperaturaC !== null &&
      !!this.cita.presionArterial?.trim()
    );
  }

  registro: RegistroMedicoTurnos = {
    alturaCm: 0,
    pesoKg: 0,
    temperaturaC: 0,
    presionArterial: '',
    citaId: 0,
  };

  datosTexto: { clave: string; valor: string }[] = [
    { clave: '', valor: '' },
    { clave: '', valor: '' },
    { clave: '', valor: '' },
  ];

  datoSlider = { clave: '', valor: 50 };
  datoNumero = { clave: '', valor: null };
  datoBoolean = { clave: '', valor: false };

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

  cancelarHistoriaClinica() {
    this.mostrarFormularioHistoriaClinica = false;
    // Opcional: resetear formulario
  }

  async guardarHistoriaClinica() {
    this.cargando.set(true);

    const datosDinamicos: DatoDinamicoTurnos[] = [
      ...this.datosTexto.map((d) => ({
        id: 0,
        clave: d.clave,
        valor: d.valor,
        citaId: this.registro.citaId,
      })),
      {
        id: 0,
        clave: this.datoSlider.clave,
        valor: this.datoSlider.valor.toString(),
        citaId: this.registro.citaId,
      },
      {
        id: 0,
        clave: this.datoNumero.clave,
        valor: (this.datoNumero.valor ?? 0).toString(),
        citaId: this.registro.citaId,
      },
      {
        id: 0,
        clave: this.datoBoolean.clave,
        valor: this.datoBoolean.valor ? 'Sí' : 'No',
        citaId: this.registro.citaId,
      },
    ].filter((d) => d.clave && d.valor);

    if (
      !this.registro.alturaCm ||
      !this.registro.pesoKg ||
      !this.registro.temperaturaC ||
      !this.registro.presionArterial?.trim() ||
      !this.datoSlider.clave.trim() ||
      !this.datoNumero.clave.trim() ||
      this.datoNumero.valor === null ||
      !this.datoBoolean.clave.trim()
    ) {
      this.snackBar.open('Completá todos los campos obligatorios', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    this.registro.citaId = this.cita.citaId;

    const res = await this.turnos.cargarHistoriaClinica(
      this.registro,
      datosDinamicos,
    );
    this.cargando.set(false);

    if (res.success) {
      this.snackBar.open('Historia clínica guardada', 'Cerrar', {
        duration: 3000,
      });
      this.accionRealizada.emit('historia_clinica');
      this.cerrar.emit();
    } else {
      this.snackBar.open(res.message ?? 'Error al guardar', 'Cerrar', {
        duration: 4000,
      });
    }
  }

  esFormularioHistoriaClinicaValido(): boolean {
    const r = this.registro;

    const sliderValido = this.datoSlider.clave.trim() !== '';
    const numeroValido =
      this.datoNumero.clave.trim() !== '' && this.datoNumero.valor !== null;
    const booleanoValido = this.datoBoolean.clave.trim() !== '';

    const datosTextoValidos = this.datosTexto.every((d) => {
      const clave = d.clave.trim();
      const valor = d.valor.trim();
      // Ambos deben estar completos o ambos vacíos (para evitar mitad cargados)
      return (clave && valor) || (!clave && !valor);
    });

    return (
      r.alturaCm !== null &&
      r.pesoKg !== null &&
      r.temperaturaC !== null &&
      !!r.presionArterial?.trim() &&
      sliderValido &&
      numeroValido &&
      booleanoValido &&
      datosTextoValidos
    );
  }

  cerrarModal() {
    this.cerrar.emit();
  }
}
