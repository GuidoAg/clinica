import { ExportarPdf, SeccionPdf } from "../services/exportar-pdf";
import { CitaCompletaTurnos } from "../models/Turnos/CitaCompletaTurnos";
import { Usuario } from "../models/Auth/Usuario";

export interface OpcionesHistoriaClinica {
  especialidadFiltro?: string; // Filtrar por especialidad específica
  incluirDatosDinamicos?: boolean; // Incluir campos dinámicos
}

/**
 * Exporta la historia clínica de un paciente a PDF
 * @param paciente Datos del paciente
 * @param citas Array de citas completas del paciente
 * @param exportarPdf Servicio de exportación PDF
 * @param opciones Opciones de configuración
 */
export async function exportarHistoriaClinicaPdf(
  paciente: Usuario,
  citas: CitaCompletaTurnos[],
  exportarPdf: ExportarPdf,
  opciones: OpcionesHistoriaClinica = {},
): Promise<void> {
  const { especialidadFiltro, incluirDatosDinamicos = true } = opciones;

  // Filtrar citas si se especifica especialidad
  let citasFiltradas = citas;
  if (especialidadFiltro) {
    citasFiltradas = citas.filter(
      (cita) => cita.especialidadNombre === especialidadFiltro,
    );
  }

  // Ordenar citas por fecha (más recientes primero)
  citasFiltradas.sort(
    (a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime(),
  );

  if (citasFiltradas.length === 0) {
    throw new Error("No hay citas para exportar con los filtros aplicados");
  }

  // Crear secciones del PDF
  const secciones: SeccionPdf[] = [];

  // Sección 1: Información del paciente
  secciones.push({
    titulo: "Datos del Paciente",
    encabezados: ["Campo", "Valor"],
    filas: [
      ["Nombre completo", `${paciente.nombre} ${paciente.apellido}`],
      ["DNI", paciente.dni.toString()],
      ["Edad", paciente.edad.toString()],
      ["Email", paciente.email],
      ["Obra Social", paciente.obraSocial || "No registrada"],
    ],
  });

  // Sección 2: Resumen de atenciones
  const especialidadesUnicas = [
    ...new Set(citasFiltradas.map((c) => c.especialidadNombre)),
  ];

  secciones.push({
    titulo: "Resumen de Atenciones",
    encabezados: ["Especialidad", "Cantidad de Consultas"],
    filas: especialidadesUnicas.map((esp) => [
      esp,
      citasFiltradas.filter((c) => c.especialidadNombre === esp).length,
    ]),
  });

  // Sección 3: Historial de citas
  citasFiltradas.forEach((cita, index) => {
    const fechaCita = new Date(cita.fechaHora);
    const fechaFormateada = fechaCita.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const horaFormateada = fechaCita.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Datos básicos de la cita
    const filasCita: (string | number)[][] = [
      ["Fecha", fechaFormateada],
      ["Hora", horaFormateada],
      ["Especialidad", cita.especialidadNombre],
      ["Especialista", cita.especialistaNombreCompleto],
      ["Estado", cita.estado],
    ];

    // Datos vitales si existen
    if (
      cita.alturaCm ||
      cita.pesoKg ||
      cita.temperaturaC ||
      cita.presionArterial
    ) {
      filasCita.push(["--- Signos Vitales ---", "---"]);

      if (cita.alturaCm) {
        filasCita.push(["Altura", `${cita.alturaCm} cm`]);
      }
      if (cita.pesoKg) {
        filasCita.push(["Peso", `${cita.pesoKg} kg`]);
      }
      if (cita.temperaturaC) {
        filasCita.push(["Temperatura", `${cita.temperaturaC} °C`]);
      }
      if (cita.presionArterial) {
        filasCita.push(["Presión Arterial", cita.presionArterial]);
      }
    }

    // Comentarios y reseñas
    if (cita.comentarioPaciente) {
      filasCita.push(["--- Comentarios ---", "---"]);
      filasCita.push(["Comentario del paciente", cita.comentarioPaciente]);
    }
    if (cita.comentarioEspecialista) {
      filasCita.push([
        "Comentario del especialista",
        cita.comentarioEspecialista,
      ]);
    }
    if (cita.resenia) {
      filasCita.push(["Reseña", cita.resenia]);
    }

    // Datos dinámicos
    if (
      incluirDatosDinamicos &&
      cita.datosDinamicos &&
      cita.datosDinamicos.length > 0
    ) {
      filasCita.push(["--- Datos Adicionales ---", "---"]);
      cita.datosDinamicos.forEach((dato) => {
        filasCita.push([dato.clave, dato.valor]);
      });
    }

    secciones.push({
      titulo: `Consulta ${citasFiltradas.length - index} - ${cita.especialidadNombre}`,
      subtitulo: `${fechaFormateada} ${horaFormateada}`,
      encabezados: ["Campo", "Información"],
      filas: filasCita,
    });
  });

  // Generar el PDF
  await exportarPdf.exportarAPdfMultiplesSecciones(secciones, {
    titulo: `Historia Clínica - ${paciente.nombre} ${paciente.apellido}`,
    nombreArchivo: `historia_clinica_${paciente.dni}`,
    incluirFecha: true,
    incluirLogo: true,
    logoPath: "assets/imagenes/logo_png.png",
    colorEncabezado: [53, 112, 221],
  });
}

/**
 * Obtiene las especialidades únicas de las citas de un paciente
 * @param citas Array de citas del paciente
 * @returns Array de nombres de especialidades únicas
 */
export function obtenerEspecialidadesUnicas(
  citas: CitaCompletaTurnos[],
): string[] {
  const especialidades = new Set(citas.map((cita) => cita.especialidadNombre));
  return Array.from(especialidades).sort();
}
