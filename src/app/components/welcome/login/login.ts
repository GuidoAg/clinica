import {
  Component,
  OnInit,
  inject,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { CommonModule } from "@angular/common";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";
import { AuthSupabase } from "../../../services/auth-supabase";
import { LoadingOverlayService } from "../../../services/loading-overlay-service";

import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { TranslocoModule } from "@jsverse/transloco";

export interface UsuarioAutoLog {
  nombre: string;
  imagenUrl: string;
  mail: string;
  password: string;
}

@Component({
  selector: "app-login",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    TranslocoModule,
  ],
  templateUrl: "./login.html",
  styleUrl: "./login.css",
})
export class Login implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private auth = inject(AuthSupabase);
  private overlay = inject(LoadingOverlayService);

  loginForm!: FormGroup;
  hidePassword = true;
  autoLogVisible = false;

  usuariosAutoLog: UsuarioAutoLog[] = [
    {
      nombre: "Admin",
      imagenUrl: "assets/imagenes/Login/admin.webp",
      mail: "admin.embezzle816@passmail.net",
      password: "1234567",
    },
    {
      nombre: "Agustin",
      imagenUrl: "assets/imagenes/Login/especialista2.webp",
      mail: "banova2860@okcdeals.com",
      password: "1234567",
    },
    {
      nombre: "Ana",
      imagenUrl: "assets/imagenes/Login/especialista1.webp",
      mail: "hogowa4011@okcdeals.com",
      password: "1234567",
    },
    {
      nombre: "Guido",
      imagenUrl: "assets/imagenes/Login/paciente1.webp",
      mail: "resoc47612@okcdeals.com",
      password: "1234567",
    },
    {
      nombre: "Maria",
      imagenUrl: "assets/imagenes/Login/paciente3.webp",
      mail: "wavate3116@moondyal.com",
      password: "1234567",
    },
    {
      nombre: "Roberto",
      imagenUrl: "assets/imagenes/Login/paciente2.webp",
      mail: "wihob84360@moondyal.com",
      password: "1234567",
    },
  ];

  @ViewChild("emailInput") emailInputRef!: ElementRef<HTMLInputElement>;

  ngOnInit(): void {
    this.overlay.show();
    this.loginForm = this.fb.group({
      mail: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(7)]],
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
      this.snackBar.open(res.errorCode ?? "Error de login", "Cerrar", {
        duration: 4000,
        panelClass: ["bg-red-600", "text-white"],
      });
      this.overlay.hide();
      return;
    }

    const user = await this.auth.getCurrentUser();

    if (user) {
      await this.auth.registrarIngreso(user.id);
    }

    this.router.navigate(["/home"]);
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
