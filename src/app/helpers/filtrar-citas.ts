import { CitaCompletaTurnos } from "../models/Turnos/CitaCompletaTurnos";

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function filtrarCitas(
  citas: CitaCompletaTurnos[],
  filtro: string,
): CitaCompletaTurnos[] {
  const filtroVal = normalizar(filtro.trim());

  if (filtroVal === "") {
    return citas;
  }

  return citas.filter((cita) => {
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
      ...cita.datosDinamicos.flatMap((d) => [d.clave, d.valor]),
    ];

    return valores.some((v) =>
      normalizar(v?.toString() || "").includes(filtroVal),
    );
  });
}
