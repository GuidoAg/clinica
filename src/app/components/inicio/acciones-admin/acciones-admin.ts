import { Component, EventEmitter, Output, Input, signal } from "@angular/core";

import { FormsModule, ReactiveFormsModule, FormBuilder } from "@angular/forms";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Turnos } from "../../../services/turnos";
import { CitaCompletaTurnos } from "../../../models/Turnos/CitaCompletaTurnos";
import { ClickFueraPopup } from "../../../directivas/click-fuera-popup";

@Component({
  selector: "app-acciones-admin",
  imports: [FormsModule, ReactiveFormsModule, ClickFueraPopup],
  templateUrl: "./acciones-admin.html",
  styleUrl: "./acciones-admin.css",
})
export class AccionesAdmin {
  @Input() cita!: CitaCompletaTurnos;
  @Output() cerrar = new EventEmitter<void>();
  @Output() accionRealizada = new EventEmitter<string>();

  cargando = signal(false);

  mostrarFormularioCancelar = false;
  mostrarFormularioResenia = false;

  comentarioCancelar = "";

  constructor(
    private turnos: Turnos,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
  ) {}

  get puedeCancelar() {
    return (
      this.cita.estado !== "completado" &&
      this.cita.estado !== "cancelado" &&
      this.cita.estado !== "aceptado" &&
      this.cita.estado !== "rechazado" &&
      !this.mostrarFormularioCancelar
    );
  }

  get puedeVerResenia() {
    return !!this.cita.resenia && this.cita.resenia.trim().length > 0;
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

  cerrarModal() {
    this.cerrar.emit();
  }
}
