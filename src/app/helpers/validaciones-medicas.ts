export interface RangoValidacion {
  min: number;
  max: number;
  unidad: string;
}

export const RANGOS_MEDICOS = {
  altura: {
    min: 40,
    max: 250,
    unidad: "cm",
  } as RangoValidacion,

  peso: {
    min: 0.5,
    max: 300,
    unidad: "kg",
  } as RangoValidacion,

  temperatura: {
    min: 32,
    max: 43,
    unidad: "°C",
  } as RangoValidacion,

  presion: {
    sistolica: { min: 50, max: 250 },
    diastolica: { min: 30, max: 180 },
    unidad: "mmHg",
  },
};

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

export function validarPresionArterial(presion: string | null | undefined): {
  valido: boolean;
  mensaje: string;
} {
  if (!presion || !presion.trim()) {
    return { valido: false, mensaje: "La presión arterial es requerida" };
  }

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

  if (
    sistolica < RANGOS_MEDICOS.presion.sistolica.min ||
    sistolica > RANGOS_MEDICOS.presion.sistolica.max
  ) {
    return {
      valido: false,
      mensaje: `Presión sistólica debe estar entre ${RANGOS_MEDICOS.presion.sistolica.min} y ${RANGOS_MEDICOS.presion.sistolica.max} ${RANGOS_MEDICOS.presion.unidad}`,
    };
  }

  if (
    diastolica < RANGOS_MEDICOS.presion.diastolica.min ||
    diastolica > RANGOS_MEDICOS.presion.diastolica.max
  ) {
    return {
      valido: false,
      mensaje: `Presión diastólica debe estar entre ${RANGOS_MEDICOS.presion.diastolica.min} y ${RANGOS_MEDICOS.presion.diastolica.max} ${RANGOS_MEDICOS.presion.unidad}`,
    };
  }

  if (sistolica <= diastolica) {
    return {
      valido: false,
      mensaje: "La presión sistólica debe ser mayor que la diastólica",
    };
  }

  return { valido: true, mensaje: "" };
}

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
