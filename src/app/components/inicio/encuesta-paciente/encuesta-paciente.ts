import { Component, EventEmitter, Output, Input, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ClickFueraPopup } from "../../../directivas/click-fuera-popup";
import { CitaCompletaTurnos } from "../../../models/Turnos/CitaCompletaTurnos";
import { Supabase } from "../../../supabase";
import { TABLA } from "../../../constantes";

@Component({
  selector: "app-encuesta-paciente",
  standalone: true,
  imports: [CommonModule, FormsModule, ClickFueraPopup],
  templateUrl: "./encuesta-paciente.html",
  styleUrl: "./encuesta-paciente.css",
})
export class EncuestaPaciente {
  @Input() cita!: CitaCompletaTurnos;
  @Input() pacienteId!: number;
  @Output() cerrar = new EventEmitter<void>();
  @Output() encuestaEnviada = new EventEmitter<void>();

  cargando = signal(false);

  // Pregunta 1: Experiencia general (textarea)
  experienciaGeneral = "";

  // Pregunta 2: Calificación en estrellas (1-5)
  calificacionEstrellas = 0;
  estrellasHover = 0;

  // Pregunta 3: Radio button con 5 opciones
  opcionesRadio = [
    { valor: "excelente", etiqueta: "Excelente" },
    { valor: "muy-bueno", etiqueta: "Muy bueno" },
    { valor: "bueno", etiqueta: "Bueno" },
    { valor: "regular", etiqueta: "Regular" },
    { valor: "malo", etiqueta: "Malo" },
  ];
  seleccionRadio = "";

  // Pregunta 4: Checkboxes (8 opciones)
  opcionesCheckbox = [
    { valor: "puntualidad", etiqueta: "Puntualidad", seleccionado: false },
    {
      valor: "profesionalismo",
      etiqueta: "Profesionalismo",
      seleccionado: false,
    },
    {
      valor: "claridad",
      etiqueta: "Claridad en las explicaciones",
      seleccionado: false,
    },
    { valor: "empatia", etiqueta: "Empatía", seleccionado: false },
    {
      valor: "instalaciones",
      etiqueta: "Instalaciones limpias",
      seleccionado: false,
    },
    {
      valor: "tiempo-espera",
      etiqueta: "Poco tiempo de espera",
      seleccionado: false,
    },
    { valor: "seguimiento", etiqueta: "Buen seguimiento", seleccionado: false },
    { valor: "recomendaria", etiqueta: "Lo recomendaría", seleccionado: false },
  ];

  // Pregunta 5: Rango 1-100
  valorRango = 50;

  constructor(private snackBar: MatSnackBar) {}

  setCalificacion(estrellas: number) {
    this.calificacionEstrellas = estrellas;
  }

  setHover(estrellas: number) {
    this.estrellasHover = estrellas;
  }

  getCheckboxSeleccionados(): string {
    return this.opcionesCheckbox
      .filter((opcion) => opcion.seleccionado)
      .map((opcion) => opcion.valor)
      .join(",");
  }

  validarFormulario(): boolean {
    if (!this.experienciaGeneral.trim()) {
      this.snackBar.open(
        "Por favor, comparta su experiencia general.",
        "Cerrar",
        {
          duration: 3000,
          panelClass: ["bg-red-600", "text-white"],
        },
      );
      return false;
    }

    if (this.calificacionEstrellas === 0) {
      this.snackBar.open(
        "Por favor, seleccione una calificación en estrellas.",
        "Cerrar",
        {
          duration: 3000,
          panelClass: ["bg-red-600", "text-white"],
        },
      );
      return false;
    }

    if (!this.seleccionRadio) {
      this.snackBar.open(
        "Por favor, seleccione una opción de satisfacción general.",
        "Cerrar",
        {
          duration: 3000,
          panelClass: ["bg-red-600", "text-white"],
        },
      );
      return false;
    }

    const checkboxSeleccionados = this.getCheckboxSeleccionados();
    if (!checkboxSeleccionados) {
      this.snackBar.open(
        "Por favor, seleccione al menos un aspecto destacado.",
        "Cerrar",
        {
          duration: 3000,
          panelClass: ["bg-red-600", "text-white"],
        },
      );
      return false;
    }

    return true;
  }

  async enviarEncuesta() {
    if (!this.validarFormulario()) {
      return;
    }

    this.cargando.set(true);

    try {
      const { error } = await Supabase.from(TABLA.ENCUESTAS_PACIENTES).insert([
        {
          idPaciente: this.pacienteId,
          idEspecialista: this.cita.especialistaId,
          idCita: this.cita.citaId,
          especialidad: this.cita.especialidadNombre,
          textBox: this.experienciaGeneral.trim(),
          estrellas: this.calificacionEstrellas,
          radioButton: this.seleccionRadio,
          checkBox: this.getCheckboxSeleccionados(),
          rango: this.valorRango,
        },
      ]);

      if (error) {
        console.error("Error al guardar encuesta:", error);
        this.snackBar.open(
          "Ocurrió un error al enviar la encuesta.",
          "Cerrar",
          {
            duration: 4000,
            panelClass: ["bg-red-600", "text-white"],
          },
        );
        return;
      }

      this.snackBar.open("Encuesta enviada exitosamente. ¡Gracias!", "Cerrar", {
        duration: 3000,
        panelClass: ["bg-green-600", "text-white"],
      });

      this.encuestaEnviada.emit();
      this.cerrarModal();
    } catch (e) {
      console.error("Error inesperado:", e);
      this.snackBar.open("Ocurrió un error inesperado.", "Cerrar", {
        duration: 4000,
        panelClass: ["bg-red-600", "text-white"],
      });
    } finally {
      this.cargando.set(false);
    }
  }

  cerrarModal() {
    this.cerrar.emit();
  }
}
