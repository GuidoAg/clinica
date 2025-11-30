import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
} from "@angular/core";

@Directive({
  selector: "[appClickFueraPopup]",
  standalone: true,
})
export class ClickFueraPopup {
  @Output() clickFuera = new EventEmitter<void>();

  constructor(private elementRef: ElementRef) {}

  @HostListener("document:click", ["$event"])
  onClick(event: MouseEvent): void {
    const targetElement = event.target as HTMLElement;
    const clickedInside = this.elementRef.nativeElement.contains(targetElement);

    if (!clickedInside) {
      this.clickFuera.emit();
    }
  }

  @HostListener("document:keyup.escape")
  onEscape(): void {
    this.clickFuera.emit();
  }
}
