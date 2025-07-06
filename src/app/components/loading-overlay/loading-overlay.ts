import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoadingOverlayService } from '../../services/loading-overlay-service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-loading-overlay',
  imports: [CommonModule, MatProgressSpinnerModule, NgIf],
  template: `
    <div
      *ngIf="service.visible()"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
    >
      <mat-spinner
        diameter="60"
        color="primary"
        class="!h-20 !w-20 !text-red-500 [animation-duration:2s]"
        mode="indeterminate"
      />
    </div>
  `,
})
export class LoadingOverlay {
  readonly service = inject(LoadingOverlayService);
}
