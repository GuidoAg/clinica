import { Component, OnDestroy, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Turnos } from "../../../services/turnos";
import { CitaCompletaTurnos } from "../../../models/Turnos/CitaCompletaTurnos";
import { AuthSupabase } from "../../../services/auth-supabase";
import { Usuario } from "../../../models/Auth/Usuario";
import { Observable, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { AccionesAdmin } from "../acciones-admin/acciones-admin";
import { ColorEstado } from "../../../directivas/color-estado";
import { filtrarCitas } from "../../../helpers/filtrar-citas";
import { UnidadMedidaPipe } from "../../../pipes/unidad-medida-pipe";
import { LoadingOverlayService } from "../../../services/loading-overlay-service";
import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger,
} from "@angular/animations";

@Component({
  selector: "app-tabla-turnos",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AccionesAdmin,
    ColorEstado,
    UnidadMedidaPipe,
  ],
  templateUrl: "./tabla-turnos.html",
  styleUrl: "./tabla-turnos.css",
  animations: [
    trigger("fadeInRow", [
      transition(":enter", [
        style({ opacity: 0, transform: "translateY(-10px)" }),
        animate(
          "300ms ease-out",
          style({ opacity: 1, transform: "translateY(0)" }),
        ),
      ]),
    ]),
    trigger("listStagger", [
      transition(":enter", [
        query(
          ":enter",
          [
            style({ opacity: 0, transform: "translate(-20px, -10px)" }),
            stagger(50, [
              animate(
                "300ms ease-out",
                style({ opacity: 1, transform: "translate(0, 0)" }),
              ),
            ]),
          ],
          { optional: true },
        ),
      ]),
    ]),
    trigger("expandCollapse", [
      transition(":enter", [
        style({ height: "0", opacity: 0, overflow: "hidden" }),
        animate("350ms ease-out", style({ height: "*", opacity: 1 })),
      ]),
      transition(":leave", [
        style({ height: "*", opacity: 1 }),
        animate("250ms ease-in", style({ height: "0", opacity: 0 })),
      ]),
    ]),
  ],
})
export class TablaTurnos implements OnInit, OnDestroy {
  usuario$: Observable<Usuario | null>;
  usuarioActual: Usuario | null = null;
  private destroy$ = new Subject<void>();

  citas = signal<CitaCompletaTurnos[]>([]);
  filaExpandida = signal<number | null>(null);
  cargando = signal(true);
  citaSeleccionada = signal<CitaCompletaTurnos | null>(null);
  ordenamiento = signal<"fecha" | "estado" | null>("fecha");
  mostrarFilas = signal(false);

  mostrarPopupAcciones = false;

  readonly columnas = [
    { key: "citaId", label: "ID" },
    { key: "fechaHora", label: "Fecha/Hora" },
    { key: "estado", label: "Estado" },
    { key: "alturaCm", label: "Altura" },
    { key: "pesoKg", label: "Peso" },
    { key: "temperaturaC", label: "Temperatura" },
    { key: "presionArterial", label: "Presión arterial" },
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
    private loading: LoadingOverlayService,
  ) {
    this.usuario$ = this.authSupabase.user$;
  }

  private _filtroValor = signal("");
  private _filtroTimeout: ReturnType<typeof setTimeout> | null = null;

  get filtroValorModel(): string {
    return this._filtroValor();
  }
  set filtroValorModel(value: string) {
    this._filtroValor.set(value);

    if (this._filtroTimeout) {
      clearTimeout(this._filtroTimeout);
    }
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
      this.cargarCitas();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async cargarCitas() {
    this.cargando.set(true);
    this.mostrarFilas.set(false);

    try {
      if (this.usuarioActual?.id != null) {
        const datos = await this.turnosService.obtenerCitasConRegistro();
        this.citas.set(datos);
      }
    } catch (e) {
      console.error("Error al obtener citas", e);
    } finally {
      this.cargando.set(false);
      setTimeout(() => {
        this.mostrarFilas.set(true);
      }, 10);
      this.loading.hide();
    }
  }

  toggleFilaExpandida(citaId: number) {
    this.filaExpandida.set(this.filaExpandida() === citaId ? null : citaId);
  }

  get citasFiltradas(): CitaCompletaTurnos[] {
    let resultado = filtrarCitas(this.citas(), this._filtroValor());

    const orden = this.ordenamiento();
    if (orden === "fecha") {
      resultado = [...resultado].sort(
        (a, b) =>
          new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime(),
      );
    } else if (orden === "estado") {
      resultado = [...resultado].sort((a, b) =>
        a.estado.localeCompare(b.estado),
      );
    }

    return resultado;
  }

  limpiarFiltro() {
    this._filtroValor.set("");
    this.mostrarFilas.set(false);
    setTimeout(() => {
      this.mostrarFilas.set(true);
    }, 10);
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
    this.cargarCitas();
  }

  ordenarPorFecha() {
    this.ordenamiento.set("fecha");
    this.mostrarFilas.set(false);
    setTimeout(() => {
      this.mostrarFilas.set(true);
    }, 10);
  }

  ordenarPorEstado() {
    this.ordenamiento.set("estado");
    this.mostrarFilas.set(false);
    setTimeout(() => {
      this.mostrarFilas.set(true);
    }, 10);
  }
}
