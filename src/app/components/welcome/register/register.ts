import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  HostListener,
  ElementRef,
} from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { CommonModule } from "@angular/common";
import { Subscription } from "rxjs";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatSnackBar } from "@angular/material/snack-bar";

import { AuthSupabase } from "../../../services/auth-supabase";
import { RegistroPaciente } from "../../../models/Auth/RegistroPaciente";
import { RegistroEspecialista } from "../../../models/Auth/RegistroEspecialista";
import { RespuestaApi } from "../../../models/RespuestaApi";
import { fileToBase64 } from "../../../helpers/upload-base64";
import { OBRAS_SOCIALES } from "../../../constants/obras-sociales";
import { Especialidad } from "../../../models/SupaBase/Especialidad";
import { Router } from "@angular/router";
import { LoadingOverlayService } from "../../../services/loading-overlay-service";
import { RegisterStateService } from "../../../services/register-state";
import { TranslocoModule } from "@jsverse/transloco";

import { MiCaptcha } from "../../mi-captcha/mi-captcha";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MiCaptcha,
    TranslocoModule,
  ],
  templateUrl: "./register.html",
  styleUrls: ["./register.css"],
})
export class Register implements OnInit, OnDestroy {
  registroForm!: FormGroup;
  tipoUsuario: "paciente" | "especialista" | null = null;
  obraSocialOptions = OBRAS_SOCIALES;
  especialidadOptions: Especialidad[] = [];
  especialidadesSeleccionadas = new Set<number>();
  captchaEsValido = false;
  mostrarCampoOtraEspecialidad = false;
  desplegableEspecialidadesAbierto = false;

  captchaValidoValidator = () => {
    return (): { captchaInvalido: true } | null => {
      return this.captchaEsValido ? null : { captchaInvalido: true };
    };
  };

  private subEspecialidad!: Subscription;
  private subReset!: Subscription;

  private fb = inject(FormBuilder);
  private auth = inject(AuthSupabase);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private loading = inject(LoadingOverlayService);
  private elementRef = inject(ElementRef);
  private registerState = inject(RegisterStateService);

  ngOnInit(): void {
    this.registroForm = this.fb.group(
      {
        nombre: [
          "",
          [
            Validators.required,
            Validators.minLength(2),
            Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/),
          ],
        ],
        apellido: [
          "",
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
        dni: ["", [Validators.required, Validators.pattern(/^\d{8}$/)]],
        obraSocial: [""],
        mail: ["", [Validators.required, Validators.email]],
        password: ["", [Validators.required, Validators.minLength(7)]],
        especialidadesSeleccionadas: [[]],
        nuevaEspecialidad: [
          "",
          [
            Validators.minLength(4),
            Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/),
          ],
        ],
        imagenPerfil: [null, Validators.required],
        imagenFondo: [""],
      },
      {
        validators: this.captchaValidoValidator(),
      },
    );

    this.subReset = this.registerState.reset$.subscribe(() => {
      this.resetearFormulario();
    });
  }

  ngOnDestroy(): void {
    if (this.subEspecialidad) {
      this.subEspecialidad.unsubscribe();
    }
    if (this.subReset) {
      this.subReset.unsubscribe();
    }
  }

  async seleccionarTipo(tipo: "paciente" | "especialista"): Promise<void> {
    this.tipoUsuario = tipo;

    if (!this.registroForm) return;

    if (tipo === "especialista") {
      try {
        this.loading.show();
        this.especialidadOptions = await this.auth.obtenerEspecialidades();
        this.especialidadesSeleccionadas.clear();
      } catch (error) {
        console.error("Error al obtener especialidades:", error);
        this.snackBar.open(
          "Error al cargar especialidades. Intente nuevamente.",
          "Cerrar",
          { duration: 3000 },
        );
      } finally {
        this.loading.hide();
      }
    }

    if (tipo === "paciente") {
      this.registroForm.get("obraSocial")?.setValidators([Validators.required]);
      this.registroForm
        .get("imagenFondo")
        ?.setValidators([Validators.required]);
      this.registroForm.get("especialidadesSeleccionadas")?.clearValidators();
      this.registroForm.get("nuevaEspecialidad")?.clearValidators();
    } else {
      this.registroForm.get("obraSocial")?.clearValidators();
      this.registroForm.get("imagenFondo")?.clearValidators();
      this.registroForm
        .get("especialidadesSeleccionadas")
        ?.setValidators([this.alMenosUnaEspecialidadValidator()]);
    }

    this.registroForm.get("obraSocial")?.updateValueAndValidity();
    this.registroForm.get("imagenFondo")?.updateValueAndValidity();
    this.registroForm
      .get("especialidadesSeleccionadas")
      ?.updateValueAndValidity();
  }

  alMenosUnaEspecialidadValidator() {
    return (control: { value: number[] }) => {
      const especialidades = control.value || [];
      const nuevaEsp = this.registroForm?.get("nuevaEspecialidad")?.value;
      if (especialidades.length === 0 && !nuevaEsp) {
        return { alMenosUna: true };
      }
      return null;
    };
  }

  toggleEspecialidad(especialidadId: number): void {
    if (this.especialidadesSeleccionadas.has(especialidadId)) {
      this.especialidadesSeleccionadas.delete(especialidadId);
    } else {
      this.especialidadesSeleccionadas.add(especialidadId);
    }
    this.actualizarEspecialidadesEnForm();
  }

  toggleMostrarNuevaEspecialidad(): void {
    this.mostrarCampoOtraEspecialidad = !this.mostrarCampoOtraEspecialidad;
    if (!this.mostrarCampoOtraEspecialidad) {
      this.registroForm.get("nuevaEspecialidad")?.setValue("");
    }
  }

  normalizarNombre(texto: string): string {
    texto = texto.trim();
    if (!texto) return texto;
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
  }

  agregarNuevaEspecialidad(): void {
    const nuevaEspControl = this.registroForm.get("nuevaEspecialidad");
    const nombreEspecialidad = nuevaEspControl?.value?.trim();

    if (!nombreEspecialidad || nuevaEspControl?.invalid) {
      this.snackBar.open(
        "Por favor, ingrese un nombre válido para la especialidad.",
        "Cerrar",
        { duration: 3000 },
      );
      return;
    }

    const nombreNormalizado = this.normalizarNombre(nombreEspecialidad);

    const existeEspecialidad = this.especialidadOptions.some(
      (esp) => esp.nombre.toLowerCase() === nombreNormalizado.toLowerCase(),
    );

    if (existeEspecialidad) {
      this.snackBar.open(
        "Esta especialidad ya existe. Por favor, selecciónela de la lista.",
        "Cerrar",
        { duration: 3000 },
      );
      return;
    }

    const nuevoId = -(this.especialidadOptions.length + 1);
    const nuevaEspecialidad: Especialidad = {
      id: nuevoId,
      nombre: nombreNormalizado,
    };

    this.especialidadOptions.push(nuevaEspecialidad);

    this.especialidadesSeleccionadas.add(nuevoId);
    this.actualizarEspecialidadesEnForm();

    if (nuevaEspControl) {
      nuevaEspControl.setValue("");
    }
    this.mostrarCampoOtraEspecialidad = false;

    this.snackBar.open(
      `Especialidad "${nombreNormalizado}" agregada y seleccionada.`,
      "Cerrar",
      { duration: 3000, panelClass: ["bg-green-600", "text-white"] },
    );
  }

  toggleDesplegableEspecialidades(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.desplegableEspecialidadesAbierto =
      !this.desplegableEspecialidadesAbierto;
  }

  @HostListener("document:click", ["$event"])
  onClickOutside(event: Event): void {
    if (!this.desplegableEspecialidadesAbierto) {
      return;
    }

    const target = event.target as HTMLElement;
    const clickedInside = this.elementRef.nativeElement
      .querySelector(".relative")
      ?.contains(target);

    if (!clickedInside) {
      this.desplegableEspecialidadesAbierto = false;
    }
  }

  obtenerEspecialidadesSeleccionadasTexto(): string {
    if (this.especialidadesSeleccionadas.size === 0) {
      return "Ninguna seleccionada";
    }
    const nombres = Array.from(this.especialidadesSeleccionadas)
      .map((id) => this.especialidadOptions.find((e) => e.id === id)?.nombre)
      .filter((nombre) => nombre);
    return nombres.join(", ");
  }

  esEspecialidadSeleccionada(especialidadId: number): boolean {
    return this.especialidadesSeleccionadas.has(especialidadId);
  }

  private actualizarEspecialidadesEnForm(): void {
    const idsArray = Array.from(this.especialidadesSeleccionadas);
    this.registroForm.get("especialidadesSeleccionadas")?.setValue(idsArray);
    this.registroForm
      .get("especialidadesSeleccionadas")
      ?.updateValueAndValidity();
  }

  onFileSelected(event: Event, tipo: "perfil" | "fondo") {
    const controlName = tipo === "perfil" ? "imagenPerfil" : "imagenFondo";
    const input = event.target as HTMLInputElement;
    const ctrl = this.registroForm.get(controlName)!;

    if (!input.files?.length) {
      ctrl.setValue(null);
      ctrl.setErrors({ required: true });
      return;
    }

    const file = input.files[0];
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      ctrl.setErrors({ invalidType: true });
      return;
    }

    ctrl.setValue(file);
    ctrl.setErrors(null);
  }

  async registrar(): Promise<void> {
    if (this.registroForm.invalid || !this.tipoUsuario) return;

    this.loading.show();
    try {
      if (this.tipoUsuario === "paciente") {
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

      if (errorNormal?.includes("error desconocido")) {
        this.mostrarResultado(res.success, res.message);
      } else {
        this.mostrarResultado(res.success, res.errorCode);
      }
    } catch {
      this.mostrarResultado(false, "Error al procesar las imágenes.");
    }
  }

  private async handleRegistroEspecialista(): Promise<void> {
    try {
      const f = this.registroForm.value;
      const imgPerfil = await fileToBase64(f.imagenPerfil as File);

      const especialidades: string[] = [];

      if (
        f.especialidadesSeleccionadas &&
        f.especialidadesSeleccionadas.length > 0
      ) {
        f.especialidadesSeleccionadas.forEach((id: number) => {
          if (id > 0) {
            especialidades.push(String(id));
          } else {
            const especialidadNueva = this.especialidadOptions.find(
              (esp) => esp.id === id,
            );
            if (especialidadNueva) {
              especialidades.push(especialidadNueva.nombre);
            }
          }
        });
      }

      const payload: RegistroEspecialista = {
        nombre: f.nombre,
        apellido: f.apellido,
        edad: f.edad,
        dni: f.dni,
        mail: f.mail,
        contrasena: f.password,
        especialidades,
        imagenPerfil: imgPerfil,
      };

      const res: RespuestaApi<void> =
        await this.auth.registerEspecialista(payload);

      const errorNormal = res.errorCode?.toLowerCase();

      if (errorNormal?.includes("error desconocido")) {
        this.mostrarResultado(res.success, res.message);
      } else {
        this.mostrarResultado(res.success, res.errorCode);
      }
    } catch {
      this.mostrarResultado(false, "Error al procesar la imagen.");
    }
  }

  private mostrarResultado(exito: boolean, mensaje?: string) {
    if (!exito) {
      this.snackBar.open(mensaje || "Ocurrió un error.", "Cerrar", {
        duration: 4000,
        panelClass: ["bg-red-600", "text-white"],
      });
      return;
    }

    this.tipoUsuario = null;
    this.router.navigate(["/welcome-page/confirmacion"]);
  }

  onCaptchaResuelto(valido: boolean) {
    this.captchaEsValido = valido;
    this.registroForm.updateValueAndValidity();
  }

  private resetearFormulario(): void {
    this.tipoUsuario = null;
    this.especialidadesSeleccionadas.clear();
    this.captchaEsValido = false;
    this.mostrarCampoOtraEspecialidad = false;
    this.desplegableEspecialidadesAbierto = false;
    this.registroForm.reset();

    this.especialidadOptions = this.especialidadOptions.filter(
      (esp) => esp.id > 0,
    );

    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}
