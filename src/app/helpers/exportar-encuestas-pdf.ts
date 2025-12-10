/**
 * @fileoverview Helper para exportar estadísticas de encuestas de satisfacción a PDF
 *
 * Este módulo proporciona funcionalidades para generar informes PDF profesionales
 * con análisis de encuestas de pacientes y estadísticas de satisfacción.
 *
 * @example
 * // Uso básico (obtiene automáticamente los gráficos del DOM):
 * await exportarEncuestasPdf();
 *
 * @example
 * // Uso con configuración personalizada:
 * await exportarEncuestasPdf({
 *   nombreArchivo: 'encuestas_marzo',
 *   tituloDocumento: 'ANÁLISIS DE SATISFACCIÓN'
 * });
 */

import jsPDF from "jspdf";
import type { EstadisticasEncuestas } from "../models/Encuestas/modeloEncuestas";

/**
 * Información descriptiva de un gráfico para el PDF
 */
interface GraficoInfo {
  titulo: string;
  descripcion: string;
}

/**
 * Configuración para la exportación del PDF de encuestas
 */
export interface ConfiguracionPdfEncuestas {
  nombreArchivo?: string;
  tituloDocumento?: string;
  subtituloDocumento?: string;
  colorPrimario?: [number, number, number];
  incluirFecha?: boolean;
  incluirNumeroPagina?: boolean;
  notaFinal?: string;
}

/**
 * Información predefinida de las secciones de análisis de encuestas
 */
const SECCIONES_ENCUESTAS: GraficoInfo[] = [
  {
    titulo: "Distribución de Calificaciones por Estrellas",
    descripcion:
      "Visualización de cómo los pacientes califican el servicio en una escala de 1 a 5 estrellas, permitiendo identificar patrones de satisfacción general y detectar áreas de mejora prioritarias.",
  },
  {
    titulo: "Evaluación General de la Atención",
    descripcion:
      "Análisis de las evaluaciones cualitativas (Excelente, Muy bueno, Bueno, Regular, Malo) que reflejan la percepción global de los pacientes sobre la calidad del servicio recibido.",
  },
  {
    titulo: "Puntuación por Especialista Médico",
    descripcion:
      "Comparativa del desempeño de cada profesional médico basada en las calificaciones de los pacientes, útil para reconocer excelencia y diseñar planes de mejora personalizados.",
  },
];

/**
 * Clase para gestionar la creación del PDF de encuestas
 */
class GeneradorPdfEncuestas {
  private pdf: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private yPosition = 20;
  private numeroPagina = 1;
  private config: Required<ConfiguracionPdfEncuestas>;

  constructor(config: ConfiguracionPdfEncuestas = {}) {
    this.pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();

    // Configuración por defecto
    this.config = {
      nombreArchivo: config.nombreArchivo || "informe_encuestas_satisfaccion",
      tituloDocumento:
        config.tituloDocumento || "ANÁLISIS DE ENCUESTAS DE SATISFACCIÓN",
      subtituloDocumento:
        config.subtituloDocumento ||
        "Centro Médico - Evaluación de Calidad del Servicio",
      colorPrimario: config.colorPrimario || [255, 127, 0], // Naranja
      incluirFecha: config.incluirFecha ?? true,
      incluirNumeroPagina: config.incluirNumeroPagina ?? true,
      notaFinal:
        config.notaFinal ||
        "Este informe ha sido generado automáticamente por el Sistema de Gestión del Centro Médico. Las opiniones y calificaciones reflejan la experiencia de pacientes reales y son fundamentales para la mejora continua de nuestros servicios.",
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
    this.pdf.setFontSize(20);
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.text(this.config.tituloDocumento, this.pageWidth / 2, 14, {
      align: "center",
    });

    // Subtítulo
    this.pdf.setFontSize(11);
    this.pdf.setFont("helvetica", "normal");
    this.pdf.text(this.config.subtituloDocumento, this.pageWidth / 2, 22, {
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
   * Agrega un resumen ejecutivo con las métricas principales
   */
  private agregarResumenEjecutivo(estadisticas: EstadisticasEncuestas): void {
    const [r, g, b] = this.config.colorPrimario;

    this.verificarEspacio(60);

    // Título de sección
    this.pdf.setFontSize(16);
    this.pdf.setTextColor(r, g, b);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.text("Resumen Ejecutivo", 15, this.yPosition);
    this.yPosition += 10;

    // Métricas clave en columnas
    const metricas = [
      {
        label: "Total de Encuestas",
        valor: estadisticas.total.toString(),
        color: [59, 130, 246], // Azul
      },
      {
        label: "Promedio Estrellas",
        valor: `${estadisticas.promedioEstrellas.toFixed(1)} / 5.0`,
        color: [234, 179, 8], // Amarillo
      },
      {
        label: "Valoracion General",
        valor: `${estadisticas.promedioRango.toFixed(0)} / 100`,
        color: [34, 197, 94], // Verde
      },
      {
        label: "Tasa de Respuesta",
        valor: `${estadisticas.tasaRespuesta.toFixed(1)}%`,
        color: [168, 85, 247], // Púrpura
      },
    ];

    const columnas = 2;
    const anchoColumna = (this.pageWidth - 40) / columnas;
    const altoMetrica = 20;

    metricas.forEach((metrica, index) => {
      const col = index % columnas;
      const row = Math.floor(index / columnas);
      const x = 15 + col * (anchoColumna + 10);
      const y = this.yPosition + row * (altoMetrica + 4);

      // Fondo de la métrica
      this.pdf.setFillColor(245, 245, 245);
      this.pdf.roundedRect(x, y, anchoColumna, altoMetrica, 2, 2, "F");

      // Borde izquierdo de color
      const [cr, cg, cb] = metrica.color;
      this.pdf.setFillColor(cr, cg, cb);
      this.pdf.roundedRect(x, y, 3, altoMetrica, 2, 2, "F");

      // Etiqueta
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(100, 100, 100);
      this.pdf.setFont("helvetica", "normal");
      this.pdf.text(metrica.label, x + 8, y + 7);

      // Valor
      this.pdf.setFontSize(14);
      this.pdf.setTextColor(cr, cg, cb);
      this.pdf.setFont("helvetica", "bold");
      this.pdf.text(metrica.valor, x + 8, y + 15);
    });

    this.yPosition +=
      Math.ceil(metricas.length / columnas) * (altoMetrica + 4) + 8;

    // Tendencia general
    this.verificarEspacio(30);
    this.pdf.setFillColor(240, 248, 255);
    const altoCaja = 12 + (estadisticas.tendenciaGeneral.length / 100) * 8;
    this.pdf.roundedRect(
      15,
      this.yPosition,
      this.pageWidth - 30,
      altoCaja,
      2,
      2,
      "F",
    );

    // Borde izquierdo
    this.pdf.setFillColor(59, 130, 246);
    this.pdf.roundedRect(15, this.yPosition, 3, altoCaja, 2, 2, "F");

    this.pdf.setFontSize(10);
    this.pdf.setTextColor(59, 130, 246);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.text("Apreciacion General del Servicio:", 22, this.yPosition + 6);

    this.pdf.setFontSize(9);
    this.pdf.setTextColor(60, 60, 60);
    this.pdf.setFont("helvetica", "normal");
    const lineasTendencia = this.pdf.splitTextToSize(
      estadisticas.tendenciaGeneral,
      this.pageWidth - 50,
    );
    this.pdf.text(lineasTendencia, 22, this.yPosition + 11);

    this.yPosition += altoCaja + 8;
  }

  /**
   * Agrega distribuciones visuales (barras de progreso) al PDF
   */
  private agregarDistribuciones(estadisticas: EstadisticasEncuestas): void {
    const [r, g, b] = this.config.colorPrimario;

    // Distribución de estrellas
    this.verificarEspacio(50);

    this.pdf.setFontSize(14);
    this.pdf.setTextColor(r, g, b);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.text("Distribucion de Calificaciones", 15, this.yPosition);
    this.yPosition += 8;

    estadisticas.distribucionEstrellas.forEach((item) => {
      this.verificarEspacio(10);

      // Etiqueta de estrellas
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(234, 179, 8);
      this.pdf.setFont("helvetica", "bold");
      this.pdf.text(`${item.estrellas} Estrellas`, 17, this.yPosition + 5);

      // Barra de progreso
      const anchoMaximo = this.pageWidth - 80;
      const porcentaje =
        estadisticas.total > 0 ? (item.cantidad / estadisticas.total) * 100 : 0;
      const anchoBarra = (anchoMaximo * porcentaje) / 100;

      // Fondo de la barra
      this.pdf.setFillColor(229, 231, 235);
      this.pdf.roundedRect(45, this.yPosition, anchoMaximo, 7, 3, 3, "F");

      // Barra de progreso
      if (anchoBarra > 0) {
        this.pdf.setFillColor(234, 179, 8);
        this.pdf.roundedRect(45, this.yPosition, anchoBarra, 7, 3, 3, "F");
      }

      // Cantidad
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(60, 60, 60);
      this.pdf.setFont("helvetica", "bold");
      this.pdf.text(
        item.cantidad.toString(),
        this.pageWidth - 15,
        this.yPosition + 5,
        { align: "right" },
      );

      this.yPosition += 10;
    });

    this.yPosition += 5;

    // Evaluación de Atención
    this.verificarEspacio(50);

    this.pdf.setFontSize(14);
    this.pdf.setTextColor(r, g, b);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.text("Evaluacion de Atencion", 15, this.yPosition);
    this.yPosition += 8;

    const etiquetasRadio: Record<string, string> = {
      excelente: "Excelente",
      "muy-bueno": "Muy bueno",
      bueno: "Bueno",
      regular: "Regular",
      malo: "Malo",
    };

    estadisticas.distribucionRadio.forEach((item) => {
      this.verificarEspacio(10);

      // Etiqueta
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(60, 60, 60);
      this.pdf.setFont("helvetica", "normal");
      const etiqueta = etiquetasRadio[item.opcion] || item.opcion;
      this.pdf.text(etiqueta, 17, this.yPosition + 5);

      // Barra de progreso
      const anchoMaximo = this.pageWidth - 80;
      const porcentaje =
        estadisticas.total > 0 ? (item.cantidad / estadisticas.total) * 100 : 0;
      const anchoBarra = (anchoMaximo * porcentaje) / 100;

      // Fondo de la barra
      this.pdf.setFillColor(229, 231, 235);
      this.pdf.roundedRect(55, this.yPosition, anchoMaximo - 10, 7, 3, 3, "F");

      // Barra de progreso
      if (anchoBarra > 0) {
        this.pdf.setFillColor(59, 130, 246);
        this.pdf.roundedRect(55, this.yPosition, anchoBarra - 10, 7, 3, 3, "F");
      }

      // Cantidad
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(60, 60, 60);
      this.pdf.setFont("helvetica", "bold");
      this.pdf.text(
        item.cantidad.toString(),
        this.pageWidth - 15,
        this.yPosition + 5,
        { align: "right" },
      );

      this.yPosition += 10;
    });

    this.yPosition += 8;
  }

  /**
   * Agrega un gráfico al PDF con mejor calidad
   */
  private agregarGrafico(canvas: HTMLCanvasElement, info: GraficoInfo): void {
    const [r, g, b] = this.config.colorPrimario;

    // Verificar espacio para título + descripción + gráfico (aumentado)
    this.verificarEspacio(120);

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
    this.verificarEspacio(85);

    // Agregar el gráfico con mejor calidad
    const imgData = canvas.toDataURL("image/png", 1.0); // Máxima calidad

    // Calcular dimensiones manteniendo proporción
    const imgWidth = this.pageWidth - 30;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Altura máxima ajustada
    const maxHeight = 75;
    const finalHeight = Math.min(imgHeight, maxHeight);
    const finalWidth = (canvas.width * finalHeight) / canvas.height;

    // Marco decorativo ajustado al contenido real del gráfico
    const altoMarco = finalHeight + 8; // Padding mínimo arriba y abajo
    this.pdf.setDrawColor(220, 220, 220);
    this.pdf.setLineWidth(0.3);
    this.pdf.roundedRect(
      13,
      this.yPosition - 2,
      this.pageWidth - 26,
      altoMarco,
      2,
      2,
      "S",
    );

    const xCentrado = (this.pageWidth - finalWidth) / 2;
    this.pdf.addImage(
      imgData,
      "PNG",
      xCentrado,
      this.yPosition + 2,
      finalWidth,
      finalHeight,
      undefined,
      "FAST",
    );
    this.yPosition += altoMarco + 8;
  }

  /**
   * Agrega aspectos destacados al PDF
   */
  private agregarAspectosDestacados(
    aspectos: { aspecto: string; cantidad: number }[],
  ): void {
    if (aspectos.length === 0) return;

    const [r, g, b] = this.config.colorPrimario;

    this.verificarEspacio(40);

    // Título
    this.pdf.setFontSize(14);
    this.pdf.setTextColor(r, g, b);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.text(
      "Aspectos Mas Destacados por los Pacientes",
      15,
      this.yPosition,
    );
    this.yPosition += 8;

    // Aspectos en cuadrícula
    const etiquetas: Record<string, string> = {
      puntualidad: "Puntualidad",
      profesionalismo: "Profesionalismo",
      claridad: "Claridad",
      empatia: "Empatia",
      instalaciones: "Instalaciones",
      "tiempo-espera": "Tiempo de espera",
      seguimiento: "Seguimiento",
      recomendaria: "Recomendable",
    };

    const columnas = 2;
    const anchoColumna = (this.pageWidth - 40) / columnas;
    const altoAspecto = 18;

    aspectos.slice(0, 6).forEach((aspecto, index) => {
      const col = index % columnas;
      const row = Math.floor(index / columnas);
      const x = 15 + col * (anchoColumna + 10);
      const y = this.yPosition + row * (altoAspecto + 3);

      // Fondo verde claro
      this.pdf.setFillColor(240, 253, 244);
      this.pdf.roundedRect(x, y, anchoColumna, altoAspecto, 2, 2, "F");

      // Borde izquierdo verde
      this.pdf.setFillColor(34, 197, 94);
      this.pdf.roundedRect(x, y, 3, altoAspecto, 2, 2, "F");

      // Nombre del aspecto
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(60, 60, 60);
      this.pdf.setFont("helvetica", "bold");
      const etiqueta = etiquetas[aspecto.aspecto] || aspecto.aspecto;
      this.pdf.text(etiqueta, x + 6, y + 7);

      // Cantidad
      this.pdf.setFontSize(11);
      this.pdf.setTextColor(34, 197, 94);
      this.pdf.setFont("helvetica", "bold");
      this.pdf.text(aspecto.cantidad.toString(), x + anchoColumna - 8, y + 7, {
        align: "right",
      });

      // Texto "menciones"
      this.pdf.setFontSize(7);
      this.pdf.setTextColor(100, 100, 100);
      this.pdf.setFont("helvetica", "normal");
      this.pdf.text("menciones", x + 6, y + 13);
    });

    this.yPosition +=
      Math.ceil(Math.min(aspectos.length, 6) / columnas) * (altoAspecto + 3) +
      8;
  }

  /**
   * Agrega comentarios destacados al PDF
   */
  private agregarComentarios(estadisticas: EstadisticasEncuestas): void {
    // Mejores comentarios
    if (estadisticas.mejoresComentarios.length > 0) {
      this.verificarEspacio(30);

      this.pdf.setFontSize(14);
      this.pdf.setTextColor(34, 197, 94);
      this.pdf.setFont("helvetica", "bold");
      this.pdf.text("Comentarios Positivos Destacados", 15, this.yPosition);
      this.yPosition += 8;

      estadisticas.mejoresComentarios.slice(0, 3).forEach((comentario) => {
        this.verificarEspacio(22);

        this.pdf.setFillColor(240, 253, 244);
        const altoCaja = 16 + Math.ceil(comentario.comentario.length / 80) * 4;
        this.pdf.roundedRect(
          15,
          this.yPosition - 3,
          this.pageWidth - 30,
          altoCaja,
          2,
          2,
          "F",
        );

        // Borde izquierdo verde
        this.pdf.setFillColor(34, 197, 94);
        this.pdf.roundedRect(15, this.yPosition - 3, 4, altoCaja, 2, 2, "F");

        // Calificación
        this.pdf.setFontSize(9);
        this.pdf.setTextColor(234, 179, 8);
        this.pdf.setFont("helvetica", "bold");
        this.pdf.text(`${comentario.estrellas}/5`, 22, this.yPosition + 2);

        // Nombre especialista
        this.pdf.setFontSize(8);
        this.pdf.setTextColor(34, 197, 94);
        this.pdf.setFont("helvetica", "bold");
        this.pdf.text(
          comentario.especialista,
          this.pageWidth - 20,
          this.yPosition + 2,
          { align: "right" },
        );

        // Comentario
        this.pdf.setFontSize(9);
        this.pdf.setTextColor(60, 60, 60);
        this.pdf.setFont("helvetica", "italic");
        const lineas = this.pdf.splitTextToSize(
          `"${comentario.comentario}"`,
          this.pageWidth - 50,
        );
        this.pdf.text(lineas, 22, this.yPosition + 8);

        this.yPosition += altoCaja + 2;
      });

      this.yPosition += 5;
    }

    // Peores comentarios (áreas de mejora)
    if (estadisticas.peoresComentarios.length > 0) {
      this.verificarEspacio(30);

      this.pdf.setFontSize(14);
      this.pdf.setTextColor(239, 68, 68);
      this.pdf.setFont("helvetica", "bold");
      this.pdf.text("Areas de Mejora", 15, this.yPosition);
      this.yPosition += 8;

      estadisticas.peoresComentarios.slice(0, 2).forEach((comentario) => {
        this.verificarEspacio(22);

        this.pdf.setFillColor(254, 242, 242);
        const altoCaja = 16 + Math.ceil(comentario.comentario.length / 80) * 4;
        this.pdf.roundedRect(
          15,
          this.yPosition - 3,
          this.pageWidth - 30,
          altoCaja,
          2,
          2,
          "F",
        );

        // Borde izquierdo rojo
        this.pdf.setFillColor(239, 68, 68);
        this.pdf.roundedRect(15, this.yPosition - 3, 4, altoCaja, 2, 2, "F");

        // Calificación
        this.pdf.setFontSize(9);
        this.pdf.setTextColor(239, 68, 68);
        this.pdf.setFont("helvetica", "bold");
        this.pdf.text(`${comentario.estrellas}/5`, 22, this.yPosition + 2);

        // Nombre especialista
        this.pdf.setFontSize(8);
        this.pdf.setTextColor(239, 68, 68);
        this.pdf.setFont("helvetica", "bold");
        this.pdf.text(
          comentario.especialista,
          this.pageWidth - 20,
          this.yPosition + 2,
          { align: "right" },
        );

        // Comentario
        this.pdf.setFontSize(9);
        this.pdf.setTextColor(60, 60, 60);
        this.pdf.setFont("helvetica", "italic");
        const lineas = this.pdf.splitTextToSize(
          `"${comentario.comentario}"`,
          this.pageWidth - 50,
        );
        this.pdf.text(lineas, 22, this.yPosition + 8);

        this.yPosition += altoCaja + 2;
      });

      this.yPosition += 5;
    }
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
   * Genera el PDF completo con estadísticas y gráficos
   */
  public generar(
    estadisticas: EstadisticasEncuestas,
    canvases: HTMLCanvasElement[],
  ): void {
    // Primera página con encabezado
    this.agregarEncabezado();
    this.yPosition = 45;

    // Resumen ejecutivo
    this.agregarResumenEjecutivo(estadisticas);

    // Distribuciones visuales (barras de progreso)
    this.agregarDistribuciones(estadisticas);

    // Agregar gráficos de canvas (solo el de especialistas si existe)
    if (canvases.length > 0) {
      const graficoEspecialistas = SECCIONES_ENCUESTAS[2]; // Puntuación por Especialista
      this.agregarGrafico(canvases[0], graficoEspecialistas);
    }

    // Aspectos destacados
    if (estadisticas.aspectosDestacados.length > 0) {
      this.agregarAspectosDestacados(estadisticas.aspectosDestacados);
    }

    // Comentarios
    this.agregarComentarios(estadisticas);

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
 * Exporta las encuestas a PDF obteniendo los gráficos del DOM
 * @param estadisticas Estadísticas de las encuestas
 * @param config Configuración personalizada para el PDF
 */
export async function exportarEncuestasPdf(
  estadisticas: EstadisticasEncuestas,
  config: ConfiguracionPdfEncuestas = {},
): Promise<void> {
  // Obtener todos los canvas de los gráficos
  const canvases = Array.from(
    document.querySelectorAll("canvas"),
  ) as HTMLCanvasElement[];

  if (canvases.length === 0) {
    console.warn("No se encontraron gráficos para exportar en el PDF");
    // Continuar sin gráficos, solo con datos
  }

  // Crear generador y procesar
  const generador = new GeneradorPdfEncuestas(config);
  generador.generar(estadisticas, canvases);
  generador.descargar();
}

/**
 * Obtiene la información predefinida de las secciones
 * Útil para personalización o consulta
 */
export function obtenerInfoSecciones(): GraficoInfo[] {
  return [...SECCIONES_ENCUESTAS];
}
