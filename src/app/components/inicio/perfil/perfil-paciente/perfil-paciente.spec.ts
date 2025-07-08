import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerfilPaciente } from './perfil-paciente';

describe('PerfilPaciente', () => {
  let component: PerfilPaciente;
  let fixture: ComponentFixture<PerfilPaciente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilPaciente]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PerfilPaciente);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
