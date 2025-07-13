import {
  Component,
  OnInit,
  OnDestroy,
  WritableSignal,
  signal,
  Output,
  EventEmitter,
  Input,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthSupabase } from '../../../services/auth-supabase';
import { RegistroPaciente } from '../../../models/Auth/RegistroPaciente';
import { RegistroEspecialista } from '../../../models/Auth/RegistroEspecialista';
import { RespuestaApi } from '../../../models/RespuestaApi';
import { fileToBase64 } from '../../../helpers/upload-base64';
import { OBRAS_SOCIALES } from '../../../constants/obras-sociales';
import { Especialidad } from '../../../models/SupaBase/Especialidad';
import { Router } from '@angular/router';
import { LoadingOverlayService } from '../../../services/loading-overlay-service';

import { FormsModule } from '@angular/forms';
import { RegistroAdmin } from '../../../models/Auth/RegistroAdmin';

@Component({
  selector: 'app-altas-admin',
  imports: [
    CommonModule,
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './altas-admin.html',
  styleUrl: './altas-admin.css',
})
export class AltasAdmin implements OnInit, OnDestroy {
  @Input() perfilId!: number;
  @Output() cerrar = new EventEmitter<void>();
  @Output() altaExitosa = new EventEmitter<void>();

  registroForm!: FormGroup;
  tipoUsuario: 'paciente' | 'especialista' | 'admin' | null = null;

  obraSocialOptions = OBRAS_SOCIALES;
  especialidadOptions: Especialidad[] = [];

  private subEspecialidad!: Subscription;

  constructor(
    private fb: FormBuilder,
    private auth: AuthSupabase,
    private snackBar: MatSnackBar,
    private loading: LoadingOverlayService,
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    this.subEspecialidad?.unsubscribe();
  }

  cerrarPopup() {
    this.cerrar.emit();
  }

  private async initForm() {
    try {
      this.loading.show();

      this.especialidadOptions = await this.auth.obtenerEspecialidades();
      this.especialidadOptions.push({ id: -1, nombre: 'Otra' });

      // Construcción del form
      this.registroForm = this.fb.group({
        nombre: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/),
          ],
        ],
        apellido: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/),
          ],
        ],
        edad: [
          null,
          [Validators.required, Validators.min(18), Validators.max(99)],
        ],
        dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
        obraSocial: [''],
        mail: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(7)]],
        especialidad: [''],
        otraEspecialidad: [
          { value: '', disabled: true },
          [
            Validators.minLength(2),
            Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/),
          ],
        ],
        imagenPerfil: [null, Validators.required],
        imagenFondo: [''],
      });

      // Ajuste dinámico de validadores para "otraEspecialidad"
      this.subEspecialidad = this.registroForm
        .get('especialidad')!
        .valueChanges.subscribe((value) => {
          const otra = this.registroForm.get('otraEspecialidad')!;
          if (value?.id === -1) {
            otra.enable();
            otra.setValidators([
              Validators.required,
              Validators.minLength(2),
              Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/),
            ]);
          } else {
            otra.disable();
            otra.clearValidators();
          }
          otra.updateValueAndValidity();
        });
    } catch (err: any) {
    } finally {
      this.loading.hide();
    }
  }

  seleccionarTipo(tipo: 'paciente' | 'especialista' | 'admin'): void {
    this.tipoUsuario = tipo;

    if (!this.registroForm) return;

    const obraSocialCtrl = this.registroForm.get('obraSocial');
    const especialidadCtrl = this.registroForm.get('especialidad');
    const otraEspecialidadCtrl = this.registroForm.get('otraEspecialidad');

    if (tipo === 'paciente') {
      obraSocialCtrl?.setValidators([Validators.required]);
      especialidadCtrl?.clearValidators();
      otraEspecialidadCtrl?.clearValidators();
      otraEspecialidadCtrl?.disable();
    } else if (tipo === 'especialista') {
      obraSocialCtrl?.clearValidators();
      especialidadCtrl?.setValidators([Validators.required]);

      if (especialidadCtrl?.value?.id === -1) {
        otraEspecialidadCtrl?.enable();
        otraEspecialidadCtrl?.setValidators([
          Validators.required,
          Validators.minLength(2),
          Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/),
        ]);
      } else {
        otraEspecialidadCtrl?.disable();
        otraEspecialidadCtrl?.clearValidators();
      }
    } else if (tipo === 'admin') {
      this.registroForm.get('obraSocial')?.setValue('');
      this.registroForm.get('especialidad')?.setValue('');
      this.registroForm.get('otraEspecialidad')?.setValue('');
      this.registroForm.get('imagenFondo')?.setValue('');

      // Admin no requiere ni obraSocial ni especialidad
      obraSocialCtrl?.clearValidators();
      especialidadCtrl?.clearValidators();
      otraEspecialidadCtrl?.clearValidators();
      otraEspecialidadCtrl?.disable();
    }

    // Actualizar validez
    obraSocialCtrl?.updateValueAndValidity();
    especialidadCtrl?.updateValueAndValidity();
    otraEspecialidadCtrl?.updateValueAndValidity();
  }

  onFileSelected(event: Event, tipo: 'perfil' | 'fondo') {
    const controlName = tipo === 'perfil' ? 'imagenPerfil' : 'imagenFondo';
    const input = event.target as HTMLInputElement;
    const ctrl = this.registroForm.get(controlName)!;

    if (!input.files?.length) {
      ctrl.setValue(null);
      ctrl.setErrors({ required: true });
      return;
    }

    const file = input.files[0];
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      ctrl.setErrors({ invalidType: true });
      return;
    }

    ctrl.setValue(file);
    ctrl.setErrors(null);
  }

  async registrar(): Promise<void> {
    if (this.registroForm.invalid || !this.tipoUsuario) return;

    this.loading.show(); // <--- spinner on
    try {
      if (this.tipoUsuario === 'paciente') {
        await this.handleRegistroPaciente();
      } else if (this.tipoUsuario === 'especialista') {
        await this.handleRegistroEspecialista();
      } else if (this.tipoUsuario === 'admin') {
        await this.handleRegistroAdmin();
      }
    } finally {
      this.loading.hide();
    }
  }

  private async handleRegistroAdmin(): Promise<void> {
    try {
      const f = this.registroForm.value;
      const imgPerfil = await fileToBase64(f.imagenPerfil as File);

      const payload: RegistroAdmin = {
        nombre: f.nombre,
        apellido: f.apellido,
        edad: f.edad,
        dni: f.dni,
        mail: f.mail,
        contrasena: f.password,
        imagenPerfil: imgPerfil,
      };

      const res: RespuestaApi<void> = await this.auth.registerAdmin(payload);

      const errorNormal = res.errorCode?.toLowerCase();

      console.log(res.errorCode);

      if (errorNormal?.includes('error desconocido')) {
        this.mostrarResultado(res.success, res.message);
      } else {
        this.mostrarResultado(res.success, res.errorCode);
      }
    } catch {
      this.mostrarResultado(false, 'Error al procesar las imágenes.');
    }
  }

  private async handleRegistroPaciente(): Promise<void> {
    try {
      const f = this.registroForm.value;
      const imgPerfil = await fileToBase64(f.imagenPerfil as File);
      const imgFondo = await fileToBase64(f.imagenFondo as File);

      const payload: RegistroPaciente = {
        nombre: f.nombre,
        apellido: f.apellido,
        edad: f.edad,
        dni: f.dni,
        obraSocial: f.obraSocial,
        mail: f.mail,
        contrasena: f.password,
        imagenPerfil: imgPerfil,
        imagenFondo: imgFondo,
      };

      const res: RespuestaApi<void> = await this.auth.registerPaciente(payload);

      const errorNormal = res.errorCode?.toLowerCase();

      console.log(res.errorCode);

      if (errorNormal?.includes('error desconocido')) {
        this.mostrarResultado(res.success, res.message);
      } else {
        this.mostrarResultado(res.success, res.errorCode);
      }
    } catch {
      this.mostrarResultado(false, 'Error al procesar las imágenes.');
    }
  }

  private async handleRegistroEspecialista(): Promise<void> {
    try {
      const f = this.registroForm.value;
      const imgPerfil = await fileToBase64(f.imagenPerfil as File);

      const especialidad =
        f.especialidad.id === -1 ? f.otraEspecialidad : f.especialidad.nombre;

      const payload: RegistroEspecialista = {
        nombre: f.nombre,
        apellido: f.apellido,
        edad: f.edad,
        dni: f.dni,
        mail: f.mail,
        contrasena: f.password,
        especialidad,
        imagenPerfil: imgPerfil,
      };

      const res: RespuestaApi<void> =
        await this.auth.registerEspecialista(payload);

      const errorNormal = res.errorCode?.toLowerCase();

      if (errorNormal?.includes('error desconocido')) {
        this.mostrarResultado(res.success, res.message);
      } else {
        this.mostrarResultado(res.success, res.errorCode);
      }
    } catch {
      this.mostrarResultado(false, 'Error al procesar la imagen.');
    }
  }

  private mostrarResultado(exito: boolean, mensaje?: string) {
    if (!exito) {
      this.snackBar.open(mensaje || 'Ocurrió un error.', 'Cerrar', {
        duration: 4000,
        panelClass: ['bg-red-600', 'text-white'],
      });
      return;
    }

    this.tipoUsuario = null;
    this.altaExitosa.emit(); // o navegá si preferís redirect
  }
}
