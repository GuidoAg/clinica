import { CanActivateFn, Router } from "@angular/router";
import { inject } from "@angular/core";
import { Supabase } from "../supabase";

export const authGuard: CanActivateFn = async () => {
  const router = inject(Router);

  try {
    const { data, error } = await Supabase.auth.getSession();

    if (error) {
      console.error("Error al verificar sesión:", error);
      return router.createUrlTree(["/welcome-page/login"]);
    }

    if (data.session?.user) {
      return true;
    }

    return router.createUrlTree(["/welcome-page/login"]);
  } catch (e) {
    console.error("Fallo inesperado en authGuard:", e);
    return router.createUrlTree(["/welcome-page/login"]);
  }
};
