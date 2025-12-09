import { CitaCompletaTurnos } from "../models/Turnos/CitaCompletaTurnos";

export interface DatosExportarTurnosPaciente {
  [key: string]: string | number;
  "ID Turno": number;
  "Fecha y Hora": string;
  Estado: string;
  Especialidad: string;
  Especialista: string;
  "Duración (min)": number;
  "Altura (cm)": string;
  "Peso (kg)": string;
  "Temperatura (°C)": string;
  "Presión Arterial": string;
  "Comentario Paciente": string;
  "Comentario Especialista": string;
  "Reseña Especialista": string;
}

export function formatearTurnosPacienteParaExcel(
  turnos: CitaCompletaTurnos[],
): DatosExportarTurnosPaciente[] {
  return turnos.map((turno) => ({
    "ID Turno": turno.citaId,
    "Fecha y Hora": formatearFechaHora(turno.fechaHora),
    Estado: formatearEstado(turno.estado),
    Especialidad: turno.especialidadNombre || "N/A",
    Especialista: turno.especialistaNombreCompleto || "N/A",
    "Duración (min)": turno.duracionMin,
    "Altura (cm)": turno.alturaCm ? turno.alturaCm.toString() : "N/A",
    "Peso (kg)": turno.pesoKg ? turno.pesoKg.toString() : "N/A",
    "Temperatura (°C)": turno.temperaturaC
      ? turno.temperaturaC.toString()
      : "N/A",
    "Presión Arterial": turno.presionArterial || "N/A",
    "Comentario Paciente": turno.comentarioPaciente || "N/A",
    "Comentario Especialista": turno.comentarioEspecialista || "N/A",
    "Reseña Especialista": turno.resenia || "N/A",
  }));
}

function formatearFechaHora(fecha: Date): string {
  const date = new Date(fecha);
  return date.toLocaleString("es-AR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatearEstado(estado: string): string {
  const estados: Record<string, string> = {
    solicitado: "Solicitado",
    aceptado: "Aceptado",
    rechazado: "Rechazado",
    cancelado: "Cancelado",
    completado: "Completado",
  };
  return estados[estado.toLowerCase()] || estado;
}
