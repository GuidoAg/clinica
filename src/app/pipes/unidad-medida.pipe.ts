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
