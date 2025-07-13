import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ImageLoader {
  private imageMap = new Map<HTMLElement, boolean>();
  private loadingCount = 0;
  private loading$ = new BehaviorSubject<boolean>(false);

  get isLoading$() {
    return this.loading$.asObservable();
  }

  registerImage(img: HTMLElement) {
    if (!this.imageMap.has(img)) {
      this.imageMap.set(img, false);
      this.loadingCount++;
      this.emitStatus();
    }
  }

  markLoaded(img: HTMLElement) {
    if (this.imageMap.has(img) && !this.imageMap.get(img)) {
      this.imageMap.set(img, true);
      this.loadingCount--;
      this.emitStatus();
    }
  }

  private emitStatus() {
    this.loading$.next(this.loadingCount > 0);
  }

  reset() {
    this.imageMap.clear();
    this.loadingCount = 0;
    this.loading$.next(false);
  }
}
