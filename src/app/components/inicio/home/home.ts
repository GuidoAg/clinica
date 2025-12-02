import {
  Component,
  AfterViewInit,
  ViewChild,
  inject,
  signal,
  WritableSignal,
} from "@angular/core";
import { LoadingOverlayService } from "../../../services/loading-overlay-service";
import { TurnosPorDiaChart } from "../../charts/turnos-por-dia-chart/turnos-por-dia-chart";
import { TurnosPorEspecialidadChart } from "../../charts/turnos-por-especialidad-chart/turnos-por-especialidad-chart";
import { TurnosPorMedicoChart } from "../../charts/turnos-por-medico-chart/turnos-por-medico-chart";
import { TurnosFinalizadosPorMedicoChart } from "../../charts/turnos-finalizados-chart/turnos-finalizados-chart";
import { IngresosEspecialistasChart } from "../../charts/ingresos-especialistas-chart/ingresos-especialistas-chart";
import { IngresosPacientesChart } from "../../charts/ingresos-pacientes-chart/ingresos-pacientes-chart";

interface FechaRango {
  desde: string;
  hasta: string;
}

@Component({
  selector: "app-home",
  standalone: true,
  imports: [
    TurnosPorDiaChart,
    TurnosPorEspecialidadChart,
    TurnosPorMedicoChart,
    TurnosFinalizadosPorMedicoChart,
    IngresosEspecialistasChart,
    IngresosPacientesChart,
  ],
  templateUrl: "./home.html",
})
export class Home implements AfterViewInit {
  private loading = inject(LoadingOverlayService);

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

  ngAfterViewInit(): void {
    this.cargarDatos();
  }

  private async cargarDatos() {
    this.loading.show();
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
}
