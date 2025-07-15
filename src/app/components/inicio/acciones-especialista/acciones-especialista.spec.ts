import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccionesEspecialista } from './acciones-especialista';

describe('AccionesEspecialista', () => {
  let component: AccionesEspecialista;
  let fixture: ComponentFixture<AccionesEspecialista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccionesEspecialista]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccionesEspecialista);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
