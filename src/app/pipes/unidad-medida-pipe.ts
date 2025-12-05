import { Pipe, PipeTransform } from "@angular/core";

type TipoUnidad = "altura" | "peso" | "temperatura" | "presion";

@Pipe({
  name: "unidadMedida",
  standalone: true,
})
export class UnidadMedidaPipe implements PipeTransform {
  transform(
    value: number | string | null | undefined,
    tipo: TipoUnidad,
  ): string {
    if (value === null || value === undefined || value === "") {
      return "";
    }

    // Convertir a número para comparar
    const numValue = typeof value === "string" ? parseFloat(value) : value;

    // Si el valor es 0, retornar cadena vacía
    if (numValue === 0 || isNaN(numValue)) {
      return "";
    }

    const unidades: Record<TipoUnidad, string> = {
      altura: "cm",
      peso: "kg",
      temperatura: "°C",
      presion: "mmHg",
    };

    const unidad = unidades[tipo];
    return `${value} ${unidad}`;
  }
}
