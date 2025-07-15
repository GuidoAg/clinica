import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccionesAdmin } from './acciones-admin';

describe('AccionesAdmin', () => {
  let component: AccionesAdmin;
  let fixture: ComponentFixture<AccionesAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccionesAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccionesAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
