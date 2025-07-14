import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablaTurnos } from './tabla-turnos';

describe('TablaTurnos', () => {
  let component: TablaTurnos;
  let fixture: ComponentFixture<TablaTurnos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaTurnos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TablaTurnos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
