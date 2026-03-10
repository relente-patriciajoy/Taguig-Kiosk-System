import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminLoginComponent {

  // Properties
  username   = '';
  password   = '';
  showPass   = false;
  errorMsg   = '';
  isShaking  = false;
  isLoading  = false;

  constructor(
    private auth:   AuthService,
    private router: Router,
    private cdr:    ChangeDetectorRef
  ) {}

  // Methods
  togglePass(): void {
    this.showPass = !this.showPass;
    this.cdr.markForCheck();
  }

  onLogin(): void {
    this.errorMsg = '';
    if (!this.username || !this.password) {
      this.triggerError('Please enter username and password.');
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    // Small delay for UX feel
    setTimeout(() => {
      const ok = this.auth.login(this.username.trim(), this.password);
      if (ok) {
        this.router.navigate(['/admin']);
      } else {
        this.isLoading = false;
        this.triggerError('Invalid username or password.');
      }
    }, 600);
  }

  private triggerError(msg: string): void {
    this.errorMsg  = msg;
    this.isShaking = true;
    this.isLoading = false;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.isShaking = false;
      this.cdr.markForCheck();
    }, 500);
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}