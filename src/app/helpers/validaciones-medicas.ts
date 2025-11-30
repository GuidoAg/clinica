/**
 * Rangos de validación para medidas médicas
 * Los límites son generosos para cubrir casos especiales pero evitan valores imposibles
 *
 * Referencias médicas:
 * - Altura: Recién nacidos prematuros pueden medir desde 40cm, adultos muy altos hasta 250cm
 * - Peso: Prematuros pueden pesar desde 0.5kg, casos de obesidad extrema hasta 300kg
 * - Temperatura: Hipotermia severa desde 32°C, hipertermia severa hasta 43°C (límites de supervivencia)
 * - Presión arterial: Valores extremos pero médicamente posibles
 */

export interface RangoValidacion {
  min: number;
  max: number;
  unidad: string;
}

export const RANGOS_MEDICOS = {
  /**
   * Altura en centímetros
   * Min: 40 cm (recién nacidos prematuros)
   * Max: 250 cm (personas excepcionalmente altas)
   */
  altura: {
    min: 40,
    max: 250,
    unidad: "cm",
  } as RangoValidacion,

  /**
   * Peso en kilogramos
   * Min: 0.5 kg (recién nacidos prematuros)
   * Max: 300 kg (casos de obesidad extrema)
   */
  peso: {
    min: 0.5,
    max: 300,
    unidad: "kg",
  } as RangoValidacion,

  /**
   * Temperatura corporal en grados Celsius
   * Min: 32°C (hipotermia severa, límite de supervivencia)
   * Max: 43°C (hipertermia severa, límite de supervivencia)
   */
  temperatura: {
    min: 32,
    max: 43,
    unidad: "°C",
  } as RangoValidacion,

  /**
   * Presión arterial (sistólica/diastólica)
   * Formato esperado: "120/80" o similar
   * Min sistólica: 50 mmHg
   * Max sistólica: 250 mmHg
   * Min diastólica: 30 mmHg
   * Max diastólica: 180 mmHg
   */
  presion: {
    sistolica: { min: 50, max: 250 },
    diastolica: { min: 30, max: 180 },
    unidad: "mmHg",
  },
};

/**
 * Valida si un valor está dentro del rango permitido
 */
export function validarRango(
  valor: number | null | undefined,
  rango: RangoValidacion,
): { valido: boolean; mensaje: string } {
  if (valor === null || valor === undefined || isNaN(valor)) {
    return { valido: false, mensaje: "El valor es requerido" };
  }

  if (valor < rango.min) {
    return {
      valido: false,
      mensaje: `El valor debe ser mayor o igual a ${rango.min} ${rango.unidad}`,
    };
  }

  if (valor > rango.max) {
    return {
      valido: false,
      mensaje: `El valor debe ser menor o igual a ${rango.max} ${rango.unidad}`,
    };
  }

  return { valido: true, mensaje: "" };
}

/**
 * Valida el formato y valores de presión arterial
 * Acepta formatos: "120/80", "120 / 80", "120-80"
 */
export function validarPresionArterial(presion: string | null | undefined): {
  valido: boolean;
  mensaje: string;
} {
  if (!presion || !presion.trim()) {
    return { valido: false, mensaje: "La presión arterial es requerida" };
  }

  // Regex para validar formato: acepta "/" o "-" como separador, con o sin espacios
  const regex = /^(\d+)\s*[/-]\s*(\d+)$/;
  const match = presion.trim().match(regex);

  if (!match) {
    return {
      valido: false,
      mensaje: 'Formato inválido. Use formato "120/80"',
    };
  }

  const sistolica = parseInt(match[1], 10);
  const diastolica = parseInt(match[2], 10);

  // Validar rango sistólica
  if (
    sistolica < RANGOS_MEDICOS.presion.sistolica.min ||
    sistolica > RANGOS_MEDICOS.presion.sistolica.max
  ) {
    return {
      valido: false,
      mensaje: `Presión sistólica debe estar entre ${RANGOS_MEDICOS.presion.sistolica.min} y ${RANGOS_MEDICOS.presion.sistolica.max} ${RANGOS_MEDICOS.presion.unidad}`,
    };
  }

  // Validar rango diastólica
  if (
    diastolica < RANGOS_MEDICOS.presion.diastolica.min ||
    diastolica > RANGOS_MEDICOS.presion.diastolica.max
  ) {
    return {
      valido: false,
      mensaje: `Presión diastólica debe estar entre ${RANGOS_MEDICOS.presion.diastolica.min} y ${RANGOS_MEDICOS.presion.diastolica.max} ${RANGOS_MEDICOS.presion.unidad}`,
    };
  }

  // Validar que la sistólica sea mayor que la diastólica
  if (sistolica <= diastolica) {
    return {
      valido: false,
      mensaje: "La presión sistólica debe ser mayor que la diastólica",
    };
  }

  return { valido: true, mensaje: "" };
}

/**
 * Valida todos los campos médicos de un registro
 */
export function validarRegistroMedico(registro: {
  alturaCm: number | null;
  pesoKg: number | null;
  temperaturaC: number | null;
  presionArterial: string | null;
}): { valido: boolean; errores: string[] } {
  const errores: string[] = [];

  const validacionAltura = validarRango(
    registro.alturaCm,
    RANGOS_MEDICOS.altura,
  );
  if (!validacionAltura.valido) {
    errores.push(`Altura: ${validacionAltura.mensaje}`);
  }

  const validacionPeso = validarRango(registro.pesoKg, RANGOS_MEDICOS.peso);
  if (!validacionPeso.valido) {
    errores.push(`Peso: ${validacionPeso.mensaje}`);
  }

  const validacionTemp = validarRango(
    registro.temperaturaC,
    RANGOS_MEDICOS.temperatura,
  );
  if (!validacionTemp.valido) {
    errores.push(`Temperatura: ${validacionTemp.mensaje}`);
  }

  const validacionPresion = validarPresionArterial(registro.presionArterial);
  if (!validacionPresion.valido) {
    errores.push(`Presión arterial: ${validacionPresion.mensaje}`);
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}
