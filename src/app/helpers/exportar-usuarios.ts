import { Usuario } from "../models/Auth/Usuario";

export interface DatosExportarUsuarios {
  [key: string]: string | number;
  ID: number;
  Nombre: string;
  Apellido: string;
  Email: string;
  DNI: string;
  Edad: string;
  Rol: string;
  "Email Verificado": string;
  "Obra Social": string;
  Especialidades: string;
  "Validado Admin": string;
  Estado: string;
}

export function formatearUsuariosParaExcel(
  usuarios: Usuario[],
): DatosExportarUsuarios[] {
  return usuarios.map((usuario) => ({
    ID: usuario.id,
    Nombre: usuario.nombre,
    Apellido: usuario.apellido,
    Email: usuario.email,
    DNI: usuario.dni,
    Edad: usuario.edad,
    Rol: formatearRol(usuario.rol),
    "Email Verificado": usuario.emailVerificado ? "Sí" : "No",
    "Obra Social": usuario.obraSocial || "N/A",
    Especialidades: formatearEspecialidades(usuario.especialidades),
    "Validado Admin":
      usuario.rol === "especialista"
        ? usuario.validadoAdmin
          ? "Sí"
          : "No"
        : "N/A",
    Estado:
      usuario.rol === "especialista"
        ? usuario.activo
          ? "Activo"
          : "Inactivo"
        : "N/A",
  }));
}

function formatearRol(rol: string): string {
  const roles: Record<string, string> = {
    admin: "Administrador",
    paciente: "Paciente",
    especialista: "Especialista",
  };
  return roles[rol] || rol;
}

function formatearEspecialidades(
  especialidades?: { id: number; nombre: string }[],
): string {
  if (!especialidades || especialidades.length === 0) {
    return "N/A";
  }
  return especialidades.map((e) => e.nombre).join(", ");
}
