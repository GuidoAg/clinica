import {
  Component,
  EventEmitter,
  Output,
  Input,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Especialidad } from '../../../models/SupaBase/Especialidad';
import { AuthSupabase } from '../../../services/auth-supabase';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Supabase } from '../../../supabase';

@Component({
  selector: 'app-agregar-especialidad',
  imports: [CommonModule, FormsModule],
  templateUrl: './agregar-especialidad.html',
  styleUrl: './agregar-especialidad.css',
})
export class AgregarEspecialidad implements OnInit {
  @Input() perfilId!: number;
  @Output() cerrar = new EventEmitter<void>();
  @Output() especialidadAgregada = new EventEmitter<string>();

  especialidades: WritableSignal<Especialidad[]> = signal([]);
  seleccionada: WritableSignal<string> = signal('');
  nuevaEspecialidad: WritableSignal<string> = signal('');
  cargando = signal(false);

  constructor(
    private authSupabase: AuthSupabase,
    private snackBar: MatSnackBar,
  ) {}

  async ngOnInit() {
    const lista = await this.authSupabase.obtenerEspecialidades();
    this.especialidades.set(lista);
  }

  async agregar() {
    const seleccion = this.seleccionada();
    const esNueva = seleccion === 'otra';
    const nombre = esNueva ? this.nuevaEspecialidad().trim() : seleccion;

    if (!nombre) {
      this.snackBar.open(
        'Debes seleccionar o ingresar una especialidad.',
        'Cerrar',
        {
          duration: 3000,
          panelClass: ['bg-red-600', 'text-white'],
        },
      );
      return;
    }

    this.cargando.set(true);

    try {
      const resultado =
        await this.authSupabase.agregarEspecialidadSiNoExiste(nombre);

      if (!resultado.success || !resultado.data) {
        this.snackBar.open(
          resultado.message || 'No se pudo agregar la especialidad',
          'Cerrar',
          {
            duration: 3000,
            panelClass: ['bg-red-600', 'text-white'],
          },
        );
        this.cargando.set(false);
        return;
      }

      const especialidadId = resultado.data;

      const { error } = await Supabase.from(
        'especialista_especialidades',
      ).insert({
        perfil_id: this.perfilId,
        especialidad_id: especialidadId,
        duracion: 30,
      });

      if (error) {
        this.snackBar.open('Error al asignar la especialidad.', 'Cerrar', {
          duration: 3000,
          panelClass: ['bg-red-600', 'text-white'],
        });
        this.cargando.set(false);
        return;
      }

      this.snackBar.open('Especialidad agregada con éxito.', 'Cerrar', {
        duration: 3000,
        panelClass: ['bg-green-600', 'text-white'],
      });

      this.especialidadAgregada.emit(nombre);
      this.cerrar.emit();
    } finally {
      this.cargando.set(false);
    }
  }

  cerrarModal() {
    this.cerrar.emit();
  }
}
