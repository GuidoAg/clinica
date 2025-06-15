import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WelcomeNavbar } from './welcome-navbar';

describe('WelcomeNavbar', () => {
  let component: WelcomeNavbar;
  let fixture: ComponentFixture<WelcomeNavbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WelcomeNavbar],
    }).compileComponents();

    fixture = TestBed.createComponent(WelcomeNavbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
