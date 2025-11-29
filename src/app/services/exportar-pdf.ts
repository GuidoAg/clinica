import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class ExportarPdf {
  async generarPDF(
    subtitulo: string,
    encabezados: string[],
    filas: (string | number)[][],
    titulo = "Documento",
    nombreArchivo = "documento",
    logoPath = "assets/logo_negro.png",
  ) {
    // Lazy loading: cargar jsPDF y autoTable solo cuando se necesiten
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);

    const doc = new jsPDF();
    const width = doc.internal.pageSize.getWidth();

    const logo = new Image();
    logo.src = logoPath;

    logo.onload = () => {
      const logoWidth = 40;
      const logoHeight = 40;
      const xPos = (width - logoWidth) / 2;
      const yPos = 10;

      doc.addImage(logo, "PNG", xPos, yPos, logoWidth, logoHeight);
      doc.setFontSize(10);
      doc.text(
        `Emitido el: ${new Date().toLocaleDateString("es-AR")}`,
        width - 60,
        10,
      );

      const yTitulo = yPos + logoHeight + 10;
      doc.setFontSize(18);
      const tituloWidth = doc.getTextWidth(titulo);
      doc.text(titulo, (width - tituloWidth) / 2, yTitulo);

      if (subtitulo) {
        doc.setFontSize(12);
        const subtituloWidth = doc.getTextWidth(subtitulo);
        doc.text(subtitulo, (width - subtituloWidth) / 2, yTitulo + 8);
      }

      autoTable(doc, {
        head: [encabezados],
        body: filas,
        startY: subtitulo ? yTitulo + 14 : yTitulo + 10,
        headStyles: {
          fillColor: [53, 112, 221],
          textColor: 255,
          halign: "center",
          fontStyle: "bold",
        },
        styles: {
          halign: "center",
        },
      });

      doc.save(`${nombreArchivo}_${new Date().toISOString().slice(0, 10)}.pdf`);
    };
  }

  async generarPDFConFoto(
    subtitulo: string,
    encabezados: string[],
    filas: (string | number)[][],
    fotoPerfilPath: string,
    titulo = "Documento",
    nombreArchivo = "documento",
    logoPath = "assets/logo_negro.png",
  ) {
    // Lazy loading: cargar jsPDF y autoTable solo cuando se necesiten
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);

    const doc = new jsPDF();
    const width = doc.internal.pageSize.getWidth();

    const logo = new Image();
    logo.src = logoPath;

    logo.onload = () => {
      const logoWidth = 20;
      const logoHeight = 20;
      const xLogo = 10;
      const yLogo = 10;

      doc.addImage(logo, "PNG", xLogo, yLogo, logoWidth, logoHeight);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Clínica VT", xLogo + logoWidth + 5, yLogo + 14);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Emitido el: ${new Date().toLocaleDateString("es-AR")}`,
        width - 60,
        yLogo + 5,
      );

      let yOffset = yLogo + logoHeight + 10;
      if (fotoPerfilPath) {
        const foto = new Image();
        foto.src = fotoPerfilPath;
        foto.onload = () => {
          const fotoSize = 30;
          const xFoto = (width - fotoSize) / 2;
          doc.setDrawColor(0);
          doc.setLineWidth(0.5);
          doc.addImage(
            foto,
            "JPEG",
            xFoto,
            yOffset,
            fotoSize,
            fotoSize,
            "",
            "FAST",
          );
          yOffset += fotoSize + 8;
          renderTextoYTabla();
        };
      }

      const renderTextoYTabla = () => {
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        const tituloWidth = doc.getTextWidth(titulo);
        doc.text(titulo, (width - tituloWidth) / 2, yOffset);
        yOffset += 8;

        if (subtitulo) {
          doc.setFontSize(12);
          doc.setFont("helvetica", "normal");
          const subtituloWidth = doc.getTextWidth(subtitulo);
          doc.text(subtitulo, (width - subtituloWidth) / 2, yOffset);
          yOffset += 8;
        }
        autoTable(doc, {
          head: [encabezados],
          body: filas,
          startY: yOffset,
          headStyles: {
            fillColor: [53, 112, 221],
            textColor: 255,
            halign: "center",
            fontStyle: "bold",
          },
          styles: {
            halign: "center",
          },
        });
        doc.save(
          `${nombreArchivo}_${new Date().toISOString().slice(0, 10)}.pdf`,
        );
      };
    };
  }

  async exportarGraficoPdf(
    canvas: HTMLCanvasElement,
    subtitulo: string,
    titulo = "Documento",
    nombreArchivo = "documento",
    logoPath = "assets/logo_negro_48.png",
  ) {
    // Lazy loading: cargar jsPDF solo cuando se necesite
    const { default: jsPDF } = await import("jspdf");

    const doc = new jsPDF();
    const width = doc.internal.pageSize.getWidth();

    const logo = new Image();
    logo.src = logoPath;

    logo.onload = () => {
      const logoWidth = 40;
      const logoHeight = 40;
      const xPos = (width - logoWidth) / 2;
      const yPos = 10;

      doc.addImage(logo, "PNG", xPos, yPos, logoWidth, logoHeight);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Clínica VT", xPos + logoWidth + 5, yPos + 14);

      doc.setFontSize(10);
      doc.text(
        `Emitido el: ${new Date().toLocaleDateString("es-AR")}`,
        width - 60,
        10,
      );

      const yTitulo = yPos + logoHeight + 10;
      doc.setFontSize(18);
      const tituloWidth = doc.getTextWidth(titulo);
      doc.text(titulo, (width - tituloWidth) / 2, yTitulo);

      if (subtitulo) {
        doc.setFontSize(12);
        const subtituloWidth = doc.getTextWidth(subtitulo);
        doc.text(subtitulo, (width - subtituloWidth) / 2, yTitulo + 8);
      }

      if (canvas) {
        const chartImage = canvas.toDataURL("image/png");
        const chartXPos = 40;
        const chartYPos = yTitulo + 30;
        const chartWidth = width - 70;
        const chartHeight = (chartWidth * canvas.height) / canvas.width;

        doc.addImage(
          chartImage,
          "PNG",
          chartXPos,
          chartYPos,
          chartWidth,
          chartHeight,
        );
      }

      doc.save(`${nombreArchivo}_${new Date().toISOString().slice(0, 10)}.pdf`);
    };
  }
}
