import {
  Component,
  EventEmitter,
  Output,
  Input,
  signal,
  OnInit,
} from "@angular/core";

import { FormsModule, ReactiveFormsModule, FormBuilder } from "@angular/forms";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Turnos } from "../../../services/turnos";
import { CitaCompletaTurnos } from "../../../models/Turnos/CitaCompletaTurnos";
import { ClickFueraPopup } from "../../../directivas/click-fuera-popup";
import { EstadoCita } from "../../../enums/EstadoCita";
import { Supabase } from "../../../supabase";
import { TABLA } from "../../../constantes";
import { EncuestaPaciente } from "../../../models/SupaBase/EncuestaPaciente";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-acciones-admin",
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ClickFueraPopup],
  templateUrl: "./acciones-admin.html",
  styleUrl: "./acciones-admin.css",
})
export class AccionesAdmin implements OnInit {
  @Input() cita!: CitaCompletaTurnos;
  @Output() cerrar = new EventEmitter<void>();
  @Output() accionRealizada = new EventEmitter<string>();

  cargando = signal(false);
  verificandoEncuesta = signal(true);

  mostrarFormularioCancelar = false;
  mostrarFormularioResenia = false;
  mostrarVistaComentarioPaciente = false;
  mostrarVistaComentarioEspecialista = false;
  mostrarVistaEncuesta = false;

  encuestaExistente: EncuestaPaciente | null = null;

  // Mapeo de valores a etiquetas
  private readonly opcionesRadioMap: Record<string, string> = {
    excelente: "Excelente",
    "muy-bueno": "Muy bueno",
    bueno: "Bueno",
    regular: "Regular",
    malo: "Malo",
  };

  private readonly opcionesCheckboxMap: Record<string, string> = {
    puntualidad: "Puntualidad",
    profesionalismo: "Profesionalismo",
    claridad: "Claridad en las explicaciones",
    empatia: "Empatía",
    instalaciones: "Instalaciones limpias",
    "tiempo-espera": "Poco tiempo de espera",
    seguimiento: "Buen seguimiento",
    recomendaria: "Lo recomendaría",
  };

  comentarioCancelar = "";

  constructor(
    private turnos: Turnos,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
  ) {}

  async ngOnInit() {
    await this.verificarEncuestaExistente();
  }

  async verificarEncuestaExistente() {
    this.verificandoEncuesta.set(true);
    try {
      const { data, error } = await Supabase.from(TABLA.ENCUESTAS_PACIENTES)
        .select("*")
        .eq("idCita", this.cita.citaId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error al verificar encuesta:", error);
        return;
      }

      this.encuestaExistente = data;
    } catch (e) {
      console.error("Error inesperado al verificar encuesta:", e);
    } finally {
      this.verificandoEncuesta.set(false);
    }
  }

  get puedeCancelar() {
    return (
      this.cita.estado !== EstadoCita.COMPLETADO &&
      this.cita.estado !== EstadoCita.CANCELADO &&
      this.cita.estado !== EstadoCita.ACEPTADO &&
      this.cita.estado !== EstadoCita.RECHAZADO &&
      !this.mostrarFormularioCancelar &&
      !this.mostrarFormularioResenia &&
      !this.mostrarVistaComentarioPaciente &&
      !this.mostrarVistaComentarioEspecialista &&
      !this.mostrarVistaEncuesta
    );
  }

  get puedeVerResenia() {
    return (
      this.cita.estado === EstadoCita.COMPLETADO &&
      !!this.cita.resenia &&
      this.cita.resenia.trim().length > 0 &&
      !this.mostrarFormularioCancelar &&
      !this.mostrarFormularioResenia &&
      !this.mostrarVistaComentarioPaciente &&
      !this.mostrarVistaComentarioEspecialista &&
      !this.mostrarVistaEncuesta
    );
  }

  get puedeVerComentarioPaciente() {
    // Puede ver comentario del paciente si este canceló o calificó la atención
    return (
      (this.cita.estado === EstadoCita.CANCELADO ||
        this.cita.estado === EstadoCita.COMPLETADO) &&
      !!this.cita.comentarioPaciente &&
      this.cita.comentarioPaciente.trim().length > 0 &&
      !this.mostrarFormularioCancelar &&
      !this.mostrarFormularioResenia &&
      !this.mostrarVistaComentarioPaciente &&
      !this.mostrarVistaComentarioEspecialista &&
      !this.mostrarVistaEncuesta
    );
  }

  get puedeVerComentarioEspecialista() {
    // Puede ver comentario del especialista si este canceló o rechazó el turno
    return (
      (this.cita.estado === EstadoCita.CANCELADO ||
        this.cita.estado === EstadoCita.RECHAZADO) &&
      !!this.cita.comentarioEspecialista &&
      this.cita.comentarioEspecialista.trim().length > 0 &&
      !this.mostrarFormularioCancelar &&
      !this.mostrarFormularioResenia &&
      !this.mostrarVistaComentarioPaciente &&
      !this.mostrarVistaComentarioEspecialista &&
      !this.mostrarVistaEncuesta
    );
  }

  get puedeVerEncuesta() {
    return (
      this.cita.estado === EstadoCita.COMPLETADO &&
      !!this.encuestaExistente &&
      !this.mostrarFormularioCancelar &&
      !this.mostrarFormularioResenia &&
      !this.mostrarVistaComentarioPaciente &&
      !this.mostrarVistaComentarioEspecialista &&
      !this.mostrarVistaEncuesta
    );
  }

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

  verResenia() {
    this.mostrarFormularioResenia = true;
  }

  volverDesdeVistaResenia() {
    this.mostrarFormularioResenia = false;
  }

  verComentarioPaciente() {
    this.mostrarVistaComentarioPaciente = true;
  }

  volverDesdeVistaComentarioPaciente() {
    this.mostrarVistaComentarioPaciente = false;
  }

  verComentarioEspecialista() {
    this.mostrarVistaComentarioEspecialista = true;
  }

  volverDesdeVistaComentarioEspecialista() {
    this.mostrarVistaComentarioEspecialista = false;
  }

  verEncuesta() {
    this.mostrarVistaEncuesta = true;
  }

  volverDesdeVistaEncuesta() {
    this.mostrarVistaEncuesta = false;
  }

  obtenerEtiquetaRadio(valor: string | null): string {
    if (!valor) return "Sin respuesta";
    return this.opcionesRadioMap[valor] || valor;
  }

  obtenerEtiquetasCheckbox(valores: string | null): string[] {
    if (!valores) return [];
    return valores
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v)
      .map((v) => this.opcionesCheckboxMap[v] || v);
  }

  cerrarModal() {
    this.cerrar.emit();
  }
}
