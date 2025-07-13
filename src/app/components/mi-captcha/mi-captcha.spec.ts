import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiCaptcha } from './mi-captcha';

describe('MiCaptcha', () => {
  let component: MiCaptcha;
  let fixture: ComponentFixture<MiCaptcha>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiCaptcha]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MiCaptcha);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
