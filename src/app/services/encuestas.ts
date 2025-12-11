import { Injectable } from "@angular/core";
import { Supabase } from "../supabase";
import { TABLA } from "../constantes";
import type {
  EncuestaPaciente,
  EstadisticasEncuestas,
  PuntuacionEspecialista,
} from "../models/Encuestas/modeloEncuestas";

interface PerfilBasico {
  id: number;
  nombre: string;
  apellido: string;
}

@Injectable({
  providedIn: "root",
})
export class EncuestasService {
  async obtenerTodasEncuestas(): Promise<EncuestaPaciente[]> {
    const { data, error } = await Supabase.from(TABLA.ENCUESTAS_PACIENTES)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error al obtener encuestas:", error);
      return [];
    }

    return data || [];
  }

  async obtenerEstadisticas(): Promise<EstadisticasEncuestas> {
    const [encuestas, citasResult, visitasResult] = await Promise.all([
      this.obtenerTodasEncuestas(),
      Supabase.from(TABLA.CITAS).select("id").eq("estado", "completado"),
      Supabase.from(TABLA.REGISTRO_INGRESOS).select("id", {
        count: "exact",
        head: true,
      }),
    ]);

    const totalCitasCompletadas = citasResult.data?.length || 0;
    const totalEncuestas = encuestas.length;
    const visitasTotales = visitasResult.count || 0;
    const tasaRespuesta =
      totalCitasCompletadas > 0
        ? (totalEncuestas / totalCitasCompletadas) * 100
        : 0;

    if (encuestas.length === 0) {
      return this.obtenerEstadisticasVacias(
        totalCitasCompletadas,
        tasaRespuesta,
        visitasTotales,
      );
    }

    // Obtener todos los perfiles únicos de una sola vez
    const idsEspecialistas = [
      ...new Set(encuestas.map((e) => e.idEspecialista)),
    ];
    const { data: perfiles } = await Supabase.from(TABLA.PERFILES)
      .select("id, nombre, apellido")
      .in("id", idsEspecialistas);

    const perfilesMap = this.crearMapaPerfiles(perfiles || []);

    // Calcular todas las estadísticas
    const promedios = this.calcularPromedios(encuestas);
    const distribucionEstrellas = this.calcularDistribucionEstrellas(encuestas);
    const distribucionRadio = this.calcularDistribucionRadio(encuestas);
    const aspectosDestacados = this.calcularAspectosDestacados(encuestas);
    const { mejoresComentarios, peoresComentarios } = this.procesarComentarios(
      encuestas,
      perfilesMap,
    );
    const tendenciaGeneral = this.generarTendenciaGeneral(
      promedios.estrellas,
      promedios.rango,
    );
    const puntuacionPorEspecialista = this.calcularPuntuacionPorEspecialista(
      encuestas,
      perfilesMap,
    );

    return {
      total: totalEncuestas,
      promedioEstrellas: promedios.estrellas,
      promedioRango: promedios.rango,
      distribucionEstrellas,
      distribucionRadio,
      aspectosDestacados,
      mejoresComentarios,
      peoresComentarios,
      tendenciaGeneral,
      tasaRespuesta,
      citasCompletadas: totalCitasCompletadas,
      encuestasRespondidas: totalEncuestas,
      puntuacionPorEspecialista,
      visitasTotales,
    };
  }

  private obtenerEstadisticasVacias(
    citasCompletadas: number,
    tasaRespuesta: number,
    visitasTotales: number,
  ): EstadisticasEncuestas {
    return {
      total: 0,
      promedioEstrellas: 0,
      promedioRango: 0,
      distribucionEstrellas: [],
      distribucionRadio: [],
      aspectosDestacados: [],
      mejoresComentarios: [],
      peoresComentarios: [],
      tendenciaGeneral: "Sin datos suficientes para analizar.",
      tasaRespuesta,
      citasCompletadas,
      encuestasRespondidas: 0,
      puntuacionPorEspecialista: [],
      visitasTotales,
    };
  }

  private crearMapaPerfiles(perfiles: PerfilBasico[]): Map<number, string> {
    return new Map(perfiles.map((p) => [p.id, `${p.nombre} ${p.apellido}`]));
  }

  private calcularPromedios(encuestas: EncuestaPaciente[]): {
    estrellas: number;
    rango: number;
  } {
    const total = encuestas.length;
    return {
      estrellas: encuestas.reduce((sum, e) => sum + e.estrellas, 0) / total,
      rango: encuestas.reduce((sum, e) => sum + e.rango, 0) / total,
    };
  }

  private calcularDistribucionEstrellas(
    encuestas: EncuestaPaciente[],
  ): { estrellas: number; cantidad: number }[] {
    const contadorEstrellas = new Map<number, number>();
    for (let i = 1; i <= 5; i++) {
      contadorEstrellas.set(i, 0);
    }

    encuestas.forEach((e) => {
      contadorEstrellas.set(
        e.estrellas,
        (contadorEstrellas.get(e.estrellas) || 0) + 1,
      );
    });

    return Array.from(contadorEstrellas.entries()).map(
      ([estrellas, cantidad]) => ({ estrellas, cantidad }),
    );
  }

  private calcularDistribucionRadio(
    encuestas: EncuestaPaciente[],
  ): { opcion: string; cantidad: number }[] {
    const contadorRadio = new Map<string, number>();

    encuestas.forEach((e) => {
      if (e.radioButton) {
        contadorRadio.set(
          e.radioButton,
          (contadorRadio.get(e.radioButton) || 0) + 1,
        );
      }
    });

    return Array.from(contadorRadio.entries()).map(([opcion, cantidad]) => ({
      opcion,
      cantidad,
    }));
  }

  private calcularAspectosDestacados(
    encuestas: EncuestaPaciente[],
  ): { aspecto: string; cantidad: number }[] {
    const contadorAspectos = new Map<string, number>();

    encuestas.forEach((e) => {
      if (e.checkBox) {
        const aspectos = e.checkBox.split(",");
        aspectos.forEach((aspecto) => {
          const aspectoLimpio = aspecto.trim();
          if (aspectoLimpio) {
            contadorAspectos.set(
              aspectoLimpio,
              (contadorAspectos.get(aspectoLimpio) || 0) + 1,
            );
          }
        });
      }
    });

    return Array.from(contadorAspectos.entries())
      .map(([aspecto, cantidad]) => ({ aspecto, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 8);
  }

  private procesarComentarios(
    encuestas: EncuestaPaciente[],
    perfilesMap: Map<number, string>,
  ): {
    mejoresComentarios: EstadisticasEncuestas["mejoresComentarios"];
    peoresComentarios: EstadisticasEncuestas["peoresComentarios"];
  } {
    const encuestasConComentarios = encuestas.filter(
      (e) => e.textBox && e.textBox.trim().length > 0,
    );

    const mapearComentario = (e: EncuestaPaciente) => ({
      comentario: e.textBox,
      estrellas: e.estrellas,
      fecha: new Date(e.created_at).toLocaleDateString("es-AR"),
      especialista: perfilesMap.get(e.idEspecialista) || "Desconocido",
    });

    const mejoresComentarios = encuestasConComentarios
      .filter((e) => e.estrellas >= 4)
      .sort((a, b) => b.estrellas - a.estrellas)
      .slice(0, 5)
      .map(mapearComentario);

    const peoresComentarios = encuestasConComentarios
      .filter((e) => e.estrellas <= 2)
      .sort((a, b) => a.estrellas - b.estrellas)
      .slice(0, 5)
      .map(mapearComentario);

    return { mejoresComentarios, peoresComentarios };
  }

  private generarTendenciaGeneral(
    promedioEstrellas: number,
    promedioRango: number,
  ): string {
    const partes: string[] = [];

    if (promedioEstrellas >= 4.5) {
      partes.push("encuestasPage.tendencias.excelente");
    } else if (promedioEstrellas >= 3.5) {
      partes.push("encuestasPage.tendencias.buena");
    } else if (promedioEstrellas >= 2.5) {
      partes.push("encuestasPage.tendencias.regular");
    } else {
      partes.push("encuestasPage.tendencias.critica");
    }

    if (promedioRango >= 75) {
      partes.push("encuestasPage.tendencias.rangoAlto");
    } else if (promedioRango >= 50) {
      partes.push("encuestasPage.tendencias.rangoMedio");
    } else {
      partes.push("encuestasPage.tendencias.rangoBajo");
    }

    return partes.join("|");
  }

  private calcularPuntuacionPorEspecialista(
    encuestas: EncuestaPaciente[],
    perfilesMap: Map<number, string>,
  ): PuntuacionEspecialista[] {
    // Agrupar encuestas por especialista
    const encuestasPorEspecialista = new Map<number, EncuestaPaciente[]>();

    encuestas.forEach((encuesta) => {
      const especialistaId = encuesta.idEspecialista;
      if (!encuestasPorEspecialista.has(especialistaId)) {
        encuestasPorEspecialista.set(especialistaId, []);
      }
      encuestasPorEspecialista.get(especialistaId)!.push(encuesta);
    });

    // Calcular estadísticas por especialista
    const resultado: PuntuacionEspecialista[] = [];

    for (const [especialistaId, encuestasEsp] of encuestasPorEspecialista) {
      const nombreEspecialista = perfilesMap.get(especialistaId);
      if (!nombreEspecialista) continue;

      const total = encuestasEsp.length;
      const promedioEstrellas =
        encuestasEsp.reduce((sum, e) => sum + e.estrellas, 0) / total;
      const promedioRango =
        encuestasEsp.reduce((sum, e) => sum + e.rango, 0) / total;

      resultado.push({
        especialista: nombreEspecialista,
        promedioEstrellas,
        totalEncuestas: total,
        promedioRango,
      });
    }

    // Ordenar por promedio de estrellas descendente
    return resultado.sort((a, b) => b.promedioEstrellas - a.promedioEstrellas);
  }
}
