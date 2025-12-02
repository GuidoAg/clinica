import {
  Component,
  EventEmitter,
  Output,
  Input,
  signal,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule, FormBuilder } from "@angular/forms";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Turnos } from "../../../services/turnos";
import { CitaCompletaTurnos } from "../../../models/Turnos/CitaCompletaTurnos";
import { RegistroMedicoTurnos } from "../../../models/Turnos/RegistroMedicoTurnos";
import { DatoDinamicoTurnos } from "../../../models/Turnos/DatoDinamicoTurnos";
import { EstadoCita } from "../../../enums/EstadoCita";
import {
  RANGOS_MEDICOS,
  validarRango,
  validarPresionArterial,
  validarRegistroMedico,
} from "../../../helpers/validaciones-medicas";
import { ClickFueraPopup } from "../../../directivas/click-fuera-popup";

@Component({
  selector: "app-acciones-especialista",
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ClickFueraPopup],
  templateUrl: "./acciones-especialista.html",
  styleUrl: "./acciones-especialista.css",
})
export class AccionesEspecialista {
  @Input() cita!: CitaCompletaTurnos;
  @Output() cerrar = new EventEmitter<void>();
  @Output() accionRealizada = new EventEmitter<string>();

  private turnos = inject(Turnos);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  cargando = signal(false);

  readonly RANGOS_MEDICOS = RANGOS_MEDICOS;

  errorAltura = "";
  errorPeso = "";
  errorTemperatura = "";
  errorPresion = "";

  mostrarFormularioCancelar = false;
  mostrarFormularioRechazar = false;
  mostrarFormularioAceptar = false;
  mostrarFormularioFinalizar = false;
  mostrarFormularioResenia = false;
  mostrarFormularioHistoriaClinica = false;

  comentarioCancelar = "";
  comentarioRechazar = "";
  reseniaFinalizar = "";

  get puedeCancelar() {
    return (
      this.cita.estado !== EstadoCita.COMPLETADO &&
      this.cita.estado !== EstadoCita.CANCELADO &&
      this.cita.estado !== EstadoCita.ACEPTADO &&
      this.cita.estado !== EstadoCita.RECHAZADO &&
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
      this.cita.estado !== EstadoCita.COMPLETADO &&
      this.cita.estado !== EstadoCita.CANCELADO &&
      this.cita.estado !== EstadoCita.ACEPTADO &&
      this.cita.estado !== EstadoCita.RECHAZADO &&
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
      this.cita.estado !== EstadoCita.COMPLETADO &&
      this.cita.estado !== EstadoCita.CANCELADO &&
      this.cita.estado !== EstadoCita.ACEPTADO &&
      this.cita.estado !== EstadoCita.RECHAZADO &&
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
      this.cita.estado === EstadoCita.ACEPTADO &&
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
      this.cita.estado === EstadoCita.COMPLETADO &&
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
    presionArterial: "",
    citaId: 0,
  };

  datosTexto: { clave: string; valor: string }[] = [
    { clave: "", valor: "" },
    { clave: "", valor: "" },
    { clave: "", valor: "" },
  ];

  datoSlider = { clave: "", valor: 50 };
  datoNumero = { clave: "", valor: null };
  datoBoolean = { clave: "", valor: false };

  cancelarAccionCancelar() {
    this.mostrarFormularioCancelar = false;
    this.comentarioCancelar = "";
  }

  confirmarCancelarTurno() {
    if (!this.comentarioCancelar.trim()) return;

    this.cargando.set(true);
    this.turnos
      .cancelarCitaEspecialista(this.cita, this.comentarioCancelar.trim())
      .then((res) => {
        this.cargando.set(false);
        if (res.success) {
          this.snackBar.open("Turno cancelado exitosamente.", "Cerrar", {
            duration: 3000,
          });
          this.accionRealizada.emit("cancelado");
          this.cerrar.emit();
        } else {
          this.snackBar.open(res.message ?? "Ocurrió un error", "Cerrar", {
            duration: 4000,
          });
        }
      })
      .finally(() => {
        this.mostrarFormularioCancelar = false;
        this.comentarioCancelar = "";
      });
  }

  cancelarAccionRechazar() {
    this.mostrarFormularioRechazar = false;
    this.comentarioRechazar = "";
  }

  confirmarRechazarTurno() {
    if (!this.comentarioRechazar.trim()) return;

    this.cargando.set(true);
    this.turnos
      .rechazarCitaEspecialista(this.cita, this.comentarioRechazar.trim())
      .then((res) => {
        this.cargando.set(false);
        if (res.success) {
          this.snackBar.open("Turno rechazado exitosamente.", "Cerrar", {
            duration: 3000,
          });
          this.accionRealizada.emit("rechazado");
          this.cerrar.emit();
        } else {
          this.snackBar.open(res.message ?? "Ocurrió un error", "Cerrar", {
            duration: 4000,
          });
        }
      })
      .finally(() => {
        this.mostrarFormularioRechazar = false;
        this.comentarioRechazar = "";
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
          this.snackBar.open("Turno aceptado exitosamente.", "Cerrar", {
            duration: 3000,
          });
          this.accionRealizada.emit("aceptado");
          this.cerrar.emit();
        } else {
          this.snackBar.open(res.message ?? "Ocurrió un error", "Cerrar", {
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
    this.reseniaFinalizar = "";
  }

  confirmarFinalizarTurno() {
    if (!this.reseniaFinalizar.trim()) return;

    this.cargando.set(true);
    this.turnos
      .completarCitaEspecialista(this.cita, this.reseniaFinalizar.trim())
      .then((res) => {
        this.cargando.set(false);
        if (res.success) {
          this.snackBar.open("Turno finalizado exitosamente.", "Cerrar", {
            duration: 3000,
          });
          this.accionRealizada.emit("completado");
          this.cerrar.emit();
        } else {
          this.snackBar.open(res.message ?? "Ocurrió un error", "Cerrar", {
            duration: 4000,
          });
        }
      })
      .finally(() => {
        this.mostrarFormularioFinalizar = false;
        this.reseniaFinalizar = "";
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
  }

  async guardarHistoriaClinica() {
    const validacion = validarRegistroMedico(this.registro);
    if (!validacion.valido) {
      this.snackBar.open(validacion.errores.join(". "), "Cerrar", {
        duration: 5000,
      });
      return;
    }

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
        valor: this.datoBoolean.valor ? "Sí" : "No",
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
      this.snackBar.open("Completá todos los campos obligatorios", "Cerrar", {
        duration: 3000,
      });
      this.cargando.set(false);
      return;
    }

    this.registro.citaId = this.cita.citaId;

    const res = await this.turnos.cargarHistoriaClinica(
      this.registro,
      datosDinamicos,
    );
    this.cargando.set(false);

    if (res.success) {
      this.snackBar.open("Historia clínica guardada", "Cerrar", {
        duration: 3000,
      });
      this.accionRealizada.emit("historia_clinica");
      this.cerrar.emit();
    } else {
      this.snackBar.open(res.message ?? "Error al guardar", "Cerrar", {
        duration: 4000,
      });
    }
  }

  esFormularioHistoriaClinicaValido(): boolean {
    const r = this.registro;

    const sliderValido = this.datoSlider.clave.trim() !== "";
    const numeroValido =
      this.datoNumero.clave.trim() !== "" && this.datoNumero.valor !== null;
    const booleanoValido = this.datoBoolean.clave.trim() !== "";

    const datosTextoValidos = this.datosTexto.every((d) => {
      const clave = d.clave.trim();
      const valor = d.valor.trim();
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

  validarAltura() {
    const resultado = validarRango(
      this.registro.alturaCm,
      RANGOS_MEDICOS.altura,
    );
    this.errorAltura = resultado.valido ? "" : resultado.mensaje;
  }

  validarPeso() {
    const resultado = validarRango(this.registro.pesoKg, RANGOS_MEDICOS.peso);
    this.errorPeso = resultado.valido ? "" : resultado.mensaje;
  }

  validarTemperatura() {
    const resultado = validarRango(
      this.registro.temperaturaC,
      RANGOS_MEDICOS.temperatura,
    );
    this.errorTemperatura = resultado.valido ? "" : resultado.mensaje;
  }

  validarPresion() {
    const resultado = validarPresionArterial(this.registro.presionArterial);
    this.errorPresion = resultado.valido ? "" : resultado.mensaje;
  }
}
