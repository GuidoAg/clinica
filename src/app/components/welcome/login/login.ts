import {
  Component,
  OnInit,
  inject,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthSupabase } from '../../../services/auth-supabase';
import { LoadingOverlayService } from '../../../services/loading-overlay-service';

import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface UsuarioAutoLog {
  nombre: string;
  imagenUrl: string;
  mail: string;
  password: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private auth = inject(AuthSupabase);
  private overlay = inject(LoadingOverlayService); // nuevo

  loginForm!: FormGroup;
  hidePassword = true;
  autoLogVisible = false;

  usuariosAutoLog: UsuarioAutoLog[] = [
    {
      nombre: 'Admin',
      imagenUrl: 'assets/imagenes/Login/admin.png',
      mail: 'insua.guido@gmail.com',
      password: '1234567',
    },
    {
      nombre: 'Pepe',
      imagenUrl: 'assets/imagenes/Login/especialista1.png',
      mail: 'espe.deduct310@passmail.net',
      password: '1234567',
    },
    {
      nombre: 'Especialista',
      imagenUrl: 'assets/imagenes/Login/especialista2.png',
      mail: 'paciente@demo.com',
      password: 'paciente123',
    },
    {
      nombre: 'Guido',
      imagenUrl: 'assets/imagenes/Login/paciente1.png',
      mail: 'pepitoluis.culture104@passmail.net',
      password: '1234567',
    },
    {
      nombre: 'Paciente',
      imagenUrl: 'assets/imagenes/Login/paciente2.png',
      mail: 'user2@demo.com',
      password: 'user123',
    },
    {
      nombre: 'Paciente',
      imagenUrl: 'assets/imagenes/Login/paciente3.png',
      mail: 'user3@demo.com',
      password: 'user123',
    },
  ];

  @ViewChild('emailInput') emailInputRef!: ElementRef<HTMLInputElement>;

  ngOnInit(): void {
    this.overlay.show();
    this.loginForm = this.fb.group({
      mail: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(7)]],
    });
    this.overlay.hide();
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.emailInputRef?.nativeElement.focus());
  }

  async login(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.overlay.show();

    const { mail, password } = this.loginForm.value;
    const res = await this.auth.login(mail, password);

    if (!res.success) {
      this.snackBar.open(res.errorCode ?? 'Error de login', 'Cerrar', {
        duration: 4000,
        panelClass: ['bg-red-600', 'text-white'],
      });
      this.overlay.hide();
      return;
    }

    //this.overlay.hide();
    this.router.navigate(['/home']);
  }

  toggleAutoLog() {
    this.autoLogVisible = !this.autoLogVisible;
  }

  autocompletar(user: UsuarioAutoLog): void {
    this.loginForm.patchValue({
      mail: user.mail,
      password: user.password,
    });
  }
}
