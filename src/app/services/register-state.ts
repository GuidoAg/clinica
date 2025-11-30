import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class RegisterStateService {
  private resetSubject = new Subject<void>();

  reset$ = this.resetSubject.asObservable();

  triggerReset(): void {
    this.resetSubject.next();
  }
}
