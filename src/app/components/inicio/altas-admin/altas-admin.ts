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

  registroForm!: FormGroup;
  tipoUsuario: 'paciente' | 'especialista' | null = null;

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

      this.registroForm = this.fb.group({
        nombre: ['', [Validators.required, Validators.minLength(2)]],
        apellido: ['', [Validators.required, Validators.minLength(2)]],
        edad: [
          null,
          [Validators.required, Validators.min(18), Validators.max(99)],
        ],
        dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
        obraSocial: [''],
        mail: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(7)]],
        especialidad: [''],
        otraEspecialidad: [{ value: '', disabled: true }],
        imagenPerfil: [null, Validators.required],
        imagenFondo: [''],
      });

      this.subEspecialidad = this.registroForm
        .get('especialidad')!
        .valueChanges.subscribe((value) => {
          const otra = this.registroForm.get('otraEspecialidad')!;
          if (value?.id === -1) {
            otra.enable();
            otra.setValidators([Validators.required, Validators.minLength(2)]);
          } else {
            otra.disable();
            otra.clearValidators();
          }
          otra.updateValueAndValidity();
        });
    } finally {
      this.loading.hide();
    }
  }

  seleccionarTipo(tipo: 'paciente' | 'especialista'): void {
    this.tipoUsuario = tipo;

    const form = this.registroForm;
    if (!form) return;

    form
      .get('obraSocial')
      ?.setValidators(tipo === 'paciente' ? [Validators.required] : []);
    form
      .get('especialidad')
      ?.setValidators(tipo === 'especialista' ? [Validators.required] : []);
    form.get('obraSocial')?.updateValueAndValidity();
    form.get('especialidad')?.updateValueAndValidity();
  }

  onFileSelected(event: Event, tipo: 'perfil' | 'fondo') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const ctrlName = tipo === 'perfil' ? 'imagenPerfil' : 'imagenFondo';
    const control = this.registroForm.get(ctrlName)!;

    if (!file) {
      control.setValue(null);
      control.setErrors({ required: true });
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      control.setErrors({ invalidType: true });
      return;
    }

    control.setValue(file);
    control.setErrors(null);
  }

  async registrar(): Promise<void> {
    if (this.registroForm.invalid || !this.tipoUsuario) return;
    this.loading.show();

    try {
      this.tipoUsuario === 'paciente'
        ? await this.registrarPaciente()
        : await this.registrarEspecialista();
    } finally {
      this.loading.hide();
    }
  }

  private async registrarPaciente() {
    const f = this.registroForm.value;

    const payload: RegistroPaciente = {
      nombre: f.nombre,
      apellido: f.apellido,
      edad: f.edad,
      dni: f.dni,
      obraSocial: f.obraSocial,
      mail: f.mail,
      contrasena: f.password,
      imagenPerfil: await fileToBase64(f.imagenPerfil),
      imagenFondo: await fileToBase64(f.imagenFondo),
    };

    const res: RespuestaApi<void> = await this.auth.registerPaciente(payload);
    this.mostrarResultado(res.success, res.success ? undefined : res.errorCode);
  }

  private async registrarEspecialista() {
    const f = this.registroForm.value;

    const especialidad =
      f.especialidad?.id === -1 ? f.otraEspecialidad : f.especialidad.nombre;

    const payload: RegistroEspecialista = {
      nombre: f.nombre,
      apellido: f.apellido,
      edad: f.edad,
      dni: f.dni,
      mail: f.mail,
      contrasena: f.password,
      especialidad,
      imagenPerfil: await fileToBase64(f.imagenPerfil),
    };

    const res: RespuestaApi<void> =
      await this.auth.registerEspecialista(payload);
    this.mostrarResultado(res.success, res.success ? undefined : res.errorCode);
  }

  private mostrarResultado(success: boolean, msg?: string) {
    this.snackBar.open(
      msg || (success ? 'Registro exitoso' : 'Error inesperado'),
      'Cerrar',
      {
        duration: 4000,
        panelClass: success
          ? ['bg-green-600', 'text-white']
          : ['bg-red-600', 'text-white'],
      },
    );

    if (success) {
      this.tipoUsuario = null;
      this.cerrarPopup(); // o navegá si preferís redirect
    }
  }
}
