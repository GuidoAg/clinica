import { inject, Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";
import { Observable, map, filter, take } from "rxjs";
import { AuthSupabase } from "../services/auth-supabase";

@Injectable({
  providedIn: "root",
})
export class AdminGuard implements CanActivate {
  private auth = inject(AuthSupabase);
  private router = inject(Router);

  canActivate(): Observable<boolean> {
    return this.auth.user$.pipe(
      filter((user) => user !== undefined),
      take(1),
      map((user) => {
        if (user?.rol === "admin") {
          return true;
        }
        this.router.navigate(["/home"]);
        return false;
      }),
    );
  }
}
