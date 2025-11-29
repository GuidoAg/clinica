import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  signal,
  WritableSignal,
  inject,
} from "@angular/core";
import { LoadingOverlayService } from "../../../services/loading-overlay-service";
import { TurnosPorDiaChart } from "../../charts/turnos-por-dia-chart/turnos-por-dia-chart";
import { TurnosPorEspecialidadChart } from "../../charts/turnos-por-especialidad-chart/turnos-por-especialidad-chart";
import { TurnosPorMedicoChart } from "../../charts/turnos-por-medico-chart/turnos-por-medico-chart";
import { TurnosFinalizadosPorMedicoChart } from "../../charts/turnos-finalizados-chart/turnos-finalizados-chart";
import { LogIngresoChart } from "../../charts/log-ingreso-chart/log-ingreso-chart"; // ✅ Importado

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
    LogIngresoChart,
  ],
  templateUrl: "./home.html",
})
export class Home implements OnInit, AfterViewInit {
  private loading = inject(LoadingOverlayService);

  rangoFechas: WritableSignal<FechaRango> = signal({
    desde: "",
    hasta: "",
  });

  @ViewChild(TurnosPorDiaChart) turnosPorDiaChart?: TurnosPorDiaChart;
  @ViewChild(TurnosPorEspecialidadChart)
  turnosPorEspecialidadChart?: TurnosPorEspecialidadChart;
  @ViewChild(TurnosPorMedicoChart) turnosPorMedicoChart?: TurnosPorMedicoChart;
  @ViewChild(TurnosFinalizadosPorMedicoChart)
  turnosFinalizadosChart?: TurnosFinalizadosPorMedicoChart;

  ngOnInit(): void {
    this.rangoFechas.set({
      desde: this.fechaDesdeInicioDeAnio(),
      hasta: this.fechaHastaFinDeAnio(),
    });
  }

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

  async onRangoFechasChange() {
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
    const { desde, hasta } = this.rangoFechas();
    await this.turnosPorMedicoChart?.render(desde, hasta);
  }

  private async cargarTurnosFinalizados() {
    const { desde, hasta } = this.rangoFechas();
    await this.turnosFinalizadosChart?.render(desde, hasta);
  }

  onDesdeChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.rangoFechas.set({ ...this.rangoFechas(), desde: input.value });
  }

  onHastaChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.rangoFechas.set({ ...this.rangoFechas(), hasta: input.value });
  }

  private fechaDesdeInicioDeAnio(): string {
    const ahora = new Date();
    return new Date(ahora.getFullYear(), 0, 1).toISOString().split("T")[0];
  }

  private fechaHastaFinDeAnio(): string {
    const ahora = new Date();
    return new Date(ahora.getFullYear(), 11, 31).toISOString().split("T")[0];
  }
}
