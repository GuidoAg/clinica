import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  Renderer2,
  SimpleChanges,
} from "@angular/core";

@Directive({
  selector: "[appColorEstado]",
  standalone: true,
})
export class ColorEstado implements OnChanges {
  @Input() appColorEstado = "";

  private readonly estadoClaseMap: Record<string, string> = {
    solicitado: "bg-yellow-200 text-yellow-800",
    aceptado: "bg-green-200 text-green-800",
    rechazado: "bg-red-200 text-red-800",
    cancelado: "bg-gray-300 text-gray-800",
    completado: "bg-blue-200 text-blue-800",
  };

  private clasesAplicadas: string[] = [];

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["appColorEstado"]) {
      this.aplicarClases();
    }
  }

  private aplicarClases(): void {
    // Remover clases anteriores
    this.clasesAplicadas.forEach((clase) => {
      this.renderer.removeClass(this.el.nativeElement, clase);
    });
    this.clasesAplicadas = [];

    // Aplicar nuevas clases
    const estado = this.appColorEstado?.toLowerCase();
    const clases = this.estadoClaseMap[estado] ?? "bg-gray-100 text-gray-700";

    clases.split(" ").forEach((clase) => {
      this.renderer.addClass(this.el.nativeElement, clase);
      this.clasesAplicadas.push(clase);
    });
  }
}
