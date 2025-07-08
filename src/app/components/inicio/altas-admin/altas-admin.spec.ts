import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AltasAdmin } from './altas-admin';

describe('AltasAdmin', () => {
  let component: AltasAdmin;
  let fixture: ComponentFixture<AltasAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AltasAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AltasAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
