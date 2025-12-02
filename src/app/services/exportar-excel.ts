import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class ExportarExcel {
  async exportarAExcel(
    datos: any[],
    titulo: string,
    nombreArchivo: string,
    sheetName = "Reporte",
  ) {
    if (!datos || datos.length === 0) {
      console.warn("No hay datos para exportar.");
      return;
    }

    const [{ Workbook }, FileSaver] = await Promise.all([
      import("exceljs"),
      import("file-saver"),
    ]);

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    const headers = Object.keys(datos[0]);

    const tituloRow = worksheet.addRow([titulo]);
    tituloRow.font = { bold: true, size: 14 };
    tituloRow.alignment = { horizontal: "center", vertical: "middle" };

    worksheet.mergeCells(1, 1, 1, headers.length);

    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };

    datos.forEach((item) => {
      const row = headers.map((header) => item[header]);
      worksheet.addRow(row);
    });

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

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const fecha = new Date().toISOString().slice(0, 10);
    FileSaver.saveAs(blob, `${nombreArchivo}_${fecha}.xlsx`);
  }
}
