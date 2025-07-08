// import { Component, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
// import { TurnosService } from '../../../services/turnos-service';
// import { EspecialidadExtendida } from '../../../models/turnos/EspecialidadExtendida';
// import { Especialidad } from '../../../models/especialidad';
// import { Especialista } from '../../../models/turnos/Especialista';

// @Component({
//   selector: 'app-solicitar-un-turno',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule],
//   templateUrl: './solicitar-un-turno.html',
//   styleUrl: './solicitar-un-turno.css',
// })
// export class SolicitarUnTurno {
//   private fb = inject(FormBuilder);
//   private turnosService = inject(TurnosService);

//   step: 1 | 2 | 3 | 4 = 1;

//   form = this.fb.group({
//     especialidadId: [null, Validators.required],
//     especialistaId: [null, Validators.required],
//     fecha: [null, Validators.required],
//     slot: [null, Validators.required],
//   });

//   especialidades: Especialidad[] = [];
//   especialistas: Especialista[] = [];
//   slotsDisponibles: { horaInicio: string; horaFin: string }[] = [];

//   ngOnInit() {
//     this.cargarEspecialidades();
//   }

//   async cargarEspecialidades() {
//     this.especialidades = await this.turnosService.obtenerEspecialidades();
//   }

//   async onSeleccionEspecialidad() {
//     const id = this.form.value.especialidadId!;
//     this.especialistas =
//       await this.turnosService.obtenerEspecialistasPorEspecialidad(id);
//     this.step = 2;
//   }

//   async onSeleccionEspecialista() {
//     this.step = 3;
//   }

//   async onSeleccionFecha() {
//     const { especialistaId, especialidadId, fecha } = this.form.value;
//     this.slotsDisponibles = await this.turnosService.obtenerSlotsDisponibles(
//       especialistaId!,
//       especialidadId!,
//       fecha!,
//     );
//     this.step = 4;
//   }

//   // async confirmarTurno() {
//   //   if (this.form.invalid) return;

//   //   const { especialistaId, especialidadId, fecha, slot } = this.form.value;
//   //   await this.turnosService.reservarTurno({
//   //     especialistaId: especialistaId!,
//   //     especialidadId: especialidadId!,
//   //     // fechaHora: this.combinarFechaHora(fecha!, slot!.horaInicio),
//   //   });
//   //   // Mostrar mensaje de éxito o redirigir
//   // }

//   private combinarFechaHora(fecha: Date, hora: string): Date {
//     const [hh, mm] = hora.split(':').map(Number);
//     const f = new Date(fecha);
//     f.setHours(hh, mm, 0, 0);
//     return f;
//   }
// }
