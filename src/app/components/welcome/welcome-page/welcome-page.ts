import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-welcome-page',
  imports: [MatIconModule, CommonModule, FormsModule],
  templateUrl: './welcome-page.html',
  styleUrl: './welcome-page.css',
})
export class WelcomePage implements OnInit, OnDestroy {
  constructor(private router: Router) {}

  opciones = [
    { icon: 'local_hospital', label: 'Consultas' },
    { icon: 'medication', label: 'Farmacia' },
    { icon: 'event', label: 'Turnos' },
    { icon: 'support', label: 'Ayuda' },
  ];

  carouselItems = [
    {
      img: 'tarjeta1.jpg',
      titulo: 'Guardias 24hs',
      descripcion: 'Atención médica de urgencia todo el día.',
    },
    {
      img: 'tarjeta2.jpg',
      titulo: 'Cobertura Nacional',
      descripcion: 'Red de centros en todo el país.',
    },
    {
      img: 'tarjeta3.jpg',
      titulo: 'Turnos Online',
      descripcion: 'Reservá desde tu casa.',
    },
    {
      img: 'tarjeta4.jpg',
      titulo: 'Descuentos',
      descripcion: 'Beneficios en farmacias y ópticas.',
    },
    {
      img: 'tarjeta5.jpg',
      titulo: 'Atención Pediátrica',
      descripcion: 'Cuidamos a los más chicos.',
    },
    {
      img: 'tarjeta6.jpg',
      titulo: 'Estudios Médicos',
      descripcion: 'Tecnología de punta a tu alcance.',
    },
  ];

  currentStartIndex = 0;
  visibleItems: any[] = [];
  intervalId: any;

  ngOnInit() {
    this.updateVisibleItems();
    this.startAutoSlide();
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  updateVisibleItems() {
    const total = this.carouselItems.length;
    this.visibleItems = [
      this.carouselItems[this.currentStartIndex % total],
      this.carouselItems[(this.currentStartIndex + 1) % total],
      this.carouselItems[(this.currentStartIndex + 2) % total],
    ];
  }

  nextSlide() {
    this.currentStartIndex =
      (this.currentStartIndex + 1) % this.carouselItems.length;
    this.updateVisibleItems();
  }

  prevSlide() {
    this.currentStartIndex =
      (this.currentStartIndex - 1 + this.carouselItems.length) %
      this.carouselItems.length;
    this.updateVisibleItems();
  }

  manualNextSlide() {
    this.nextSlide();
    this.resetAutoSlide();
  }

  manualPrevSlide() {
    this.prevSlide();
    this.resetAutoSlide();
  }

  startAutoSlide() {
    this.intervalId = setInterval(() => this.nextSlide(), 4000);
  }

  resetAutoSlide() {
    clearInterval(this.intervalId);
    this.startAutoSlide();
  }

  clickRegister() {
    this.router.navigate(['/welcome-page/registro']);
  }

  clickHome() {
    this.router.navigate(['/home']);
  }
}
