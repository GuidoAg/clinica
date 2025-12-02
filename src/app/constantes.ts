export const TABLA = {
  PERFILES: "perfiles",
  DETALLES_ESPECIALISTA: "detalles_especialista",
  DETALLES_PACIENTE: "detalles_paciente",

  VISTA_PERFILES_CON_EMAIL: "vista_perfiles_con_email",
  VISTA_CITAS_ENTERAS: "vista_citas_enteras",
  VISTA_ESPECIALISTAS: "vista_especialistas",
  VISTA_ESPECIALISTAS_FULL: "vista_especialistas_full",
  VISTA_ESPECIALISTA_ESPECIALIDADES: "vista_especialista_especialidades",
  VISTA_DISPONIBILIDADES: "vista_disponibilidades",
  VISTA_DISPONIBILIDAD_CON_DURACION: "vista_disponibilidad_con_duracion",

  CITAS: "citas",
  DISPONIBILIDADES: "disponibilidades",

  ESPECIALIDADES: "especialidades",
  ESPECIALISTA_ESPECIALIDADES: "especialista_especialidades",

  REGISTROS_MEDICOS: "registros_medicos",
  DATOS_MEDICOS_DINAMICOS: "datos_medicos_dinamicos",

  ENCUESTA: "encuesta",

  REGISTRO_INGRESOS: "registro_ingresos",

  CAPTCHA: "captcha",
} as const;

export const QUERY_VISTA_PERFILES = {
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

  IDENTIFICACION_CONTACTO:
    "id, nombre, apellido, email, rol, url_imagen_perfil",

  IDENTIFICACION_BASICA: "id, nombre, apellido, rol",
} as const;

export const QUERY_DISPONIBILIDADES = {
  DIA_SEMANA: "dia_semana",

  DIA_HORA_INICIO_FIN: "dia_semana, hora_inicio, hora_fin",

  SOLO_ID: "id",
} as const;

export const QUERY_CITAS = {
  TODOS_CAMPOS: "*",

  FECHA_DURACION: "fecha_hora, duracion_min",

  FECHA_DURACION_PARTICIPANTES:
    "fecha_hora, duracion_min, especialista_id, paciente_id",
} as const;

export const QUERY_DATOS_MEDICOS_DINAMICOS = {
  TODOS_CAMPOS: "*",
} as const;

export const QUERY_VISTA_ESPECIALISTAS_FULL = {
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

  ESPECIALISTA_ESPECIALIDADES: `
    especialista_id,
    nombre,
    apellido,
    url_imagen_perfil,
    especialidades
  `,
} as const;

export const QUERY_VISTA_CITAS_ENTERAS = {
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

export const QUERY_REGISTROS_MEDICOS = {
  TODOS_CAMPOS: "*",
} as const;

export const QUERY_PERFILES = {
  IDENTIFICACION: "id, nombre, apellido, rol",

  IDENTIFICACION_CON_EMAIL: "id, nombre, apellido, rol, email",

  NOMBRE_COMPLETO: "id, nombre, apellido",
} as const;

export const QUERY_ESPECIALIDADES = {
  BASICO: "id, nombre",

  COMPLETO: "id, nombre, url_icono",
} as const;

export const QUERY_REGISTRO_INGRESOS = {
  BASICO: "fecha_ingreso, perfil_id",
} as const;

export const QUERY_VISTA_PERFILES_RELACIONES = {
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
