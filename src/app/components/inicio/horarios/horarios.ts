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

@Component({
  selector: "app-horarios",
  imports: [CommonModule, FormsModule],
  templateUrl: "./horarios.html",
  styleUrl: "./horarios.css",
})
export class Horarios implements OnInit {
  @Input() perfilId!: number; // Recibimos el id desde el padre

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
      horaDesde: "",
      horaHasta: "",
    })),
  );

  constructor(private disponibilidad: Disponibilidad) {}

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

  async guardar() {
    if (!this.perfilId) {
      console.error("No se recibió perfilId en Horarios");
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
