import { inject, Injectable } from "@angular/core";
import { CanActivate } from "@angular/router";
import { Observable, map } from "rxjs";
import { AuthSupabase } from "../services/auth-supabase";

@Injectable({
  providedIn: "root",
})
export class AdminGuard implements CanActivate {
  private auth = inject(AuthSupabase);

  canActivate(): Observable<boolean> {
    return this.auth.user$.pipe(map((user) => user?.rol === "admin"));
  }
}
