import { Injectable } from "@angular/core";

export interface OpcionesExportacionPdf {
  titulo?: string;
  subtitulo?: string;
  nombreArchivo: string;
  incluirFecha?: boolean;
  incluirLogo?: boolean;
  logoPath?: string;
  orientacion?: "portrait" | "landscape";
  colorEncabezado?: [number, number, number];
}

export interface SeccionPdf {
  titulo?: string;
  subtitulo?: string;
  encabezados: string[];
  filas: (string | number)[][];
}

@Injectable({
  providedIn: "root",
})
export class ExportarPdf {
  async exportarAPdf(
    datos: SeccionPdf,
    opciones: OpcionesExportacionPdf,
  ): Promise<void> {
    const {
      titulo = "Documento",
      subtitulo,
      nombreArchivo,
      incluirFecha = true,
      incluirLogo = true,
      logoPath = "assets/imagenes/logo_png.png",
      orientacion = "portrait",
      colorEncabezado = [53, 112, 221],
    } = opciones;

    // Lazy loading: cargar jsPDF y autoTable solo cuando se necesiten
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);

    const doc = new jsPDF({ orientation: orientacion });
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    const agregarHeader = (yInicial = 10) => {
      const yOffset = yInicial;

      if (incluirLogo) {
        const logo = new Image();
        logo.src = logoPath;
        return new Promise<number>((resolve) => {
          logo.onload = () => {
            const logoWidth = 35;
            const logoHeight = 35;
            const xLogo = 15;
            doc.addImage(logo, "PNG", xLogo, yOffset, logoWidth, logoHeight);

            // Nombre del centro al lado del logo
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(53, 112, 221);
            doc.text(
              "Centro Médico Insua",
              xLogo + logoWidth + 8,
              yOffset + 12,
            );

            // Fecha en el otro extremo
            if (incluirFecha) {
              doc.setFontSize(9);
              doc.setFont("helvetica", "normal");
              doc.setTextColor(100, 100, 100);
              const fechaTexto = `Emitido: ${new Date().toLocaleDateString(
                "es-AR",
                {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                },
              )}`;
              doc.text(fechaTexto, width - 15, yOffset + 12, {
                align: "right",
              });
            }

            // Línea decorativa debajo del header
            doc.setDrawColor(53, 112, 221);
            doc.setLineWidth(0.5);
            doc.line(
              15,
              yOffset + logoHeight + 5,
              width - 15,
              yOffset + logoHeight + 5,
            );

            doc.setTextColor(0, 0, 0);
            resolve(yOffset + logoHeight + 15);
          };
        });
      } else {
        // Header sin logo
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(53, 112, 221);
        const centroTexto = "Centro Médico Insua";
        const centroWidth = doc.getTextWidth(centroTexto);
        doc.text(centroTexto, (width - centroWidth) / 2, yOffset + 8);

        if (incluirFecha) {
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 100, 100);
          const fechaTexto = `Emitido: ${new Date().toLocaleDateString(
            "es-AR",
            {
              day: "2-digit",
              month: "long",
              year: "numeric",
            },
          )}`;
          doc.text(fechaTexto, width - 15, yOffset + 8, { align: "right" });
        }

        // Línea decorativa
        doc.setDrawColor(53, 112, 221);
        doc.setLineWidth(0.5);
        doc.line(15, yOffset + 15, width - 15, yOffset + 15);

        doc.setTextColor(0, 0, 0);
        return Promise.resolve(yOffset + 25);
      }
    };

    const agregarFooter = () => {
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(150, 150, 150);
      doc.text(
        "Centro Médico Insua - Documento Confidencial",
        width / 2,
        height - 10,
        { align: "center" },
      );
      doc.setTextColor(0, 0, 0);
    };

    const renderPdf = async () => {
      const yOffset = await agregarHeader();
      await renderContenido(yOffset);
      agregarFooter();

      // Guardar archivo
      let nombreFinal = nombreArchivo;
      if (incluirFecha) {
        const fecha = new Date().toISOString().slice(0, 10);
        nombreFinal = `${nombreArchivo}_${fecha}`;
      }

      doc.save(`${nombreFinal}.pdf`);
    };

    const renderContenido = async (yInicial: number) => {
      let yOffset = yInicial;

      // Título del documento con caja deco
      if (titulo) {
        // Caja de fondo para el título
        doc.setFillColor(53, 112, 221);
        doc.roundedRect(15, yOffset - 5, width - 30, 15, 2, 2, "F");

        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        const tituloWidth = doc.getTextWidth(titulo);
        doc.text(titulo, (width - tituloWidth) / 2, yOffset + 5);
        doc.setTextColor(0, 0, 0);
        yOffset += 20;
      }

      // Subtítulo
      if (subtitulo) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(80, 80, 80);
        const subtituloWidth = doc.getTextWidth(subtitulo);
        doc.text(subtitulo, (width - subtituloWidth) / 2, yOffset);
        doc.setTextColor(0, 0, 0);
        yOffset += 10;
      }

      // Tabla con estilos
      autoTable(doc, {
        head: [datos.encabezados],
        body: datos.filas,
        startY: yOffset,
        margin: { left: 15, right: 15 },
        headStyles: {
          fillColor: colorEncabezado,
          textColor: 255,
          halign: "center",
          fontStyle: "bold",
          fontSize: 10,
          cellPadding: 5,
        },
        styles: {
          halign: "center",
          fontSize: 9,
          cellPadding: 4,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        tableLineColor: [200, 200, 200],
        tableLineWidth: 0.1,
      });
    };

    renderPdf();
  }

  async exportarAPdfMultiplesSecciones(
    secciones: SeccionPdf[],
    opciones: OpcionesExportacionPdf,
  ): Promise<void> {
    const {
      titulo = "Documento",
      nombreArchivo,
      incluirFecha = true,
      incluirLogo = true,
      logoPath = "assets/imagenes/logo_png.png",
      orientacion = "portrait",
      colorEncabezado = [53, 112, 221],
    } = opciones;

    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);

    const doc = new jsPDF({ orientation: orientacion });
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    let numeroPagina = 1;

    const agregarHeader = (yInicial = 10) => {
      const yOffset = yInicial;

      if (incluirLogo) {
        const logo = new Image();
        logo.src = logoPath;
        return new Promise<number>((resolve) => {
          logo.onload = () => {
            const logoWidth = 35;
            const logoHeight = 35;
            const xLogo = 15;
            doc.addImage(logo, "PNG", xLogo, yOffset, logoWidth, logoHeight);

            // Nombre del centro al lado del logo
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(53, 112, 221);
            doc.text(
              "Centro Médico Insua",
              xLogo + logoWidth + 8,
              yOffset + 12,
            );

            // Fecha en el otro extremo
            if (incluirFecha) {
              doc.setFontSize(9);
              doc.setFont("helvetica", "normal");
              doc.setTextColor(100, 100, 100);
              const fechaTexto = `Emitido: ${new Date().toLocaleDateString(
                "es-AR",
                {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                },
              )}`;
              doc.text(fechaTexto, width - 15, yOffset + 12, {
                align: "right",
              });
            }

            // Línea decorativa debajo del header
            doc.setDrawColor(53, 112, 221);
            doc.setLineWidth(0.5);
            doc.line(
              15,
              yOffset + logoHeight + 5,
              width - 15,
              yOffset + logoHeight + 5,
            );

            doc.setTextColor(0, 0, 0);
            resolve(yOffset + logoHeight + 15);
          };
        });
      } else {
        // Header sin logo
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(53, 112, 221);
        const centroTexto = "Centro Médico Insua";
        const centroWidth = doc.getTextWidth(centroTexto);
        doc.text(centroTexto, (width - centroWidth) / 2, yOffset + 8);

        if (incluirFecha) {
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 100, 100);
          const fechaTexto = `Emitido: ${new Date().toLocaleDateString(
            "es-AR",
            {
              day: "2-digit",
              month: "long",
              year: "numeric",
            },
          )}`;
          doc.text(fechaTexto, width - 15, yOffset + 8, { align: "right" });
        }

        // Línea decorativa
        doc.setDrawColor(53, 112, 221);
        doc.setLineWidth(0.5);
        doc.line(15, yOffset + 15, width - 15, yOffset + 15);

        doc.setTextColor(0, 0, 0);
        return Promise.resolve(yOffset + 25);
      }
    };

    const agregarFooter = () => {
      // Línea superior del footer
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(15, height - 18, width - 15, height - 18);

      // Texto del centro
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(120, 120, 120);
      doc.text(
        "Centro Médico Insua - Documento Confidencial",
        width / 2,
        height - 12,
        { align: "center" },
      );

      // Número de página
      doc.setFont("helvetica", "normal");
      doc.text(`Página ${numeroPagina}`, width - 20, height - 12, {
        align: "right",
      });

      doc.setTextColor(0, 0, 0);
    };

    const renderPdf = async () => {
      const yOffset = await agregarHeader();
      await renderContenido(yOffset);
      agregarFooter();

      // Guardar archivo
      let nombreFinal = nombreArchivo;
      if (incluirFecha) {
        const fecha = new Date().toISOString().slice(0, 10);
        nombreFinal = `${nombreArchivo}_${fecha}`;
      }

      doc.save(`${nombreFinal}.pdf`);
    };

    const renderContenido = async (yInicial: number) => {
      let yOffset = yInicial;

      if (titulo) {
        // Caja de fondo para el título
        doc.setFillColor(53, 112, 221);
        doc.roundedRect(15, yOffset - 5, width - 30, 16, 2, 2, "F");

        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        const tituloWidth = doc.getTextWidth(titulo);
        doc.text(titulo, (width - tituloWidth) / 2, yOffset + 6);
        doc.setTextColor(0, 0, 0);
        yOffset += 25;
      }

      // Renderizar cada sección
      secciones.forEach((seccion) => {
        if (yOffset > height - 60) {
          agregarFooter();
          doc.addPage();
          numeroPagina++;
          yOffset = 20;
        }

        // Título de la sección con estilo
        if (seccion.titulo) {
          // Barra lateral de color
          doc.setFillColor(53, 112, 221);
          doc.rect(15, yOffset - 3, 3, 10, "F");

          doc.setFontSize(13);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(53, 112, 221);
          doc.text(seccion.titulo, 22, yOffset + 4);
          doc.setTextColor(0, 0, 0);
          yOffset += 10;
        }

        // Subtítulo de la sección
        if (seccion.subtitulo) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "italic");
          doc.setTextColor(100, 100, 100);
          doc.text(seccion.subtitulo, 22, yOffset);
          doc.setTextColor(0, 0, 0);
          yOffset += 8;
        }

        autoTable(doc, {
          head: [seccion.encabezados],
          body: seccion.filas,
          startY: yOffset,
          margin: { left: 15, right: 15 },
          headStyles: {
            fillColor: colorEncabezado,
            textColor: 255,
            halign: "center",
            fontStyle: "bold",
            fontSize: 9,
            cellPadding: 4,
          },
          styles: {
            halign: "left",
            fontSize: 8.5,
            cellPadding: 3,
            lineColor: [220, 220, 220],
            lineWidth: 0.1,
            textColor: [50, 50, 50],
          },
          alternateRowStyles: {
            fillColor: [248, 248, 250],
          },
          bodyStyles: {
            minCellHeight: 8,
          },
          columnStyles: {
            0: { fontStyle: "bold", cellWidth: 60, fillColor: [240, 245, 250] },
          },
          tableLineColor: [200, 200, 200],
          tableLineWidth: 0.1,
          didDrawPage: (data) => {
            // Si se agregó una nueva página en la tabla, agregar header y footer
            if (data.pageNumber > numeroPagina) {
              numeroPagina = data.pageNumber;
            }
          },
        });

        // Actualiza yOffset para la siguiente sección
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        yOffset = (doc as any).lastAutoTable.finalY + 12;
      });
    };

    renderPdf();
  }
}
