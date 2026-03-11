import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-sidebar.html',
  styleUrl: './admin-sidebar.css'
})
export class AdminSidebarComponent {

  @Input() activePage: 'dashboard' | 'reports' = 'dashboard';
  @Input() backendOnline = false;

  constructor(
    private router: Router,
    private auth:   AuthService
  ) {}

  goToDashboard(): void { this.router.navigate(['/admin']); }
  goToReports(): void   { this.router.navigate(['/admin/reports']); }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/admin/login']);
  }
}