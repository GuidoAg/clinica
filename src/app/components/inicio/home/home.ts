import {
  Component,
  AfterViewInit,
  ViewChild,
  inject,
  signal,
  WritableSignal,
} from "@angular/core";
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
    PacientesPorEspecialidadChart,
    MedicosPorEspecialidadChart,
    CitasPorEstadoChart,
  ],
  templateUrl: "./home.html",
})
export class Home implements AfterViewInit {
  private loading = inject(LoadingOverlayService);
  private estadisticas = inject(Estadisticas);

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
      // Precargar todos los datos en una sola operación
      await this.estadisticas.precargarDatosEstadisticas();

      // Los gráficos ahora usarán los datos cacheados
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
      const { default: jsPDF } = await import("jspdf");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Función para agregar encabezado con logo
      const agregarEncabezado = (numeroPagina: number) => {
        // Barra superior azul
        pdf.setFillColor(41, 98, 255);
        pdf.rect(0, 0, pageWidth, 35, "F");

        // Título
        pdf.setFontSize(22);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.text("INFORME DE ESTADÍSTICAS", pageWidth / 2, 15, {
          align: "center",
        });

        // Subtítulo
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        pdf.text("Centro Médico - Panel Administrativo", pageWidth / 2, 23, {
          align: "center",
        });

        // Fecha
        const fecha = new Date().toLocaleDateString("es-AR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        pdf.setFontSize(9);
        pdf.text(fecha, pageWidth / 2, 29, { align: "center" });

        // Número de página
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Página ${numeroPagina}`, pageWidth - 15, pageHeight - 10, {
          align: "right",
        });
      };

      // Función para verificar espacio y agregar nueva página si es necesario
      const verificarEspacio = (alturaRequerida: number) => {
        if (yPosition + alturaRequerida > pageHeight - 20) {
          pdf.addPage();
          numeroPagina++;
          agregarEncabezado(numeroPagina);
          yPosition = 45;
          return true;
        }
        return false;
      };

      let numeroPagina = 1;
      agregarEncabezado(numeroPagina);
      yPosition = 45;

      // Obtener todos los canvas de los gráficos
      const canvases = Array.from(
        document.querySelectorAll("canvas"),
      ) as HTMLCanvasElement[];

      const graficosInfo = [
        {
          titulo: "Distribución de Turnos por Día",
          descripcion:
            "Análisis de la distribución de citas agendadas a lo largo de la semana, permitiendo identificar los días de mayor demanda y optimizar la disponibilidad del personal médico.",
        },
        {
          titulo: "Turnos por Especialidad Médica",
          descripcion:
            "Visualización de la demanda de servicios por área de especialización, facilitando la planificación de recursos y la asignación eficiente de profesionales.",
        },
        {
          titulo: "Carga de Trabajo por Médico",
          descripcion:
            "Distribución de turnos asignados a cada profesional médico en el período seleccionado, permitiendo equilibrar la carga de trabajo y detectar posibles sobrecargas.",
        },
        {
          titulo: "Turnos Finalizados por Médico",
          descripcion:
            "Registro de consultas completadas exitosamente por cada profesional, indicador clave de productividad y cumplimiento de agenda médica.",
        },
        {
          titulo: "Registro de Ingresos - Especialistas",
          descripcion:
            "Seguimiento temporal de la actividad de acceso al sistema por parte del personal médico durante los últimos 60 días, útil para monitorear el uso de la plataforma.",
        },
        {
          titulo: "Registro de Ingresos - Pacientes",
          descripcion:
            "Seguimiento de la actividad de acceso al sistema por parte de los pacientes durante los últimos 60 días, indicador de engagement y uso del portal de pacientes.",
        },
        {
          titulo: "Pacientes Únicos por Especialidad",
          descripcion:
            "Cantidad de pacientes individuales atendidos en cada especialidad médica, métrica fundamental para evaluar la cobertura y alcance de los servicios ofrecidos.",
        },
        {
          titulo: "Personal Médico por Especialidad",
          descripcion:
            "Distribución del equipo de profesionales según su área de especialización, esencial para garantizar la cobertura adecuada de todas las especialidades.",
        },
        {
          titulo: "Estado de las Citas Médicas",
          descripcion:
            "Clasificación de todas las citas según su estado actual (solicitadas, aceptadas, rechazadas, canceladas y completadas), herramienta clave para el seguimiento operativo.",
        },
      ];

      for (let i = 0; i < canvases.length && i < graficosInfo.length; i++) {
        const canvas = canvases[i];
        const { titulo, descripcion } = graficosInfo[i];

        // Verificar espacio para título + descripción + gráfico
        verificarEspacio(90);

        // Línea decorativa
        pdf.setDrawColor(41, 98, 255);
        pdf.setLineWidth(0.5);
        pdf.line(15, yPosition, pageWidth - 15, yPosition);
        yPosition += 5;

        // Título del gráfico
        pdf.setFontSize(14);
        pdf.setTextColor(41, 98, 255);
        pdf.setFont("helvetica", "bold");
        pdf.text(titulo, 15, yPosition);
        yPosition += 8;

        // Descripción
        pdf.setFontSize(9);
        pdf.setTextColor(80, 80, 80);
        pdf.setFont("helvetica", "normal");
        const lineasDescripcion = pdf.splitTextToSize(
          descripcion,
          pageWidth - 30,
        );
        pdf.text(lineasDescripcion, 15, yPosition);
        yPosition += lineasDescripcion.length * 4 + 5;

        // Verificar espacio para el gráfico
        verificarEspacio(75);

        // Marco decorativo para el gráfico
        pdf.setDrawColor(220, 220, 220);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(13, yPosition - 2, pageWidth - 26, 72, 2, 2, "S");

        // Agregar el gráfico
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = pageWidth - 34;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        const maxHeight = 68;
        const finalHeight = Math.min(imgHeight, maxHeight);
        const finalWidth = (canvas.width * finalHeight) / canvas.height;

        const xCentrado = (pageWidth - finalWidth) / 2;
        pdf.addImage(
          imgData,
          "PNG",
          xCentrado,
          yPosition,
          finalWidth,
          finalHeight,
        );
        yPosition += 72 + 10;
      }

      // Pie de página final
      if (yPosition < pageHeight - 50) {
        yPosition = pageHeight - 45;
      } else {
        pdf.addPage();
        numeroPagina++;
        agregarEncabezado(numeroPagina);
        yPosition = 45;
      }

      // Línea separadora
      pdf.setDrawColor(41, 98, 255);
      pdf.setLineWidth(0.5);
      pdf.line(15, yPosition, pageWidth - 15, yPosition);
      yPosition += 8;

      // Nota final
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont("helvetica", "italic");
      const notaFinal =
        "Este informe ha sido generado automáticamente por el Sistema de Gestión del Centro Médico. Los datos reflejan el estado actual de las operaciones y están sujetos a cambios en tiempo real.";
      const lineasNota = pdf.splitTextToSize(notaFinal, pageWidth - 30);
      pdf.text(lineasNota, pageWidth / 2, yPosition, { align: "center" });

      const fechaArchivo = new Date().toISOString().split("T")[0];
      pdf.save(`informe_estadisticas_${fechaArchivo}.pdf`);
    } catch (error) {
      console.error("Error al exportar PDF:", error);
    } finally {
      this.loading.hide();
    }
  }
}
