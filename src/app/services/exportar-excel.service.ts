import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

@Injectable({
  providedIn: 'root',
})
export class ExportarExcelService {
  constructor() {}

  exportarAExcel(
    datos: any[],
    titulo: string,
    nombreArchivo: string,
    sheetName: string = 'Reporte',
  ) {
    if (!datos || datos.length === 0) {
      console.warn('No hay datos para exportar.');
      return;
    }

    const hojaComoArray = [
      [titulo],
      ...(XLSX.utils.sheet_to_json(XLSX.utils.json_to_sheet(datos), {
        header: 1,
      }) as any[][]),
    ];

    const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(hojaComoArray);

    const colWidths = hojaComoArray[1].map((_: any, colIndex: number) => {
      const maxLength = hojaComoArray.reduce((max, row) => {
        const cell = row[colIndex];
        const cellLength = cell ? cell.toString().length : 0;
        return Math.max(max, cellLength);
      }, 10);
      return { wch: maxLength + 2 };
    });
    worksheet['!cols'] = colWidths;

    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: hojaComoArray[1].length - 1 } },
    ];

    worksheet['A1'].s = {
      alignment: { horizontal: 'center' },
      font: { bold: true },
    };

    const workbook: XLSX.WorkBook = {
      Sheets: { [sheetName]: worksheet },
      SheetNames: [sheetName],
    };

    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
      cellStyles: true,
    });

    const blob: Blob = new Blob([excelBuffer], {
      type: 'application/octet-stream',
    });

    const fecha = new Date().toISOString().slice(0, 10);
    FileSaver.saveAs(blob, `${nombreArchivo}_${fecha}.xlsx`);
  }
}
