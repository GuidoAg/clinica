import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Usuario } from "../../../models/Auth/Usuario";
import { UsuariosService } from "../../../services/usuarios";
import { Subject } from "rxjs";
import { AltasAdmin } from "../altas-admin/altas-admin";
import { LoadingOverlayService } from "../../../services/loading-overlay-service";
import { TrackImage } from "../../../directivas/track-image";
import { LoadingWrapper } from "../../loading-wrapper/loading-wrapper";
import { ExportarExcel } from "../../../services/exportar-excel";
import { formatearUsuariosParaExcel } from "../../../helpers/exportar-usuarios";
import { formatearTurnosPacienteParaExcel } from "../../../helpers/exportar-turnos-paciente";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Turnos } from "../../../services/turnos";
import { trigger, transition, style, animate } from "@angular/animations";

@Component({
  selector: "app-usuarios",
  standalone: true,
  imports: [CommonModule, AltasAdmin, TrackImage, LoadingWrapper],
  templateUrl: "./usuarios.html",
  styleUrls: ["./usuarios.css"],
  animations: [
    trigger("scaleIn", [
      transition(":enter", [
        style({ transform: "scale(0.3)", opacity: 0 }),
        animate("600ms ease-out", style({ transform: "scale(1)", opacity: 1 })),
      ]),
    ]),
  ],
})
export class Usuarios implements OnInit, OnDestroy {
  solapaActiva: "pacientes" | "especialistas" | "administradores" = "pacientes";

  pacientes: Usuario[] = [];
  especialistas: Usuario[] = [];
  administradores: Usuario[] = [];

  usuarioSeleccionado: Usuario | null = null;

  private destroy$ = new Subject<void>();

  mostrarPopupAltas = false;

  constructor(
    private usuariosService: UsuariosService,
    private loading: LoadingOverlayService,
    private exportarExcel: ExportarExcel,
    private snackBar: MatSnackBar,
    private turnosService: Turnos,
  ) {}

  ngOnInit(): void {
    this.recargarUsuarios();
    this.loading.hide();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async recargarUsuarios(): Promise<void> {
    const todos = await this.usuariosService.obtenerTodosUsuarios();

    this.pacientes = todos.filter((u) => u.rol === "paciente");
    this.especialistas = todos.filter((u) => u.rol === "especialista");
    this.administradores = todos.filter((u) => u.rol === "admin");
  }

  seleccionarUsuario(usuario: Usuario): void {
    this.usuarioSeleccionado = usuario;
  }

  async toggleValidadoAdmin(usuario: Usuario): Promise<void> {
    if (usuario.rol !== "especialista") return;

    const nuevoEstado = !usuario.validadoAdmin;
    const ok = await this.usuariosService.actualizarEstadoEspecialista(
      usuario.id,
      nuevoEstado,
    );

    if (ok) {
      usuario.validadoAdmin = nuevoEstado;
      await this.recargarUsuarios();
    }
  }

  abrirPopupAltas() {
    this.mostrarPopupAltas = true;
  }

  cerrarPopupAltas() {
    this.mostrarPopupAltas = false;
  }

  async onAltaExitosa() {
    await this.recargarUsuarios();
    this.cerrarPopupAltas();
  }

  async exportarUsuariosAExcel() {
    try {
      // Obtener todos los usuarios juntos
      const todosLosUsuarios = [
        ...this.pacientes,
        ...this.especialistas,
        ...this.administradores,
      ];

      if (todosLosUsuarios.length === 0) {
        this.snackBar.open("No hay usuarios para exportar.", "Cerrar", {
          duration: 3000,
        });
        return;
      }

      // Ordenar por rol (admin -> especialista -> paciente)
      const ordenRoles: Record<string, number> = {
        admin: 1,
        especialista: 2,
        paciente: 3,
      };

      todosLosUsuarios.sort((a, b) => {
        return ordenRoles[a.rol] - ordenRoles[b.rol];
      });

      // Formatear datos para Excel
      const datosFormateados = formatearUsuariosParaExcel(todosLosUsuarios);

      // Exportar a Excel
      await this.exportarExcel.exportarAExcel(datosFormateados, {
        titulo: "Listado de Usuarios",
        nombreArchivo: "usuarios_completo",
        nombreHoja: "Usuarios",
        incluirFecha: true,
      });

      this.snackBar.open(
        `${todosLosUsuarios.length} usuarios exportados exitosamente.`,
        "Cerrar",
        {
          duration: 3000,
        },
      );
    } catch (error) {
      console.error("Error al exportar usuarios:", error);
      this.snackBar.open("Error al exportar usuarios a Excel.", "Cerrar", {
        duration: 4000,
      });
    }
  }

  async exportarTurnosPaciente(paciente: Usuario, event: Event) {
    // Evitar que se propague el evento y se seleccione el usuario
    event.stopPropagation();

    try {
      // Obtener todos los turnos del paciente
      const turnos = await this.turnosService.obtenerCitasPaciente(paciente.id);

      if (turnos.length === 0) {
        this.snackBar.open(
          `${paciente.nombre} ${paciente.apellido} no tiene turnos registrados.`,
          "Cerrar",
          {
            duration: 3000,
          },
        );
        return;
      }

      // Formatear datos para Excel
      const datosFormateados = formatearTurnosPacienteParaExcel(turnos);

      // Exportar a Excel
      await this.exportarExcel.exportarAExcel(datosFormateados, {
        titulo: `Historial de Turnos - ${paciente.nombre} ${paciente.apellido}`,
        nombreArchivo: `turnos_${paciente.nombre}_${paciente.apellido}`,
        nombreHoja: "Turnos",
        incluirFecha: true,
      });

      this.snackBar.open(
        `${turnos.length} turnos exportados exitosamente.`,
        "Cerrar",
        {
          duration: 3000,
        },
      );
    } catch (error) {
      console.error("Error al exportar turnos del paciente:", error);
      this.snackBar.open("Error al exportar turnos del paciente.", "Cerrar", {
        duration: 4000,
      });
    }
  }
}
