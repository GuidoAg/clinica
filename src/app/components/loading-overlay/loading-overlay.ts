import { Component, inject } from '@angular/core';

import { LoadingOverlayService } from '../../services/loading-overlay-service';


@Component({
  selector: 'app-loading-overlay',
  imports: [],
  template: `
    @if (service.visible()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
        >
        <div
          class="h-20 w-20 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
        ></div>
      </div>
    }
    `,
})
export class LoadingOverlay {
  readonly service = inject(LoadingOverlayService);
}
