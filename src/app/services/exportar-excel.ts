import { Injectable } from "@angular/core";
import { Workbook } from "exceljs";
import { saveAs } from "file-saver";

export interface OpcionesExportacionExcel {
  titulo?: string;
  nombreArchivo: string;
  nombreHoja?: string;
  incluirFecha?: boolean;
  anchoColumnaMinimo?: number;
  anchoColumnaMaximo?: number;
}

@Injectable({
  providedIn: "root",
})
export class ExportarExcel {
  async exportarAExcel<T extends Record<string, unknown>>(
    datos: T[],
    opciones: OpcionesExportacionExcel,
  ): Promise<void> {
    if (!datos || datos.length === 0) {
      console.warn("No hay datos para exportar.");
      return;
    }

    const {
      titulo,
      nombreArchivo,
      nombreHoja = "Datos",
      incluirFecha = true,
      anchoColumnaMinimo = 10,
      anchoColumnaMaximo = 50,
    } = opciones;

    try {
      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet(nombreHoja);

      // Obtener los encabezados de las columnas
      const headers = Object.keys(datos[0]);

      let filaActual = 1;

      // Agregar título si existe
      if (titulo) {
        const tituloRow = worksheet.addRow([titulo]);
        tituloRow.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
        tituloRow.alignment = { horizontal: "center", vertical: "middle" };
        tituloRow.height = 25;

        // Aplicar color de fondo al título
        tituloRow.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF4472C4" },
          };
        });

        worksheet.mergeCells(filaActual, 1, filaActual, headers.length);
        filaActual++;
      }

      // Agregar encabezados
      const headerRow = worksheet.addRow(headers);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.alignment = { horizontal: "center", vertical: "middle" };
      headerRow.height = 20;

      // Aplicar estilo a los encabezados
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF70AD47" },
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Agregar datos
      datos.forEach((item, index) => {
        const row = headers.map((header) => {
          const valor = item[header];
          // Manejar valores nulos
          return valor ?? "";
        });
        const dataRow = worksheet.addRow(row);

        // Centrar contenido de las celdas de datos
        dataRow.alignment = { horizontal: "center", vertical: "middle" };

        // Aplicar color alternado a las filas
        if (index % 2 === 0) {
          dataRow.eachCell((cell) => {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF2F2F2" },
            };
          });
        }

        // Agregar bordes a las celdas
        dataRow.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      // Ajustar ancho de columnas automáticamente
      worksheet.columns.forEach((column, index) => {
        let maxLength = headers[index].length;

        datos.forEach((row) => {
          const cellValue = row[headers[index]];
          const cellLength = cellValue ? cellValue.toString().length : 0;
          if (cellLength > maxLength) {
            maxLength = cellLength;
          }
        });

        // Aplicar límites al ancho
        const anchoCalculado = Math.min(
          Math.max(maxLength + 2, anchoColumnaMinimo),
          anchoColumnaMaximo,
        );
        column.width = anchoCalculado;
      });

      // Generar archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Generar nombre del archivo con fecha opcional
      let nombreFinal = nombreArchivo;
      if (incluirFecha) {
        const fecha = new Date().toISOString().slice(0, 10);
        nombreFinal = `${nombreArchivo}_${fecha}`;
      }

      saveAs(blob, `${nombreFinal}.xlsx`);
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      throw error;
    }
  }
}
