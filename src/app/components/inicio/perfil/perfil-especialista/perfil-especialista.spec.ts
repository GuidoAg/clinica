import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerfilEspecialista } from './perfil-especialista';

describe('PerfilEspecialista', () => {
  let component: PerfilEspecialista;
  let fixture: ComponentFixture<PerfilEspecialista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilEspecialista]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PerfilEspecialista);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
