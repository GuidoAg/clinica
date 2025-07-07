import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingOverlayService } from '../../services/loading-overlay-service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-loading-overlay',
  imports: [CommonModule, NgIf],
  template: `
    <div
      *ngIf="service.visible()"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
    >
      <div
        class="h-20 w-20 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
      ></div>
    </div>
  `,
})
export class LoadingOverlay {
  readonly service = inject(LoadingOverlayService);
}
