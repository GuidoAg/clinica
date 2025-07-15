import {
  Component,
  OnDestroy,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Turnos } from '../../../services/turnos';
import { CitaCompletaTurnos } from '../../../models/Turnos/CitaCompletaTurnos';
import { AuthSupabase } from '../../../services/auth-supabase';
import { Usuario } from '../../../models/Auth/Usuario';
import { Observable, Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EncuestaTurnos } from '../../../models/Turnos/EncuestaTurnos';
import { AccionesPaciente } from '../acciones-paciente/acciones-paciente';

@Component({
  selector: 'app-mis-turnos-paciente',
  imports: [CommonModule, FormsModule, AccionesPaciente],
  templateUrl: './mis-turnos-paciente.html',
  styleUrl: './mis-turnos-paciente.css',
})
export class MisTurnosPaciente implements OnInit, OnDestroy {
  usuario$: Observable<Usuario | null>;
  usuarioActual: Usuario | null = null;
  private destroy$ = new Subject<void>();

  citas = signal<CitaCompletaTurnos[]>([]);
  filaExpandida = signal<number | null>(null);
  cargando = signal(true);
  citaSeleccionada = signal<CitaCompletaTurnos | null>(null);

  mostrarPopupAcciones = false;

  estadoClaseMap: { [key: string]: string | undefined } = {
    solicitado: 'bg-yellow-200 text-yellow-800',
    aceptado: 'bg-green-200 text-green-800',
    rechazado: 'bg-red-200 text-red-800',
    cancelado: 'bg-gray-300 text-gray-800',
    completado: 'bg-blue-200 text-blue-800',
  };

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
  ];

  constructor(
    private turnosService: Turnos,
    private authSupabase: AuthSupabase,
  ) {
    this.usuario$ = this.authSupabase.user$;
  }

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

  async ngOnInit() {
    this.usuario$.pipe(takeUntil(this.destroy$)).subscribe((usuario) => {
      if (!usuario) {
        this.usuarioActual = null;
        return;
      }
      // Asegurar que id sea número
      usuario.id =
        typeof usuario.id === 'string' ? Number(usuario.id) : usuario.id;

      this.usuarioActual = usuario;
    });

    try {
      if (this.usuarioActual?.id != null) {
        const datos = await this.turnosService.obtenerCitasPaciente(
          this.usuarioActual.id,
        );
        this.citas.set(datos);
      }
    } catch (e) {
      console.error('Error al obtener citas', e);
    } finally {
      this.cargando.set(false);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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

  mostrarAcciones() {
    this.filtroColumna.set('');
    this._filtroValor.set('');
  }

  abrirPopupAcciones(cita: CitaCompletaTurnos) {
    this.citaSeleccionada.set(cita);
    this.mostrarPopupAcciones = true;
  }

  cerrarPopupAcciones() {
    this.mostrarPopupAcciones = false;
    this.citaSeleccionada.set(null);
  }

  accionDesdeModal(tipo: string) {
    // Opcional: refrescar citas si lo necesitás
    // o solo ocultar modal
    this.cerrarPopupAcciones();

    // Podés usar el tipo para log o toast si querés
    console.log('Acción realizada desde modal:', tipo);
  }
}
