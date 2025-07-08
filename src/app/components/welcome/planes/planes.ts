import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-planes',
  imports: [MatIconModule, CommonModule, FormsModule, MatExpansionModule],
  templateUrl: './planes.html',
  styleUrl: './planes.css',
})
export class Planes {
  constructor(private router: Router) {}

  clickLogin() {
    this.router.navigate(['/welcome-page/login']);
  }
}
