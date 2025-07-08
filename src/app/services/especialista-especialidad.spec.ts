import { TestBed } from '@angular/core/testing';

import { EspecialistaEspecialidad } from './especialista-especialidad';

describe('EspecialistaEspecialidad', () => {
  let service: EspecialistaEspecialidad;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EspecialistaEspecialidad);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
