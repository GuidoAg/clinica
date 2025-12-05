import {
  Component,
  EventEmitter,
  Output,
  Input,
  signal,
  OnInit,
} from "@angular/core";

import { FormsModule } from "@angular/forms";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Turnos } from "../../../services/turnos";
import { CitaCompletaTurnos } from "../../../models/Turnos/CitaCompletaTurnos";
import { ClickFueraPopup } from "../../../directivas/click-fuera-popup";
import { EstadoCita } from "../../../enums/EstadoCita";
import { EncuestaPaciente } from "../encuesta-paciente/encuesta-paciente";
import { Supabase } from "../../../supabase";
import { TABLA } from "../../../constantes";
import { EncuestaPaciente as EncuestaPacienteModel } from "../../../models/SupaBase/EncuestaPaciente";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-acciones-paciente",
  standalone: true,
  imports: [CommonModule, FormsModule, ClickFueraPopup, EncuestaPaciente],
  templateUrl: "./acciones-paciente.html",
})
export class AccionesPaciente implements OnInit {
  @Input() cita!: CitaCompletaTurnos;
  @Input() pacienteId!: number;
  @Output() cerrar = new EventEmitter<void>();
  @Output() accionRealizada = new EventEmitter<string>();

  cargando = signal(false);
  verificandoEncuesta = signal(true);

  mostrarFormularioCancelar = false;
  mostrarFormularioCalificar = false;
  mostrarFormularioResenia = false;
  mostrarFormularioEncuesta = false;
  mostrarVistaEncuesta = false;
  mostrarVistaComentarioPaciente = false;

  encuestaExistente: EncuestaPacienteModel | null = null;

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
  comentarioCalificar = "";

  constructor(
    private turnos: Turnos,
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
      this.cita.estado !== EstadoCita.RECHAZADO &&
      !this.mostrarFormularioCancelar &&
      !this.mostrarFormularioCalificar &&
      !this.mostrarFormularioResenia &&
      !this.mostrarVistaEncuesta &&
      !this.mostrarVistaComentarioPaciente
    );
  }

  get puedeVerResenia() {
    // Solo si el especialista canceló, rechazó o finalizó el turno Y dejó reseña
    return (
      (this.cita.estado === EstadoCita.CANCELADO ||
        this.cita.estado === EstadoCita.RECHAZADO ||
        this.cita.estado === EstadoCita.COMPLETADO) &&
      !!this.cita.resenia &&
      this.cita.resenia.trim().length > 0
    );
  }

  get puedeCalificar() {
    const tieneComentario =
      this.cita.comentarioPaciente &&
      this.cita.comentarioPaciente.trim().length > 0;
    return (
      this.cita.estado === EstadoCita.COMPLETADO &&
      !tieneComentario &&
      !this.mostrarFormularioCalificar &&
      !this.mostrarFormularioCancelar
    );
  }

  get puedeVerComentarioPaciente() {
    // Puede ver su comentario si canceló o si calificó la atención (turno completado)
    return (
      (this.cita.estado === EstadoCita.CANCELADO ||
        this.cita.estado === EstadoCita.COMPLETADO) &&
      !!this.cita.comentarioPaciente &&
      this.cita.comentarioPaciente.trim().length > 0 &&
      !this.mostrarFormularioCancelar &&
      !this.mostrarFormularioCalificar &&
      !this.mostrarFormularioResenia &&
      !this.mostrarVistaEncuesta
    );
  }

  get puedeCargarEncuesta() {
    return (
      this.cita.estado === EstadoCita.COMPLETADO &&
      !!this.cita.resenia &&
      this.cita.resenia.trim().length > 0 &&
      !this.encuestaExistente &&
      !this.mostrarFormularioCalificar &&
      !this.mostrarFormularioCancelar &&
      !this.mostrarFormularioResenia
    );
  }

  get puedeVerEncuesta() {
    return (
      this.cita.estado === EstadoCita.COMPLETADO &&
      !!this.encuestaExistente &&
      !this.mostrarFormularioCalificar &&
      !this.mostrarFormularioCancelar &&
      !this.mostrarFormularioResenia
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
      .cancelarCitaPaciente(this.cita, this.comentarioCancelar.trim())
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

  cancelarAccionCalificar() {
    this.mostrarFormularioCalificar = false;
    this.comentarioCalificar = "";
  }

  confirmarCalificarAtencion() {
    if (!this.comentarioCalificar.trim()) {
      this.snackBar.open(
        "Por favor, ingresá un comentario antes de enviar.",
        "Cerrar",
        {
          duration: 3000,
          panelClass: ["bg-red-600", "text-white"],
        },
      );
      return;
    }

    this.cargando.set(true);
    this.turnos
      .cargarComentarioAtencion(this.cita, this.comentarioCalificar.trim())
      .then((res) => {
        this.cargando.set(false);
        if (res.success) {
          this.snackBar.open("Atención calificada exitosamente.", "Cerrar", {
            duration: 3000,
          });
          this.accionRealizada.emit("calificacion");
          this.cerrar.emit();
        } else {
          this.snackBar.open(res.message ?? "Ocurrió un error", "Cerrar", {
            duration: 4000,
          });
        }
      })
      .finally(() => {
        this.mostrarFormularioCalificar = false;
        this.comentarioCalificar = "";
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

  abrirEncuesta() {
    this.mostrarFormularioEncuesta = true;
  }

  cerrarEncuesta() {
    this.mostrarFormularioEncuesta = false;
  }

  verEncuesta() {
    this.mostrarVistaEncuesta = true;
  }

  volverDesdeVistaEncuesta() {
    this.mostrarVistaEncuesta = false;
  }

  async onEncuestaEnviada() {
    this.mostrarFormularioEncuesta = false;
    await this.verificarEncuestaExistente();
    this.accionRealizada.emit("encuesta");
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
