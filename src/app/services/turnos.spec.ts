import { TestBed } from '@angular/core/testing';

import { Turnos } from './turnos';

describe('Turnos', () => {
  let service: Turnos;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Turnos);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
