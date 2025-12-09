import {
  Component,
  ElementRef,
  ViewChild,
  inject,
  AfterViewInit,
  signal,
} from "@angular/core";
import { Estadisticas } from "../../../services/estadisticas";
import type { Chart } from "chart.js";
import type { Paciente } from "../../../models/Estadisticas/modeloEstadisticas";
import { CommonModule } from "@angular/common";
import { ClickFueraPopup } from "../../../directivas/click-fuera-popup";

@Component({
  selector: "app-citas-por-estado-chart",
  standalone: true,
  imports: [CommonModule, ClickFueraPopup],
  template: `
    <div class="relative">
      <div class="mb-3 flex items-center justify-between">
        <button
          (click)="abrirSeleccionPaciente()"
          class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          {{
            pacienteSeleccionado() ? "Cambiar paciente" : "Filtrar por paciente"
          }}
        </button>
        @if (pacienteSeleccionado()) {
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">
              Mostrando: {{ pacienteSeleccionado()!.apellido }},
              {{ pacienteSeleccionado()!.nombre }}
            </span>
            <button
              (click)="limpiarFiltro()"
              class="rounded-lg bg-gray-200 px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-300"
            >
              Ver todos
            </button>
          </div>
        }
      </div>
      <div class="relative h-64 w-full">
        <canvas #canvas class="absolute inset-0 h-full w-full"></canvas>
      </div>

      @if (mostrarPopup()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
        >
          <div
            class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            appClickFueraPopup
            (clickFuera)="cerrarPopup()"
          >
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">
                Seleccionar Paciente
              </h3>
              <button
                (click)="cerrarPopup()"
                class="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div class="mb-4">
              <button
                (click)="seleccionarTodos()"
                class="w-full rounded-lg bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-200"
              >
                Mostrar todos los pacientes
              </button>
            </div>

            <div class="rounded-lg border border-gray-200 bg-gray-50">
              <div class="max-h-96 overflow-y-auto p-2">
                @for (paciente of pacientes(); track paciente.id) {
                  <button
                    (click)="seleccionarPaciente(paciente)"
                    class="w-full rounded-lg px-4 py-2 text-left text-sm transition-colors hover:bg-white hover:shadow-sm"
                  >
                    {{ paciente.apellido }}, {{ paciente.nombre }}
                  </button>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class CitasPorEstadoChart implements AfterViewInit {
  private estadisticas = inject(Estadisticas);
  private chart?: Chart;

  pacienteSeleccionado = signal<Paciente | null>(null);
  mostrarPopup = signal(false);
  pacientes = signal<Paciente[]>([]);

  @ViewChild("canvas", { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit(): void {
    this.cargarPacientes();
    this.render();
  }

  private async cargarPacientes(): Promise<void> {
    const listaPacientes = await this.estadisticas.obtenerPacientes();
    this.pacientes.set(listaPacientes);
  }

  abrirSeleccionPaciente(): void {
    this.mostrarPopup.set(true);
  }

  cerrarPopup(): void {
    this.mostrarPopup.set(false);
  }

  seleccionarPaciente(paciente: Paciente): void {
    this.pacienteSeleccionado.set(paciente);
    this.cerrarPopup();
    this.render();
  }

  seleccionarTodos(): void {
    this.pacienteSeleccionado.set(null);
    this.cerrarPopup();
    this.render();
  }

  limpiarFiltro(): void {
    this.pacienteSeleccionado.set(null);
    this.render();
  }

  private async render(): Promise<void> {
    const {
      Chart,
      BarElement,
      BarController,
      CategoryScale,
      LinearScale,
      Tooltip,
      Legend,
    } = await import("chart.js");
    Chart.register(
      BarElement,
      BarController,
      CategoryScale,
      LinearScale,
      Tooltip,
      Legend,
    );

    const pacienteId = this.pacienteSeleccionado()?.id;
    const datos = await this.estadisticas.obtenerCitasPorEstado(pacienteId);
    const labels = datos.map((d) => d.estado);
    const data = datos.map((d) => d.cantidad);

    const canvas = this.canvasRef.nativeElement;
    this.chart?.destroy();

    this.chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Cantidad de Citas",
            data,
            backgroundColor: [
              "rgba(59, 130, 246, 0.7)", // solicitado - blue
              "rgba(34, 197, 94, 0.7)", // aceptado - green
              "rgba(239, 68, 68, 0.7)", // rechazado - red
              "rgba(249, 115, 22, 0.7)", // cancelado - orange
              "rgba(16, 185, 129, 0.7)", // completado - emerald
            ],
            borderColor: [
              "rgba(59, 130, 246, 1)",
              "rgba(34, 197, 94, 1)",
              "rgba(239, 68, 68, 1)",
              "rgba(249, 115, 22, 1)",
              "rgba(147, 51, 234, 1)",
              "rgba(16, 185, 129, 1)",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const value = context.parsed.y || 0;
                return `Cantidad: ${value} cita${value !== 1 ? "s" : ""}`;
              },
            },
          },
        },
      },
    });
  }
}
