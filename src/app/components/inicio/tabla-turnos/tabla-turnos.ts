import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // IMPORTANTE para ngModel
import { Turnos } from '../../../services/turnos';
import { CitaCompletaTurnos } from '../../../models/Turnos/CitaCompletaTurnos';

@Component({
  selector: 'app-tabla-turnos',
  standalone: true,
  imports: [CommonModule, FormsModule], // <-- agregamos FormsModule
  templateUrl: './tabla-turnos.html',
  styleUrl: './tabla-turnos.css',
})
export class TablaTurnos implements OnInit {
  citas = signal<CitaCompletaTurnos[]>([]);
  filaExpandida = signal<number | null>(null);
  cargando = signal(true);

  readonly columnas = [
    { key: 'citaId', label: 'ID' },
    { key: 'fechaHora', label: 'Fecha/Hora' },
    { key: 'estado', label: 'Estado' },
    { key: 'alturaCm', label: 'Altura (cm)' },
    { key: 'pesoKg', label: 'Peso (kg)' },
    { key: 'temperaturaC', label: 'Temp (°C)' },
    { key: 'presionArterial', label: 'Presión' },
    { key: 'pacienteNombreCompleto', label: 'Paciente' },
    { key: 'especialistaNombreCompleto', label: 'Especialista' },
    { key: 'especialidadNombre', label: 'Especialidad' },
  ];

  readonly columnasConDatosDinamicos = [
    ...this.columnas,
    { key: 'datosDinamicos', label: 'Datos dinámicos' },
    { key: 'acciones', label: 'Acciones' },
  ];

  // Filtro seleccionado y valor del filtro
  filtroColumna = signal<string | null>(null);
  private _filtroValor = signal('');

  // getter y setter para bindear con ngModel
  get filtroValorModel(): string {
    return this._filtroValor();
  }
  set filtroValorModel(value: string) {
    this._filtroValor.set(value);
  }

  constructor(private turnosService: Turnos) {}

  async ngOnInit() {
    try {
      const datos = await this.turnosService.obtenerCitasConRegistro();
      this.citas.set(datos);
    } catch (e) {
      console.error('Error al obtener citas', e);
    } finally {
      this.cargando.set(false);
    }
  }

  toggleFilaExpandida(citaId: number) {
    this.filaExpandida.set(this.filaExpandida() === citaId ? null : citaId);
  }

  activarFiltro(columna: string) {
    this.filtroColumna.set(columna);
    this._filtroValor.set('');
  }

  // Computed para devolver la lista filtrada según columna y valor
  get citasFiltradas(): CitaCompletaTurnos[] {
    const filtroCol = this.filtroColumna();
    const filtroVal = this._filtroValor().toLowerCase();

    if (!filtroCol || filtroVal.trim() === '') {
      return this.citas();
    }

    return this.citas().filter((cita) => {
      const valorCampo = (cita as any)[filtroCol];

      if (valorCampo == null) return false;

      if (valorCampo instanceof Date) {
        // Filtrar fecha con formato corto
        return valorCampo.toLocaleString().toLowerCase().includes(filtroVal);
      }

      return valorCampo.toString().toLowerCase().includes(filtroVal);
    });
  }

  get filtroColumnaLabel(): string {
    const col = this.columnas.find((c) => c.key === this.filtroColumna());
    return col?.label ?? '';
  }

  limpiarFiltro() {
    this.filtroColumna.set('');
    this._filtroValor.set('');
  }
}
