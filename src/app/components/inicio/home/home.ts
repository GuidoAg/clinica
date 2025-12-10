import {
  Component,
  OnInit,
  ViewChild,
  inject,
  signal,
  WritableSignal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { LoadingOverlayService } from "../../../services/loading-overlay-service";
import { Estadisticas } from "../../../services/estadisticas";
import { TurnosPorDiaChart } from "../../charts/turnos-por-dia-chart/turnos-por-dia-chart";
import { TurnosPorEspecialidadChart } from "../../charts/turnos-por-especialidad-chart/turnos-por-especialidad-chart";
import { TurnosPorMedicoChart } from "../../charts/turnos-por-medico-chart/turnos-por-medico-chart";
import { TurnosFinalizadosPorMedicoChart } from "../../charts/turnos-finalizados-chart/turnos-finalizados-chart";
import { IngresosEspecialistasChart } from "../../charts/ingresos-especialistas-chart/ingresos-especialistas-chart";
import { IngresosPacientesChart } from "../../charts/ingresos-pacientes-chart/ingresos-pacientes-chart";
import { PacientesPorEspecialidadChart } from "../../charts/pacientes-por-especialidad-chart/pacientes-por-especialidad-chart";
import { MedicosPorEspecialidadChart } from "../../charts/medicos-por-especialidad-chart/medicos-por-especialidad-chart";
import { CitasPorEstadoChart } from "../../charts/citas-por-estado-chart/citas-por-estado-chart";
import { exportarEstadisticasPdf } from "../../../helpers/exportar-estadisticas-pdf";

interface FechaRango {
  desde: string;
  hasta: string;
}

@Component({
  selector: "app-home",
  standalone: true,
  imports: [
    CommonModule,
    TurnosPorDiaChart,
    TurnosPorEspecialidadChart,
    TurnosPorMedicoChart,
    TurnosFinalizadosPorMedicoChart,
    IngresosEspecialistasChart,
    IngresosPacientesChart,
    PacientesPorEspecialidadChart,
    MedicosPorEspecialidadChart,
    CitasPorEstadoChart,
  ],
  templateUrl: "./home.html",
})
export class Home implements OnInit {
  private loading = inject(LoadingOverlayService);
  private estadisticas = inject(Estadisticas);

  datosCargados = signal(false);

  rangoTurnosPorMedico: WritableSignal<FechaRango> = signal({
    desde: "2024-01-01",
    hasta: "2027-01-01",
  });

  rangoTurnosFinalizados: WritableSignal<FechaRango> = signal({
    desde: "2024-01-01",
    hasta: "2027-01-01",
  });

  @ViewChild(TurnosPorDiaChart) turnosPorDiaChart?: TurnosPorDiaChart;
  @ViewChild(TurnosPorEspecialidadChart)
  turnosPorEspecialidadChart?: TurnosPorEspecialidadChart;
  @ViewChild(TurnosPorMedicoChart) turnosPorMedicoChart?: TurnosPorMedicoChart;
  @ViewChild(TurnosFinalizadosPorMedicoChart)
  turnosFinalizadosChart?: TurnosFinalizadosPorMedicoChart;

  ngOnInit() {
    // Iniciar carga de datos inmediatamente
    this.loading.show();
    this.cargarDatosIniciales();
  }

  private async cargarDatosIniciales() {
    try {
      await this.estadisticas.precargarDatosEstadisticas();
      this.datosCargados.set(true);
      // Esperar un tick para que los ViewChild estén disponibles después de renderizar
      setTimeout(() => this.cargarChartsConRangos(), 0);
    } catch (error) {
      console.error("Error precargando datos:", error);
      this.datosCargados.set(true); // Mostrar UI aunque falle
      this.loading.hide();
    }
  }

  private async cargarChartsConRangos() {
    try {
      await Promise.all([
        this.cargarTurnosPorMedico(),
        this.cargarTurnosFinalizados(),
      ]);
    } finally {
      this.loading.hide();
    }
  }

  private async cargarTurnosPorMedico() {
    const { desde, hasta } = this.rangoTurnosPorMedico();
    await this.turnosPorMedicoChart?.render(desde, hasta);
  }

  private async cargarTurnosFinalizados() {
    const { desde, hasta } = this.rangoTurnosFinalizados();
    await this.turnosFinalizadosChart?.render(desde, hasta);
  }

  onDesdeTurnosMedicoChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.rangoTurnosPorMedico.set({
      ...this.rangoTurnosPorMedico(),
      desde: input.value,
    });
  }

  onHastaTurnosMedicoChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.rangoTurnosPorMedico.set({
      ...this.rangoTurnosPorMedico(),
      hasta: input.value,
    });
  }

  async onAplicarTurnosMedico() {
    this.loading.show();
    try {
      await this.cargarTurnosPorMedico();
    } finally {
      this.loading.hide();
    }
  }

  onDesdeTurnosFinalizadosChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.rangoTurnosFinalizados.set({
      ...this.rangoTurnosFinalizados(),
      desde: input.value,
    });
  }

  onHastaTurnosFinalizadosChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.rangoTurnosFinalizados.set({
      ...this.rangoTurnosFinalizados(),
      hasta: input.value,
    });
  }

  async onAplicarTurnosFinalizados() {
    this.loading.show();
    try {
      await this.cargarTurnosFinalizados();
    } finally {
      this.loading.hide();
    }
  }

  async exportarEstadisticasPdf() {
    this.loading.show();
    try {
      await exportarEstadisticasPdf();
    } catch (error) {
      console.error("Error al exportar PDF:", error);
    } finally {
      this.loading.hide();
    }
  }
}
