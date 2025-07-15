import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccionesPaciente } from './acciones-paciente';

describe('AccionesPaciente', () => {
  let component: AccionesPaciente;
  let fixture: ComponentFixture<AccionesPaciente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccionesPaciente]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccionesPaciente);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
