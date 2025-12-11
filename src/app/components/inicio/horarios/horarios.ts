import {
  Component,
  WritableSignal,
  signal,
  Output,
  EventEmitter,
  Input,
  OnInit,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Disponibilidad } from "../../../services/disponibilidad-config";
import { DisponibilidadVisual } from "../../../models/disponibilidadVisual";
import { ClickFueraPopup } from "../../../directivas/click-fuera-popup";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
  selector: "app-horarios",
  imports: [CommonModule, FormsModule, ClickFueraPopup],
  templateUrl: "./horarios.html",
  styleUrl: "./horarios.css",
})
export class Horarios implements OnInit {
  @Input() perfilId!: number;

  @Output() cerrar = new EventEmitter<void>();

  dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  disponibilidades: WritableSignal<DisponibilidadVisual[]> = signal(
    Array.from({ length: 6 }, (_, i) => ({
      dia: i + 1,
      habilitado: false,
      horaDesde: i < 5 ? "08:00" : "08:00", // L-V: 8:00, Sábado: 8:00
      horaHasta: i < 5 ? "19:00" : "14:00", // L-V: 19:00, Sábado: 14:00
    })),
  );

  constructor(
    private disponibilidad: Disponibilidad,
    private snackBar: MatSnackBar,
  ) {}

  async ngOnInit() {
    if (!this.perfilId) {
      console.error("No se recibió perfilId en Horarios");
      return;
    }
    const cargas = await this.disponibilidad.obtenerDisponibilidades(
      this.perfilId,
    );
    // Filtrar solo los días de lunes a sábado (día 1 a 6)
    const disponibilidadesFiltradas = cargas.filter(
      (d) => d.dia >= 1 && d.dia <= 6,
    );
    this.disponibilidades.set(disponibilidadesFiltradas);
  }

  cerrarPopup() {
    this.cerrar.emit();
  }

  validarHorarios(): boolean {
    const disponibilidadesHabilitadas = this.disponibilidades().filter(
      (d) => d.habilitado,
    );

    for (const disp of disponibilidadesHabilitadas) {
      const nombreDia = this.dias[disp.dia - 1];

      // Validar que hora inicio sea menor que hora fin
      if (disp.horaDesde >= disp.horaHasta) {
        this.snackBar.open(
          `Error en ${nombreDia}: la hora de inicio debe ser menor que la hora de fin.`,
          "Cerrar",
          {
            duration: 4000,
            panelClass: ["bg-red-600", "text-white"],
          },
        );
        return false;
      }

      // Validar rangos horarios según el día
      const horaDesdeNum = parseInt(disp.horaDesde.split(":")[0]);
      const horaHastaNum = parseInt(disp.horaHasta.split(":")[0]);
      const minutoHasta = parseInt(disp.horaHasta.split(":")[1]);

      // Lunes a Viernes: 8:00 a 19:00
      if (disp.dia >= 1 && disp.dia <= 5) {
        if (
          horaDesdeNum < 8 ||
          horaHastaNum > 19 ||
          (horaHastaNum === 19 && minutoHasta > 0)
        ) {
          this.snackBar.open(
            `Error en ${nombreDia}: el horario debe estar entre 08:00 y 19:00.`,
            "Cerrar",
            {
              duration: 4000,
              panelClass: ["bg-red-600", "text-white"],
            },
          );
          return false;
        }
      }
      // Sábado: 8:00 a 14:00
      else if (disp.dia === 6) {
        if (
          horaDesdeNum < 8 ||
          horaHastaNum > 14 ||
          (horaHastaNum === 14 && minutoHasta > 0)
        ) {
          this.snackBar.open(
            `Error en ${nombreDia}: el horario debe estar entre 08:00 y 14:00.`,
            "Cerrar",
            {
              duration: 4000,
              panelClass: ["bg-red-600", "text-white"],
            },
          );
          return false;
        }
      }
    }
    return true;
  }

  esHorarioInvalido(disp: DisponibilidadVisual): boolean {
    return disp.habilitado && disp.horaDesde >= disp.horaHasta;
  }

  async guardar() {
    if (!this.perfilId) {
      console.error("No se recibió perfilId en Horarios");
      return;
    }

    if (!this.validarHorarios()) {
      return;
    }

    const exito = await this.disponibilidad.upsertDisponibilidades(
      this.perfilId,
      this.disponibilidades(),
    );

    if (exito) {
      this.cerrarPopup();
    } else {
      console.error("Error al guardar disponibilidades");
    }
  }
}
