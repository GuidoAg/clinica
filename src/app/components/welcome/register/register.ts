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

  obraSocialOptions = ['opcion1', 'opcion2'];
  especialidadOptions = ['Cardiología', 'Dermatología', 'Otra'];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
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

  registrar() {
    if (this.registroForm.valid) {
      console.log('Formulario enviado:', this.registroForm.value);
      // Aquí va la lógica de registro
    } else {
      this.registroForm.markAllAsTouched();
    }
  }
}
