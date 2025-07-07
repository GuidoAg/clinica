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

//import { mapSupabaseError } from '../../../mappers/mapAuthError';

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

  @ViewChild('emailInput') emailInputRef!: ElementRef<HTMLInputElement>;

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      mail: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(7)]],
    });
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

    this.overlay.hide();

    if (!res.success) {
      this.snackBar.open(res.errorCode ?? 'Error de login', 'Cerrar', {
        duration: 4000,
        panelClass: ['bg-red-600', 'text-white'],
      });
      return;
    }

    this.router.navigate(['/home']);
  }
}
