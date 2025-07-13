import { Component, OnInit, OnDestroy } from '@angular/core';
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

import { MiCaptcha } from '../../mi-captcha/mi-captcha';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MiCaptcha,
  ],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class Register implements OnInit, OnDestroy {
  registroForm!: FormGroup;
  tipoUsuario: 'paciente' | 'especialista' | null = null;
  obraSocialOptions = OBRAS_SOCIALES;
  especialidadOptions: Especialidad[] = [];
  captchaEsValido = false;

  captchaValidoValidator = () => {
    return (group: FormGroup): { captchaInvalido: true } | null => {
      return this.captchaEsValido ? null : { captchaInvalido: true };
    };
  };

  private subEspecialidad!: Subscription;

  constructor(
    private fb: FormBuilder,
    private auth: AuthSupabase,
    private snackBar: MatSnackBar,
    private router: Router,
    private loading: LoadingOverlayService,
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      this.loading.show();
      // Carga inicial de especialidades
      this.especialidadOptions = await this.auth.obtenerEspecialidades();
      this.especialidadOptions.push({ id: -1, nombre: 'Otra' });

      // Construcción del form
      this.registroForm = this.fb.group(
        {
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
        },
        {
          validators: this.captchaValidoValidator(),
        },
      );

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

  ngOnDestroy(): void {
    this.subEspecialidad.unsubscribe();
  }

  seleccionarTipo(tipo: 'paciente' | 'especialista'): void {
    this.tipoUsuario = tipo;

    if (!this.registroForm) return; // <--- chequeo de seguridad

    if (tipo === 'paciente') {
      this.registroForm.get('obraSocial')?.setValidators([Validators.required]);
      this.registroForm
        .get('imagenFondo')
        ?.setValidators([Validators.required]);
      this.registroForm.get('especialidad')?.clearValidators();
      this.registroForm.get('otraEspecialidad')?.clearValidators();
    } else {
      this.registroForm.get('obraSocial')?.clearValidators();
      this.registroForm
        .get('especialidad')
        ?.setValidators([Validators.required]);
      // Si especialidad no es "Otra", entonces desactivo otraEspecialidad
      const otraEspecialidadCtrl = this.registroForm.get('otraEspecialidad')!;
      if (this.registroForm.get('especialidad')?.value !== 'Otra') {
        otraEspecialidadCtrl.disable();
        otraEspecialidadCtrl.clearValidators();
      }
    }

    // Actualizar validez después de cambiar validadores
    this.registroForm.get('obraSocial')?.updateValueAndValidity();
    this.registroForm.get('especialidad')?.updateValueAndValidity();
    this.registroForm.get('otraEspecialidad')?.updateValueAndValidity();
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
      } else {
        await this.handleRegistroEspecialista();
      }
    } finally {
      this.loading.hide();
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

    //this.registroForm.reset();
    this.tipoUsuario = null;
    this.router.navigate(['/welcome-page/confirmacion']);
  }

  onCaptchaResuelto(valido: boolean) {
    this.captchaEsValido = valido;
    this.registroForm.updateValueAndValidity();
  }
}
