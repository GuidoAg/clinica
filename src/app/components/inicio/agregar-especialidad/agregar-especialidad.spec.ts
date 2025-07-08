import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarEspecialidad } from './agregar-especialidad';

describe('AgregarEspecialidad', () => {
  let component: AgregarEspecialidad;
  let fixture: ComponentFixture<AgregarEspecialidad>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarEspecialidad]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgregarEspecialidad);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
