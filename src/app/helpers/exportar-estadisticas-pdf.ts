/**
 * @fileoverview Helper para exportar estadísticas médicas a PDF
 *
 * Este módulo proporciona funcionalidades para generar informes PDF profesionales
 * con gráficos estadísticos del sistema de gestión médica.
 *
 * @example
 * // Uso básico (obtiene automáticamente los canvas del DOM):
 * await exportarEstadisticasPdf();
 *
 * @example
 * // Uso con configuración personalizada:
 * await exportarEstadisticasPdf({
 *   nombreArchivo: 'estadisticas_marzo',
 *   tituloDocumento: 'INFORME MENSUAL',
 *   colorPrimario: [255, 0, 0]
 * });
 *
 * @example
 * // Uso con canvas específicos:
 * const misCanvas = [canvas1, canvas2, canvas3];
 * await exportarEstadisticasConCanvas(misCanvas, {
 *   subtituloDocumento: 'Reporte Trimestral'
 * });
 */

import jsPDF from "jspdf";

/**
 * Información descriptiva de un gráfico para el PDF
 */
interface GraficoInfo {
  titulo: string;
  descripcion: string;
}

/**
 * Configuración para la exportación del PDF de estadísticas
 */
export interface ConfiguracionPdfEstadisticas {
  nombreArchivo?: string;
  tituloDocumento?: string;
  subtituloDocumento?: string;
  colorPrimario?: [number, number, number];
  incluirFecha?: boolean;
  incluirNumeroPagina?: boolean;
  notaFinal?: string;
}

/**
 * Información predefinida de los gráficos de estadísticas
 */
const GRAFICOS_ESTADISTICAS: GraficoInfo[] = [
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

/**
 * Clase para gestionar la creación del PDF de estadísticas
 */
class GeneradorPdfEstadisticas {
  private pdf: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private yPosition = 20;
  private numeroPagina = 1;
  private config: Required<ConfiguracionPdfEstadisticas>;

  constructor(config: ConfiguracionPdfEstadisticas = {}) {
    this.pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();

    // Configuración por defecto
    this.config = {
      nombreArchivo: config.nombreArchivo || "informe_estadisticas",
      tituloDocumento: config.tituloDocumento || "INFORME DE ESTADÍSTICAS",
      subtituloDocumento:
        config.subtituloDocumento || "Centro Médico - Panel Administrativo",
      colorPrimario: config.colorPrimario || [41, 98, 255],
      incluirFecha: config.incluirFecha ?? true,
      incluirNumeroPagina: config.incluirNumeroPagina ?? true,
      notaFinal:
        config.notaFinal ||
        "Este informe ha sido generado automáticamente por el Sistema de Gestión del Centro Médico. Los datos reflejan el estado actual de las operaciones y están sujetos a cambios en tiempo real.",
    };
  }

  /**
   * Agrega el encabezado de la página
   */
  private agregarEncabezado(): void {
    const [r, g, b] = this.config.colorPrimario;

    // Barra superior
    this.pdf.setFillColor(r, g, b);
    this.pdf.rect(0, 0, this.pageWidth, 35, "F");

    // Título
    this.pdf.setFontSize(22);
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.text(this.config.tituloDocumento, this.pageWidth / 2, 15, {
      align: "center",
    });

    // Subtítulo
    this.pdf.setFontSize(11);
    this.pdf.setFont("helvetica", "normal");
    this.pdf.text(this.config.subtituloDocumento, this.pageWidth / 2, 23, {
      align: "center",
    });

    // Fecha
    if (this.config.incluirFecha) {
      const fecha = new Date().toLocaleDateString("es-AR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      this.pdf.setFontSize(9);
      this.pdf.text(fecha, this.pageWidth / 2, 29, { align: "center" });
    }

    // Número de página
    if (this.config.incluirNumeroPagina) {
      this.pdf.setFontSize(8);
      this.pdf.setTextColor(150, 150, 150);
      this.pdf.text(
        `Página ${this.numeroPagina}`,
        this.pageWidth - 15,
        this.pageHeight - 10,
        { align: "right" },
      );
    }
  }

  /**
   * Verifica si hay espacio suficiente en la página y crea una nueva si es necesario
   */
  private verificarEspacio(alturaRequerida: number): boolean {
    if (this.yPosition + alturaRequerida > this.pageHeight - 20) {
      this.pdf.addPage();
      this.numeroPagina++;
      this.agregarEncabezado();
      this.yPosition = 45;
      return true;
    }
    return false;
  }

  /**
   * Agrega un gráfico al PDF
   */
  private agregarGrafico(canvas: HTMLCanvasElement, info: GraficoInfo): void {
    const [r, g, b] = this.config.colorPrimario;

    // Verificar espacio para título + descripción + gráfico
    this.verificarEspacio(90);

    // Línea decorativa
    this.pdf.setDrawColor(r, g, b);
    this.pdf.setLineWidth(0.5);
    this.pdf.line(15, this.yPosition, this.pageWidth - 15, this.yPosition);
    this.yPosition += 5;

    // Título del gráfico
    this.pdf.setFontSize(14);
    this.pdf.setTextColor(r, g, b);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.text(info.titulo, 15, this.yPosition);
    this.yPosition += 8;

    // Descripción
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(80, 80, 80);
    this.pdf.setFont("helvetica", "normal");
    const lineasDescripcion = this.pdf.splitTextToSize(
      info.descripcion,
      this.pageWidth - 30,
    );
    this.pdf.text(lineasDescripcion, 15, this.yPosition);
    this.yPosition += lineasDescripcion.length * 4 + 5;

    // Verificar espacio para el gráfico
    this.verificarEspacio(75);

    // Marco decorativo para el gráfico
    this.pdf.setDrawColor(220, 220, 220);
    this.pdf.setLineWidth(0.3);
    this.pdf.roundedRect(
      13,
      this.yPosition - 2,
      this.pageWidth - 26,
      72,
      2,
      2,
      "S",
    );

    // Agregar el gráfico
    const imgData = canvas.toDataURL("image/png");
    const imgWidth = this.pageWidth - 34;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const maxHeight = 68;
    const finalHeight = Math.min(imgHeight, maxHeight);
    const finalWidth = (canvas.width * finalHeight) / canvas.height;

    const xCentrado = (this.pageWidth - finalWidth) / 2;
    this.pdf.addImage(
      imgData,
      "PNG",
      xCentrado,
      this.yPosition,
      finalWidth,
      finalHeight,
    );
    this.yPosition += 72 + 10;
  }

  /**
   * Agrega la nota final al documento
   */
  private agregarNotaFinal(): void {
    const [r, g, b] = this.config.colorPrimario;

    // Verificar si hay espacio o crear nueva página
    if (this.yPosition < this.pageHeight - 50) {
      this.yPosition = this.pageHeight - 45;
    } else {
      this.pdf.addPage();
      this.numeroPagina++;
      this.agregarEncabezado();
      this.yPosition = 45;
    }

    // Línea separadora
    this.pdf.setDrawColor(r, g, b);
    this.pdf.setLineWidth(0.5);
    this.pdf.line(15, this.yPosition, this.pageWidth - 15, this.yPosition);
    this.yPosition += 8;

    // Nota final
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(100, 100, 100);
    this.pdf.setFont("helvetica", "italic");
    const lineasNota = this.pdf.splitTextToSize(
      this.config.notaFinal,
      this.pageWidth - 30,
    );
    this.pdf.text(lineasNota, this.pageWidth / 2, this.yPosition, {
      align: "center",
    });
  }

  /**
   * Genera el PDF completo con todos los gráficos
   */
  public generar(canvases: HTMLCanvasElement[]): void {
    // Primera página con encabezado
    this.agregarEncabezado();
    this.yPosition = 45;

    // Agregar cada gráfico
    const cantidadGraficos = Math.min(
      canvases.length,
      GRAFICOS_ESTADISTICAS.length,
    );
    for (let i = 0; i < cantidadGraficos; i++) {
      this.agregarGrafico(canvases[i], GRAFICOS_ESTADISTICAS[i]);
    }

    // Agregar nota final
    this.agregarNotaFinal();
  }

  /**
   * Descarga el PDF generado
   */
  public descargar(): void {
    const fechaArchivo = new Date().toISOString().split("T")[0];
    const nombreCompleto = `${this.config.nombreArchivo}_${fechaArchivo}.pdf`;
    this.pdf.save(nombreCompleto);
  }
}

/**
 * Exporta las estadísticas a PDF obteniendo los gráficos del DOM
 * @param config Configuración personalizada para el PDF
 */
export async function exportarEstadisticasPdf(
  config: ConfiguracionPdfEstadisticas = {},
): Promise<void> {
  // Obtener todos los canvas de los gráficos
  const canvases = Array.from(
    document.querySelectorAll("canvas"),
  ) as HTMLCanvasElement[];

  if (canvases.length === 0) {
    throw new Error("No se encontraron gráficos para exportar");
  }

  // Crear generador y procesar
  const generador = new GeneradorPdfEstadisticas(config);
  generador.generar(canvases);
  generador.descargar();
}

/**
 * Exporta estadísticas a PDF con canvas específicos
 * @param canvases Array de elementos canvas a incluir en el PDF
 * @param config Configuración personalizada para el PDF
 */
export async function exportarEstadisticasConCanvas(
  canvases: HTMLCanvasElement[],
  config: ConfiguracionPdfEstadisticas = {},
): Promise<void> {
  if (canvases.length === 0) {
    throw new Error("No se proporcionaron gráficos para exportar");
  }

  const generador = new GeneradorPdfEstadisticas(config);
  generador.generar(canvases);
  generador.descargar();
}

/**
 * Obtiene la información predefinida de los gráficos
 * Útil para personalización o consulta
 */
export function obtenerInfoGraficos(): GraficoInfo[] {
  return [...GRAFICOS_ESTADISTICAS];
}
