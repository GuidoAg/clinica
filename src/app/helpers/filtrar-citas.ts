import { CitaCompletaTurnos } from "../models/Turnos/CitaCompletaTurnos";

/**
 * Filtra un array de citas basándose en un valor de búsqueda.
 * Busca en todos los campos visibles de la cita, excluyendo nombres de propiedades e IDs internos.
 *
 * @param citas - Array de citas a filtrar
 * @param filtro - Texto de búsqueda (case insensitive)
 * @returns Array filtrado de citas
 */
export function filtrarCitas(
  citas: CitaCompletaTurnos[],
  filtro: string,
): CitaCompletaTurnos[] {
  const filtroVal = filtro.toLowerCase().trim();

  if (filtroVal === "") {
    return citas;
  }

  return citas.filter((cita) => {
    // Crear un array con todos los valores (sin nombres de propiedades)
    const valores = [
      cita.citaId?.toString(),
      cita.fechaHora?.toLocaleString(),
      cita.estado,
      cita.alturaCm?.toString(),
      cita.pesoKg?.toString(),
      cita.temperaturaC?.toString(),
      cita.presionArterial,
      cita.pacienteNombreCompleto,
      cita.especialistaNombreCompleto,
      cita.especialidadNombre,
      // Agregar valores de datos dinámicos (solo clave y valor, no id)
      ...cita.datosDinamicos.flatMap((d) => [d.clave, d.valor]),
    ];

    // Buscar en cualquiera de los valores
    return valores.some((v) => v?.toString().toLowerCase().includes(filtroVal));
  });
}
