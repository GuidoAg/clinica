import { Component, OnInit, OnDestroy, inject } from '@angular/core';

import { ImageLoader } from '../../services/image-loader';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-loading-wrapper',
  imports: [],
  template: `
    @if (loading) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
        >
        <div
          class="h-20 w-20 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
        ></div>
      </div>
    }
    
    @if (!loading) {
      <ng-content></ng-content>
    }
    `,
})
export class LoadingWrapper implements OnInit, OnDestroy {
  private imageService = inject(ImageLoader);
  private sub!: Subscription;
  loading = true;

  ngOnInit() {
    this.sub = this.imageService.isLoading$.subscribe((value) => {
      this.loading = value;
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.imageService.reset();
  }
}
