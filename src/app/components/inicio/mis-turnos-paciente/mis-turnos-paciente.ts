import { Component, OnDestroy, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Turnos } from "../../../services/turnos";
import { CitaCompletaTurnos } from "../../../models/Turnos/CitaCompletaTurnos";
import { AuthSupabase } from "../../../services/auth-supabase";
import { Usuario } from "../../../models/Auth/Usuario";
import { Observable, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { AccionesPaciente } from "../acciones-paciente/acciones-paciente";
import { ColorEstado } from "../../../directivas/color-estado";

@Component({
  selector: "app-mis-turnos-paciente",
  imports: [CommonModule, FormsModule, AccionesPaciente, ColorEstado],
  templateUrl: "./mis-turnos-paciente.html",
  styleUrl: "./mis-turnos-paciente.css",
})
export class MisTurnosPaciente implements OnInit, OnDestroy {
  usuario$: Observable<Usuario | null>;
  usuarioActual: Usuario | null = null;
  private destroy$ = new Subject<void>();

  citas = signal<CitaCompletaTurnos[]>([]);
  filaExpandida = signal<number | null>(null);
  cargando = signal(true);
  citaSeleccionada = signal<CitaCompletaTurnos | null>(null);

  mostrarPopupAcciones = false;

  readonly columnas = [
    { key: "citaId", label: "ID" },
    { key: "fechaHora", label: "Fecha/Hora" },
    { key: "estado", label: "Estado" },
    { key: "alturaCm", label: "Altura (cm)" },
    { key: "pesoKg", label: "Peso (kg)" },
    { key: "temperaturaC", label: "Temp (°C)" },
    { key: "presionArterial", label: "Presión" },
    { key: "pacienteNombreCompleto", label: "Paciente" },
    { key: "especialistaNombreCompleto", label: "Especialista" },
    { key: "especialidadNombre", label: "Especialidad" },
  ];

  readonly columnasConDatosDinamicos = [
    ...this.columnas,
    { key: "datosDinamicos", label: "Datos dinámicos" },
  ];

  constructor(
    private turnosService: Turnos,
    private authSupabase: AuthSupabase,
  ) {
    this.usuario$ = this.authSupabase.user$;
  }

  // Filtro seleccionado y valor del filtro
  filtroColumna = signal<string | null>(null);
  private _filtroValor = signal("");

  // getter y setter para bindear con ngModel
  get filtroValorModel(): string {
    return this._filtroValor();
  }
  set filtroValorModel(value: string) {
    this._filtroValor.set(value);
  }

  async ngOnInit() {
    this.usuario$.pipe(takeUntil(this.destroy$)).subscribe((usuario) => {
      if (!usuario) {
        this.usuarioActual = null;
        return;
      }

      usuario.id =
        typeof usuario.id === "string" ? Number(usuario.id) : usuario.id;
      this.usuarioActual = usuario;
      this.cargarCitas(); //llamada aquí
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async cargarCitas() {
    this.cargando.set(true);

    try {
      if (this.usuarioActual?.id != null) {
        const datos = await this.turnosService.obtenerCitasPaciente(
          this.usuarioActual.id,
        );
        this.citas.set(datos);
      }
    } catch (e) {
      console.error("Error al obtener citas", e);
    } finally {
      this.cargando.set(false);
    }
  }

  toggleFilaExpandida(citaId: number) {
    this.filaExpandida.set(this.filaExpandida() === citaId ? null : citaId);
  }

  activarFiltro(columna: string) {
    this.filtroColumna.set(columna);
    this._filtroValor.set("");
  }

  // Computed para devolver la lista filtrada según columna y valor
  get citasFiltradas(): CitaCompletaTurnos[] {
    // const filtroCol = this.filtroColumna();
    const filtroVal = this._filtroValor().toLowerCase();

    if (filtroVal.trim() === "") {
      return this.citas();
    }

    return this.citas().filter((cita) => {
      const valorCampo = JSON.stringify(cita); //cita[filtroCol as keyof CitaCompletaTurnos];

      //   if (valorCampo == null) return false;

      //   if (valorCampo instanceof Date) {
      //     // Filtrar fecha con formato corto
      //     return valorCampo.toLocaleString().toLowerCase().includes(filtroVal);
      //   }

      return valorCampo.toString().toLowerCase().includes(filtroVal);
    });
  }

  get filtroColumnaLabel(): string {
    const col = this.columnas.find((c) => c.key === this.filtroColumna());
    return col?.label ?? "";
  }

  limpiarFiltro() {
    this.filtroColumna.set("");
    this._filtroValor.set("");
  }

  mostrarAcciones() {
    this.filtroColumna.set("");
    this._filtroValor.set("");
  }

  abrirPopupAcciones(cita: CitaCompletaTurnos) {
    this.citaSeleccionada.set(cita);
    this.mostrarPopupAcciones = true;
  }

  cerrarPopupAcciones() {
    this.mostrarPopupAcciones = false;
    this.citaSeleccionada.set(null);
  }

  accionDesdeModal() {
    this.cerrarPopupAcciones();
    this.cargarCitas(); // ✅ recarga los turnos
  }
}
