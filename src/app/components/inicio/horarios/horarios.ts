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
import { Disponibilidad } from "../../../services/disponibilidad";
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

  dias = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];

  disponibilidades: WritableSignal<DisponibilidadVisual[]> = signal(
    Array.from({ length: 7 }, (_, i) => ({
      dia: i + 1,
      habilitado: false,
      horaDesde: "09:00",
      horaHasta: "17:00",
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
    this.disponibilidades.set(cargas);
  }

  cerrarPopup() {
    this.cerrar.emit();
  }

  validarHorarios(): boolean {
    const disponibilidadesHabilitadas = this.disponibilidades().filter(
      (d) => d.habilitado,
    );

    for (const disp of disponibilidadesHabilitadas) {
      if (disp.horaDesde >= disp.horaHasta) {
        const nombreDia = this.dias[disp.dia - 1];
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
