import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
  Input,
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
import { LoadingOverlayService } from "../../../services/loading-overlay-service";

import { FormsModule } from "@angular/forms";
import { RegistroAdmin } from "../../../models/Auth/RegistroAdmin";

@Component({
  selector: "app-altas-admin",
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule
],
  templateUrl: "./altas-admin.html",
  styleUrl: "./altas-admin.css",
})
export class AltasAdmin implements OnInit, OnDestroy {
  @Input() perfilId!: number;
  @Output() cerrar = new EventEmitter<void>();
  @Output() altaExitosa = new EventEmitter<void>();

  registroForm!: FormGroup;
  tipoUsuario: "paciente" | "especialista" | "admin" | null = null;

  obraSocialOptions = OBRAS_SOCIALES;
  especialidadOptions: Especialidad[] = [];
  especialidadesSeleccionadas = new Set<number>();
  mostrarCampoOtraEspecialidad = false;
  desplegableEspecialidadesAbierto = false;

  private subEspecialidad!: Subscription;

  private fb = inject(FormBuilder);
  private auth = inject(AuthSupabase);
  private snackBar = inject(MatSnackBar);
  private loading = inject(LoadingOverlayService);
  private elementRef = inject(ElementRef);

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

      // Construcción del form
      this.registroForm = this.fb.group({
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
            Validators.minLength(2),
            Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/),
          ],
        ],
        imagenPerfil: [null, Validators.required],
        imagenFondo: [""],
      });
    } catch {
      // Error al cargar especialidades
      console.error("Error al cargar especialidades");
    } finally {
      this.loading.hide();
    }
  }

  seleccionarTipo(tipo: "paciente" | "especialista" | "admin"): void {
    this.tipoUsuario = tipo;

    if (!this.registroForm) return;

    const obraSocialCtrl = this.registroForm.get("obraSocial");
    const especialidadesCtrl = this.registroForm.get(
      "especialidadesSeleccionadas",
    );
    const nuevaEspecialidadCtrl = this.registroForm.get("nuevaEspecialidad");

    if (tipo === "paciente") {
      obraSocialCtrl?.setValidators([Validators.required]);
      especialidadesCtrl?.clearValidators();
      nuevaEspecialidadCtrl?.clearValidators();
    } else if (tipo === "especialista") {
      obraSocialCtrl?.clearValidators();
      especialidadesCtrl?.setValidators([
        this.alMenosUnaEspecialidadValidator(),
      ]);
    } else if (tipo === "admin") {
      this.registroForm.get("obraSocial")?.setValue("");
      this.registroForm.get("especialidadesSeleccionadas")?.setValue([]);
      this.registroForm.get("nuevaEspecialidad")?.setValue("");
      this.registroForm.get("imagenFondo")?.setValue("");
      this.especialidadesSeleccionadas.clear();
      this.mostrarCampoOtraEspecialidad = false;

      // Admin no requiere ni obraSocial ni especialidad
      obraSocialCtrl?.clearValidators();
      especialidadesCtrl?.clearValidators();
      nuevaEspecialidadCtrl?.clearValidators();
    }

    // Actualizar validez
    obraSocialCtrl?.updateValueAndValidity();
    especialidadesCtrl?.updateValueAndValidity();
    nuevaEspecialidadCtrl?.updateValueAndValidity();
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

    this.loading.show(); // <--- spinner on
    try {
      if (this.tipoUsuario === "paciente") {
        await this.handleRegistroPaciente();
      } else if (this.tipoUsuario === "especialista") {
        await this.handleRegistroEspecialista();
      } else if (this.tipoUsuario === "admin") {
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

      if (errorNormal?.includes("error desconocido")) {
        this.mostrarResultado(res.success, res.message);
      } else {
        this.mostrarResultado(res.success, res.errorCode);
      }
    } catch {
      this.mostrarResultado(false, "Error al procesar las imágenes.");
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

      // Construir array de especialidades
      const especialidades: string[] = [];

      // Agregar especialidades seleccionadas (convertir IDs a string)
      if (
        f.especialidadesSeleccionadas &&
        f.especialidadesSeleccionadas.length > 0
      ) {
        especialidades.push(
          ...f.especialidadesSeleccionadas.map((id: number) => String(id)),
        );
      }

      // Agregar nueva especialidad si fue ingresada
      if (f.nuevaEspecialidad && f.nuevaEspecialidad.trim()) {
        especialidades.push(f.nuevaEspecialidad.trim());
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
    this.altaExitosa.emit(); // o navegá si preferís redirect
  }
}
