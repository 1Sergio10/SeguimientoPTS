import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { AuthResponse, LoginDto, Usuario, Rol } from '../models';
import { environment } from '../../../environments/environment';


@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'pts_token';
  private readonly USER_KEY  = 'pts_user';

  // Signal reactivo del usuario actual
  private _usuario = signal<Usuario | null>(this.cargarUsuario());
  readonly usuario  = this._usuario.asReadonly();
  readonly rol      = computed(() => this._usuario()?.rol ?? null);
  readonly esProfesor  = computed(() => this._usuario()?.rol === 'PROFESOR');
  readonly esEstudiante = computed(() => this._usuario()?.rol === 'ESTUDIANTE');
  readonly autenticado  = computed(() => this._usuario() !== null);

  constructor(private http: HttpClient, private router: Router) {}

  login(dto: LoginDto) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, dto).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.usuario));
        this._usuario.set(res.usuario);
      })
    );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._usuario.set(null);
    this.router.navigateByUrl('/auth', { replaceUrl: true });
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  tieneRol(rol: Rol): boolean {
    return this._usuario()?.rol === rol;
  }

  // R4: el estudiante solo puede operar su grupo
  perteneceAGrupo(grupoId: number): boolean {
    if (this.esProfesor()) return true;
    return this._usuario()?.grupoId === grupoId;
  }

  private cargarUsuario(): Usuario | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}