import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthSupabase } from '../../../services/auth-supabase';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatInputModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthSupabase);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  loginForm!: FormGroup;
  loading = false;

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      mail: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(7)]],
    });
  }

  async logear(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const { mail, password } = this.loginForm.value;
    const res = await this.auth.login(mail, password);
    this.loading = false;

    if (!res.exito) {
      // Mapa el mensaje de Supabase a uno concreto
      // const raw = res.error ?? '';
      let mensaje = 'Ocurrió un error.';

      if (res.error != null) {
        mensaje = res.error;
      }

      // if (raw.includes('Invalid login credentials')) {
      //   // Este es el error genérico de mail o contraseña inválidos
      //   mensaje = 'Email o contraseña incorrectos.';
      // } else if (raw.toLowerCase().includes('must confirm')) {
      //   // Supabase podría devolver algo como "New users must confirm email"
      //   mensaje = 'Tu email no está validado. Revisa tu bandeja de entrada.';
      // } else if (raw.toLowerCase().includes('admin_validated')) {
      //   mensaje =
      //     'Tu cuenta de especialista aún no fue aprobada por el administrador.';
      // } else if (raw.toLowerCase().includes('not found')) {
      //   mensaje = 'Este correo no está registrado.';
      // }

      this.snackBar.open(mensaje, 'Cerrar', {
        duration: 4000,
        panelClass: ['bg-red-600', 'text-white'],
      });
      return;
    }

    // Éxito
    this.snackBar.open('¡Bienvenido de nuevo!', 'Cerrar', {
      duration: 3000,
      panelClass: ['bg-green-600', 'text-white'],
    });
    await this.router.navigate(['/dashboard']);
  }
}
