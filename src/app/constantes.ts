/**
 * Constantes centralizadas para nombres de tablas y queries de Supabase
 *
 * Ventajas:
 * - Fuente única de verdad para nombres de tablas
 * - Facilita refactorización (cambiar nombre en un solo lugar)
 * - Permite identificar queries duplicadas
 * - Reduce errores de tipeo
 * - Mejor autocompletado en el IDE
 */

// =============================================================================
// NOMBRES DE TABLAS
// =============================================================================

export const TABLA = {
  // Tablas de autenticación y perfiles
  PERFILES: "perfiles",
  DETALLES_ESPECIALISTA: "detalles_especialista",
  DETALLES_PACIENTE: "detalles_paciente",

  // Vistas (generadas por DB)
  VISTA_PERFILES_CON_EMAIL: "vista_perfiles_con_email",
  VISTA_CITAS_ENTERAS: "vista_citas_enteras",
  VISTA_ESPECIALISTAS: "vista_especialistas",
  VISTA_ESPECIALISTAS_FULL: "vista_especialistas_full",
  VISTA_ESPECIALISTA_ESPECIALIDADES: "vista_especialista_especialidades",
  VISTA_DISPONIBILIDADES: "vista_disponibilidades",
  VISTA_DISPONIBILIDAD_CON_DURACION: "vista_disponibilidad_con_duracion",

  // Tablas de citas y turnos
  CITAS: "citas",
  DISPONIBILIDADES: "disponibilidades",

  // Tablas de especialidades
  ESPECIALIDADES: "especialidades",
  ESPECIALISTA_ESPECIALIDADES: "especialista_especialidades",

  // Tablas de datos médicos
  REGISTROS_MEDICOS: "registros_medicos",
  DATOS_MEDICOS_DINAMICOS: "datos_medicos_dinamicos",

  // Tablas de feedback
  ENCUESTA: "encuesta",

  // Tablas de seguimiento
  REGISTRO_INGRESOS: "registro_ingresos",

  // Tablas auxiliares
  CAPTCHA: "captcha",
} as const;

// =============================================================================
// QUERIES COMPLETAS REUTILIZABLES
// =============================================================================

/**
 * Queries para vista_perfiles_con_email
 * Campos disponibles: auth_id, nombre, apellido, edad, dni, url_imagen_perfil,
 * email_verificado, creado_en, rol, id, email, email_verificado_real
 */
export const QUERY_VISTA_PERFILES = {
  /**
   * SELECT completo: todos los campos de la vista
   * Usado en: Usuarios.obtenerUsuarios(), obtenerUsuariosPorRol()
   * NOTA: Para especialistas con especialidades usar VISTA_ESPECIALISTAS_FULL
   */
  TODOS_CAMPOS: `
    id,
    auth_id,
    nombre,
    apellido,
    edad,
    dni,
    url_imagen_perfil, 
    rol,
    email,
    email_verificado,
    email_verificado_real,
    creado_en
  `,

  /**
   * SELECT identificación + contacto
   * Usado en: obtenerUsuariosPorRol(), listas de usuarios
   */
  IDENTIFICACION_CONTACTO:
    "id, nombre, apellido, email, rol, url_imagen_perfil",

  /**
   * SELECT mínimo: solo datos identificatorios
   * Usado en: listas, dropdowns, búsquedas rápidas
   */
  IDENTIFICACION_BASICA: "id, nombre, apellido, rol",
} as const;

/**
 * Queries para tabla disponibilidades
 */
export const QUERY_DISPONIBILIDADES = {
  /**
   * SELECT dia_semana (para listar días habilitados)
   * Usado en: DisponibilidadService.obtenerDiasEspecialista()
   * WHERE: perfil_id = X AND habilitado = true
   */
  DIA_SEMANA: "dia_semana",

  /**
   * SELECT dia_semana + horarios (para calcular slots disponibles)
   * Usado en: DisponibilidadService.obtenerDisponibilidadDia(), obtenerTodasDisponibilidades()
   * WHERE: perfil_id = X AND habilitado = true
   */
  DIA_HORA_INICIO_FIN: "dia_semana, hora_inicio, hora_fin",

  /**
   * SELECT id (para verificar existencia)
   * Usado en: DisponibilidadService.tieneDisponibilidadConfigurada()
   * WHERE: perfil_id = X AND habilitado = true LIMIT 1
   */
  SOLO_ID: "id",
} as const;

/**
 * Queries para tabla citas
 */
export const QUERY_CITAS = {
  /**
   * SELECT * (INSERT retorna todos los campos)
   * Usado en: CitasService.darAltaCita()
   */
  TODOS_CAMPOS: "*",

  /**
   * SELECT fecha_hora + duracion_min (para calcular bloques ocupados)
   * Usado en: CitasService.obtenerCitasEspecialista(), obtenerCitasPaciente()
   * WHERE: (especialista_id = X OR paciente_id = X) AND fecha_hora BETWEEN ...
   */
  FECHA_DURACION: "fecha_hora, duracion_min",

  /**
   * SELECT fecha_hora + duracion + participantes (para validar solapamientos)
   * Usado en: CitasService.obtenerCitasCombinadasDia()
   * WHERE: (especialista_id = X OR paciente_id = Y) AND fecha_hora BETWEEN ...
   */
  FECHA_DURACION_PARTICIPANTES:
    "fecha_hora, duracion_min, especialista_id, paciente_id",
} as const;

/**
 * Queries para tabla datos_medicos_dinamicos
 */
export const QUERY_DATOS_MEDICOS_DINAMICOS = {
  /**
   * SELECT * (para obtener todos los pares clave-valor)
   * Usado en: CitasService.obtenerDatosMedicosExtrasCita()
   * WHERE: cita_id = X
   */
  TODOS_CAMPOS: "*",
} as const;

/**
 * Queries para vista_especialistas_full
 * Devuelve especialistas con sus especialidades y disponibilidades en formato JSON
 */
export const QUERY_VISTA_ESPECIALISTAS_FULL = {
  /**
   * SELECT completo: especialista + especialidades[] + disponibilidades[]
   * Usado en: Turnos.obtenerEspecialistas()
   */
  TODOS_CAMPOS: `
    especialista_id,
    nombre,
    apellido,
    url_imagen_perfil,
    validado_admin,
    activo,
    especialidades,
    disponibilidades
  `,

  /**
   * SELECT sin disponibilidades (solo especialista + especialidades)
   * Usado en: listar especialistas con sus especialidades
   */
  ESPECIALISTA_ESPECIALIDADES: `
    especialista_id,
    nombre,
    apellido,
    url_imagen_perfil,
    especialidades
  `,
} as const;

/**
 * Queries para vista_citas_enteras
 * Devuelve citas con toda la información relacionada (paciente, especialista, especialidad, registros médicos)
 */
export const QUERY_VISTA_CITAS_ENTERAS = {
  /**
   * SELECT completo: todos los campos de la vista
   * Usado en: CitasService.obtenerHistoriaClinicaCompleta()
   */
  TODOS_CAMPOS: `
    cita_id,
    fecha_hora,
    duracion_min,
    estado,
    comentario_paciente,
    comentario_especialista,
    resenia,
    paciente_id,
    paciente_nombre_completo,
    especialista_id,
    especialista_nombre_completo,
    especialidad_id,
    especialidad_nombre,
    altura_cm,
    peso_kg,
    temperatura_c,
    presion_arterial
  `,

  /**
   * SELECT resumen: solo datos principales de la cita
   * Usado en: listas de citas, calendarios
   */
  RESUMEN_CITA: `
    cita_id,
    fecha_hora,
    duracion_min,
    estado,
    paciente_nombre_completo,
    especialista_nombre_completo,
    especialidad_nombre
  `,
} as const;

/**
 * Queries para tabla registros_medicos
 */
export const QUERY_REGISTROS_MEDICOS = {
  /**
   * SELECT * (para obtener todos los registros médicos de una cita)
   * Usado en: CitasService.obtenerRegistroMedicoCita()
   * WHERE: cita_id = X
   */
  TODOS_CAMPOS: "*",
} as const;

/**
 * Queries para tabla perfiles
 */
export const QUERY_PERFILES = {
  /**
   * SELECT identificación básica
   * Usado en: Estadísticas, listados de usuarios
   */
  IDENTIFICACION: "id, nombre, apellido, rol",

  /**
   * SELECT identificación con email
   * Usado en: Gestión de usuarios
   */
  IDENTIFICACION_CON_EMAIL: "id, nombre, apellido, rol, email",

  /**
   * SELECT nombre completo
   * Usado en: Estadísticas de médicos
   */
  NOMBRE_COMPLETO: "id, nombre, apellido",
} as const;

/**
 * Queries para tabla especialidades
 */
export const QUERY_ESPECIALIDADES = {
  /**
   * SELECT básico (id y nombre)
   * Usado en: Dropdowns, selecciones simples
   */
  BASICO: "id, nombre",

  /**
   * SELECT completo con icono
   * Usado en: Registro de especialistas, listados visuales
   */
  COMPLETO: "id, nombre, url_icono",
} as const;

/**
 * Queries para tabla registro_ingresos
 */
export const QUERY_REGISTRO_INGRESOS = {
  /**
   * SELECT para log de ingresos
   * Usado en: Estadísticas.obtenerLogIngresos()
   */
  BASICO: "fecha_ingreso, perfil_id",
} as const;

/**
 * Queries complejas para vista_perfiles_con_email con relaciones
 */
export const QUERY_VISTA_PERFILES_RELACIONES = {
  /**
   * SELECT completo con todas las relaciones (paciente, especialista, especialidades)
   * Usado en: UsuariosService.obtenerTodosUsuarios()
   */
  COMPLETO_CON_RELACIONES: `
    id,
    auth_id,
    nombre,
    apellido,
    edad,
    dni,
    url_imagen_perfil, 
    rol,
    email,
    email_verificado_real,
    detalles_paciente (
      obra_social,
      url_imagen_fondo
    ),
    detalles_especialista (
      validado_admin,
      activo
    ),
    especialista_especialidades (
      duracion,
      especialidades (
        id,
        nombre,
        url_icono
      )
    )
  `,

  /**
   * SELECT para pacientes verificados
   * Usado en: UsuariosService.obtenerPacientesVerificados()
   */
  PACIENTES_VERIFICADOS: `
    id,
    auth_id,
    nombre,
    apellido,
    edad,
    dni,
    url_imagen_perfil,
    email,
    email_verificado_real,
    detalles_paciente (
      obra_social,
      url_imagen_fondo
    )
  `,
} as const;

// =============================================================================
// ÍNDICES RECOMENDADOS PARA OPTIMIZACIÓN
// =============================================================================

/**
 * Documentación de índices necesarios en la base de datos
 *
 * Para crear estos índices en Supabase, ejecutar:
 *
 * -- Índices para tabla citas (queries más frecuentes)
 * CREATE INDEX IF NOT EXISTS idx_citas_especialista ON citas(especialista_id);
 * CREATE INDEX IF NOT EXISTS idx_citas_paciente ON citas(paciente_id);
 * CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(fecha_hora);
 * CREATE INDEX IF NOT EXISTS idx_citas_estado ON citas(estado);
 * CREATE INDEX IF NOT EXISTS idx_citas_fecha_especialista ON citas(fecha_hora, especialista_id);
 * CREATE INDEX IF NOT EXISTS idx_citas_fecha_paciente ON citas(fecha_hora, paciente_id);
 *
 * -- Índices para tabla disponibilidades
 * CREATE INDEX IF NOT EXISTS idx_disponibilidades_perfil ON disponibilidades(perfil_id);
 * CREATE INDEX IF NOT EXISTS idx_disponibilidades_perfil_dia ON disponibilidades(perfil_id, dia_semana);
 * CREATE INDEX IF NOT EXISTS idx_disponibilidades_habilitado ON disponibilidades(perfil_id, habilitado);
 *
 * -- Índices para tabla datos_medicos_dinamicos
 * CREATE INDEX IF NOT EXISTS idx_datos_medicos_cita ON datos_medicos_dinamicos(cita_id);
 *
 * -- Índices para tabla registro_ingresos
 * CREATE INDEX IF NOT EXISTS idx_registro_ingresos_fecha ON registro_ingresos(fecha_ingreso);
 * CREATE INDEX IF NOT EXISTS idx_registro_ingresos_perfil ON registro_ingresos(perfil_id);
 */
export const INDICES_RECOMENDADOS = `
-- Copiar y ejecutar en el SQL Editor de Supabase
-- Estos índices optimizan las queries más frecuentes del sistema

-- Tabla citas
CREATE INDEX IF NOT EXISTS idx_citas_especialista ON citas(especialista_id);
CREATE INDEX IF NOT EXISTS idx_citas_paciente ON citas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_citas_estado ON citas(estado);
CREATE INDEX IF NOT EXISTS idx_citas_fecha_especialista ON citas(fecha_hora, especialista_id);
CREATE INDEX IF NOT EXISTS idx_citas_fecha_paciente ON citas(fecha_hora, paciente_id);

-- Tabla disponibilidades
CREATE INDEX IF NOT EXISTS idx_disponibilidades_perfil ON disponibilidades(perfil_id);
CREATE INDEX IF NOT EXISTS idx_disponibilidades_perfil_dia ON disponibilidades(perfil_id, dia_semana);
CREATE INDEX IF NOT EXISTS idx_disponibilidades_habilitado ON disponibilidades(perfil_id, habilitado);

-- Tabla datos_medicos_dinamicos
CREATE INDEX IF NOT EXISTS idx_datos_medicos_cita ON datos_medicos_dinamicos(cita_id);

-- Tabla registro_ingresos
CREATE INDEX IF NOT EXISTS idx_registro_ingresos_fecha ON registro_ingresos(fecha_ingreso);
CREATE INDEX IF NOT EXISTS idx_registro_ingresos_perfil ON registro_ingresos(perfil_id);
` as const;
