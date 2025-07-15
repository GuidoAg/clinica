import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  UrlTree,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthSupabase } from '../services/auth-supabase';

@Injectable({
  providedIn: 'root',
})
export class EspecialistaGuard implements CanActivate {
  constructor(private auth: AuthSupabase) {}

  canActivate(): Observable<boolean> {
    return this.auth.user$.pipe(map((user) => user?.rol === 'especialista'));
  }
}
