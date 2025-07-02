import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AuthSupabase } from '../../../services/auth-supabase';
import { RegistroPaciente } from '../../../models/Auth/RegistroPaciente';
import { RegistroEspecialista } from '../../../models/Auth/RegistroEspecialista';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Supabase } from '../../../supabase';

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
  ],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class Register implements OnInit {
  registroForm!: FormGroup;
  selectedImageUrl: string | null = null;
  tipoUsuario: 'paciente' | 'especialista' | null = null;

  obraSocialOptions = [
    'Osde',
    'SwissMedical',
    'Galeno',
    'Pami',
    'Medife',
    'Ioma',
  ];
  especialidadOptions = ['Otra'];

  constructor(
    private fb: FormBuilder,
    private auth: AuthSupabase,
    private snackBar: MatSnackBar,
  ) {
    this.tipoUsuario = null;
  }

  async ngOnInit(): Promise<void> {
    this.cargarEspecialidades();

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
        '',
        [
          Validators.required,
          Validators.pattern(/^\d+$/),
          Validators.min(18),
          Validators.max(99),
        ],
      ],
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      obraSocial: ['', Validators.required],
      mail: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(7)]],
      especialidad: ['', Validators.required],
      otraEspecialidad: [
        { value: '', disabled: true },
        [
          Validators.minLength(2),
          Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/),
        ],
      ],
      imagen: [null, Validators.required],
    });

    this.registroForm.get('especialidad')?.valueChanges.subscribe((value) => {
      const otraControl = this.registroForm.get('otraEspecialidad');
      if (value === 'Otra') {
        otraControl?.enable();
        otraControl?.setValidators([
          Validators.required,
          Validators.minLength(2),
          Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/),
        ]);
      } else {
        otraControl?.disable();
        otraControl?.clearValidators();
      }
      otraControl?.updateValueAndValidity();
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.registroForm.get('imagen')?.setValue(null);
      this.registroForm.get('imagen')?.setErrors({ required: true });
      this.selectedImageUrl = null;
      return;
    }

    const file = input.files[0];
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];

    if (!validTypes.includes(file.type)) {
      this.registroForm.get('imagen')?.setErrors({ invalidType: true });
      this.selectedImageUrl = null;
      return;
    }

    // ✅ Imagen válida
    this.registroForm.get('imagen')?.setValue(file);
    this.registroForm.get('imagen')?.setErrors(null);
  }

  seleccionarTipo(tipo: 'paciente' | 'especialista') {
    this.tipoUsuario = tipo;

    if (tipo === 'paciente') {
      this.registroForm.get('obraSocial')?.setValidators(Validators.required);
      this.registroForm.get('especialidad')?.clearValidators();
    } else {
      this.registroForm.get('especialidad')?.setValidators(Validators.required);
      this.registroForm.get('obraSocial')?.clearValidators();
    }

    this.registroForm.get('obraSocial')?.updateValueAndValidity();
    this.registroForm.get('especialidad')?.updateValueAndValidity();
  }

  private async cargarEspecialidades(): Promise<void> {
    const { data, error } = await Supabase.from('specialties')
      .select('name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error al obtener especialidades', error.message);
      this.especialidadOptions = ['Otra'];
      return;
    }

    const nombres = data?.map((e) => e.name) ?? [];
    this.especialidadOptions = [...nombres, 'Otra'];
  }

  async registrar(): Promise<void> {
    if (this.registroForm.invalid || !this.tipoUsuario) {
      this.registroForm.markAllAsTouched();
      return;
    }

    const formValue = this.registroForm.value;
    const imagen = formValue.imagen;

    const imageUrl = await this.subirImagen(imagen);
    if (!imageUrl) {
      this.snackBar.open('Error al subir la imagen.', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    if (this.tipoUsuario === 'paciente') {
      const paciente: RegistroPaciente = {
        nombre: formValue.nombre,
        apellido: formValue.apellido,
        edad: formValue.edad,
        dni: formValue.dni,
        obraSocial: formValue.obraSocial,
        mail: formValue.mail,
        contrasena: formValue.password,
        imagenPerfil: imageUrl,
        imagenFondo: '', // podrías manejar esto como parte opcional después
      };

      const res = await this.auth.registrarPaciente(paciente);
      this.mostrarResultado(res);
    }

    if (this.tipoUsuario === 'especialista') {
      const especialidad =
        formValue.especialidad === 'Otra'
          ? formValue.otraEspecialidad
          : formValue.especialidad;

      const especialista: RegistroEspecialista = {
        nombre: formValue.nombre,
        apellido: formValue.apellido,
        edad: formValue.edad,
        dni: formValue.dni,
        mail: formValue.mail,
        contrasena: formValue.password,
        especialidad: especialidad,
        imagenPerfil: imageUrl,
      };

      const res = await this.auth.registrarEspecialista(especialista);
      this.mostrarResultado(res);
    }
  }

  private async subirImagen(file: File): Promise<string | null> {
    const filePath = `perfiles/${Date.now()}-${file.name}`;
    const { data, error } = await Supabase.storage
      .from('imagenes') // Debe existir el bucket "imagenes"
      .upload(filePath, file);

    if (error) return null;

    const { data: urlData } = Supabase.storage
      .from('imagenes')
      .getPublicUrl(filePath);

    return urlData?.publicUrl ?? null;
  }

  private mostrarResultado(res: { exito: boolean; error?: string }) {
    if (res.exito) {
      this.snackBar.open(
        'Registro exitoso. Por favor verifica tu correo.',
        'Cerrar',
        {
          duration: 4000,
          panelClass: ['bg-green-600', 'text-white'],
        },
      );
      this.registroForm.reset();
      this.tipoUsuario = null;
    } else {
      this.snackBar.open(res.error || 'Ocurrió un error (default).', 'Cerrar', {
        duration: 4000,
        panelClass: ['bg-red-600', 'text-white'],
      });
    }
  }
}
