import { Injectable } from "@angular/core";
import { Supabase } from "../supabase";
import { TABLA, QUERY_DISPONIBILIDADES } from "../constantes";

/**
 * Servicio especializado para manejar disponibilidades horarias de especialistas
 * Responsabilidades:
 * - Obtener días disponibles de especialistas
 * - Calcular fechas disponibles en un rango
 * - Obtener horarios disponibles para una fecha específica
 * - Parsear y formatear fechas/horas
 */
@Injectable({
  providedIn: "root",
})
export class DisponibilidadService {
  // Mapeos constantes para días de la semana
  private readonly DIAS_SEMANA_NUMERO_A_NOMBRE: Record<number, string> = {
    1: "lunes",
    2: "martes",
    3: "miércoles",
    4: "jueves",
    5: "viernes",
    6: "sábado",
    7: "domingo",
  };

  private readonly DIAS_SEMANA_NOMBRE_A_NUMERO: Record<string, number> = {
    lunes: 1,
    martes: 2,
    miércoles: 3,
    jueves: 4,
    viernes: 5,
    sábado: 6,
    domingo: 0,
  };

  /**
   * Obtiene los días de la semana en que un especialista está disponible
   */
  async obtenerDiasEspecialista(idEspecialista: number): Promise<string[]> {
    const { data: dias, error } = await Supabase.from(TABLA.DISPONIBILIDADES)
      .select(QUERY_DISPONIBILIDADES.DIA_SEMANA)
      .eq("perfil_id", idEspecialista)
      .eq("habilitado", true);

    if (error || !dias) {
      console.error("Error al obtener días disponibles:", error);
      return [];
    }

    // Convertimos a nombres y evitamos duplicados
    const nombresDias = dias
      .map((d) => this.DIAS_SEMANA_NUMERO_A_NOMBRE[d.dia_semana])
      .filter((dia, index, self) => dia && self.indexOf(dia) === index);

    return nombresDias;
  }

  /**
   * Calcula las fechas disponibles en un rango basándose en los días habilitados
   */
  async calcularFechasDisponibles(
    idEspecialista: number,
    diasARevisar = 15,
    desdeFecha = new Date(),
  ): Promise<string[]> {
    const diasHabilitados = await this.obtenerDiasEspecialista(idEspecialista);

    if (diasHabilitados.length === 0) {
      return [];
    }

    // Convertimos los nombres de días a sus números según JS
    const diasHabilitadosNumericos = diasHabilitados.map(
      (dia) => this.DIAS_SEMANA_NOMBRE_A_NUMERO[dia.toLowerCase()],
    );

    const fechasDisponibles: string[] = [];

    for (let i = 0; i < diasARevisar; i++) {
      const fecha = new Date(desdeFecha);
      fecha.setDate(fecha.getDate() + i);

      const diaJS = fecha.getDay(); // 0: domingo, 1: lunes, ..., 6: sábado

      if (diasHabilitadosNumericos.includes(diaJS)) {
        fechasDisponibles.push(this.formatearFecha(fecha));
      }
    }

    return fechasDisponibles;
  }

  /**
   * Obtiene TODAS las disponibilidades de un especialista en una sola query
   * Retorna un Map para lookup rápido por día de semana
   */
  async obtenerTodasDisponibilidades(
    especialistaId: number,
  ): Promise<Map<number, { hora_inicio: string; hora_fin: string }>> {
    const { data, error } = await Supabase.from(TABLA.DISPONIBILIDADES)
      .select(QUERY_DISPONIBILIDADES.DIA_HORA_INICIO_FIN)
      .eq("perfil_id", especialistaId)
      .eq("habilitado", true);

    if (error || !data) {
      return new Map();
    }

    const mapa = new Map<number, { hora_inicio: string; hora_fin: string }>();
    for (const disp of data) {
      mapa.set(disp.dia_semana, {
        hora_inicio: disp.hora_inicio,
        hora_fin: disp.hora_fin,
      });
    }

    return mapa;
  }

  /**
   * Obtiene la configuración de disponibilidad horaria para un día específico
   */
  async obtenerDisponibilidadDia(
    especialistaId: number,
    diaSemana: number,
  ): Promise<{ hora_inicio: string; hora_fin: string } | null> {
    const { data: disponibilidad, error } = await Supabase.from(
      TABLA.DISPONIBILIDADES,
    )
      .select(QUERY_DISPONIBILIDADES.DIA_HORA_INICIO_FIN)
      .eq("perfil_id", especialistaId)
      .eq("dia_semana", diaSemana)
      .eq("habilitado", true)
      .maybeSingle();

    if (error || !disponibilidad) {
      return null;
    }

    return disponibilidad;
  }

  /**
   * Verifica si un especialista tiene disponibilidad configurada
   */
  async tieneDisponibilidadConfigurada(
    idEspecialista: number,
  ): Promise<boolean> {
    const { data, error } = await Supabase.from(TABLA.DISPONIBILIDADES)
      .select(QUERY_DISPONIBILIDADES.SOLO_ID)
      .eq("perfil_id", idEspecialista)
      .eq("habilitado", true)
      .limit(1);

    return !error && data && data.length > 0;
  }

  /**
   * Método privado para parsear hora en zona local
   */
  parseHoraLocal(fecha: string, hora: string): Date {
    const [year, month, day] = fecha.split("-").map(Number);
    const [hour, minute] = hora.split(":").map(Number);
    return new Date(year, month - 1, day, hour, minute);
  }

  /**
   * Formatea una fecha a formato "YYYY-MM-DD"
   */
  formatearFecha(fecha: Date): string {
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, "0");
    const dd = String(fecha.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  /**
   * Formatea una hora a formato "HH:MM"
   */
  formatearHora(fecha: Date): string {
    return fecha.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  /**
   * Calcula el día de la semana en formato DB (1=Lunes...7=Domingo)
   * Optimizado: cálculo inline más rápido
   */
  calcularDiaSemana(fecha: string): number {
    const [year, month, day] = fecha.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return ((date.getDay() + 6) % 7) + 1;
  }

  /**
   * Crea el rango de inicio y fin de día para consultas
   */
  crearRangoDia(fecha: string): { inicio: Date; fin: Date } {
    return {
      inicio: new Date(`${fecha}T00:00:00`),
      fin: new Date(`${fecha}T23:59:59`),
    };
  }
}
