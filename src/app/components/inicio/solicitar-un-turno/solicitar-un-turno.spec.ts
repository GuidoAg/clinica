import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolicitarUnTurno } from './solicitar-un-turno';

describe('SolicitarUnTurno', () => {
  let component: SolicitarUnTurno;
  let fixture: ComponentFixture<SolicitarUnTurno>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolicitarUnTurno]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SolicitarUnTurno);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
