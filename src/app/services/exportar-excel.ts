import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class ExportarExcel {
  async exportarAExcel(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    datos: any[],
    titulo: string,
    nombreArchivo: string,
    sheetName = "Reporte",
  ) {
    if (!datos || datos.length === 0) {
      console.warn("No hay datos para exportar.");
      return;
    }

    // Lazy loading: cargar ExcelJS y FileSaver solo cuando se necesiten
    const [{ Workbook }, FileSaver] = await Promise.all([
      import("exceljs"),
      import("file-saver"),
    ]);

    // Crear un nuevo workbook y worksheet
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Obtener las columnas (headers) del primer objeto
    const headers = Object.keys(datos[0]);

    // Agregar la fila del título
    const tituloRow = worksheet.addRow([titulo]);
    tituloRow.font = { bold: true, size: 14 };
    tituloRow.alignment = { horizontal: "center", vertical: "middle" };

    // Merge las celdas del título para que ocupen todas las columnas
    worksheet.mergeCells(1, 1, 1, headers.length);

    // Agregar la fila de encabezados
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };

    // Agregar los datos
    datos.forEach((item) => {
      const row = headers.map((header) => item[header]);
      worksheet.addRow(row);
    });

    // Auto-ajustar el ancho de las columnas
    worksheet.columns.forEach((column, index) => {
      let maxLength = headers[index].length;

      datos.forEach((row) => {
        const cellValue = row[headers[index]];
        const cellLength = cellValue ? cellValue.toString().length : 0;
        if (cellLength > maxLength) {
          maxLength = cellLength;
        }
      });

      column.width = maxLength + 2;
    });

    // Generar el archivo Excel
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const fecha = new Date().toISOString().slice(0, 10);
    FileSaver.saveAs(blob, `${nombreArchivo}_${fecha}.xlsx`);
  }
}
