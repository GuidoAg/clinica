import { Directive, ElementRef, HostListener, inject } from "@angular/core";
import { ImageLoader } from "../services/image-loader";

@Directive({
  selector: "img[appTrackImage]",
})
export class TrackImage {
  private imageService = inject(ImageLoader);
  private el = inject(ElementRef<HTMLImageElement>);

  constructor() {
    this.imageService.registerImage(this.el.nativeElement);
  }

  @HostListener("load")
  onLoad() {
    this.imageService.markLoaded(this.el.nativeElement);
  }

  @HostListener("error")
  onError() {
    this.imageService.markLoaded(this.el.nativeElement);
  }
}
