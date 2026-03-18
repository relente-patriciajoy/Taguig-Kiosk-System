import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AdminSidebarComponent } from './admin-sidebar';

const API_URL = 'https://10.71.0.53:8000'; // Change to Railway URL for production

export interface ReportRecord {
  id:         number;
  control_no: string;
  full_name:  string;
  id_type:    string;
  purpose:    string;
  time_in:    string;
  time_out:   string | null;
  status:     'inside' | 'checked-out';
}

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent],
  templateUrl: './admin-reports.html',
  styleUrl: './admin-reports.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminReportsComponent implements OnInit {

  // ── Filter state ────────────────────────────────────────────────────────
  filterMode:  'day' | 'month' | 'year' = 'day';
  filterDay:   string = new Date().toISOString().split('T')[0];  // YYYY-MM-DD
  filterMonth: string = new Date().toISOString().substring(0, 7); // YYYY-MM
  filterYear:  string = new Date().getFullYear().toString();

  yearOptions: string[] = [];

  // ── Data ────────────────────────────────────────────────────────────────
  records:      ReportRecord[] = [];
  isLoading     = false;
  backendOnline = false;
  errorMsg      = '';
  today         = new Date();

  // ── Computed ─────────────────────────────────────────────────────────────
  get totalVisitors(): number  { return this.records.length; }
  get totalInside(): number    { return this.records.filter(r => r.status === 'inside').length; }
  get totalCheckedOut(): number { return this.records.filter(r => r.status === 'checked-out').length; }

  get reportLabel(): string {
    if (this.filterMode === 'day')   return `Date: ${this.filterDay}`;
    if (this.filterMode === 'month') return `Month: ${this.filterMonth}`;
    return `Year: ${this.filterYear}`;
  }

  constructor(
    private auth:   AuthService,
    private router: Router,
    private cdr:    ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Build year options: current year down to 2024
    const cur = new Date().getFullYear();
    for (let y = cur; y >= 2024; y--) {
      this.yearOptions.push(y.toString());
    }
    this.loadReport();
  }

  // ── Navigation ──────────────────────────────────────────────────────────

  // ── Load data ───────────────────────────────────────────────────────────
  onFilterChange(): void { this.loadReport(); }

  loadReport(): void {
    this.isLoading = true;
    this.errorMsg  = '';
    this.cdr.markForCheck();

    let url = '';
    if (this.filterMode === 'day') {
      url = `${API_URL}/admin/visitors?date=${this.filterDay}`;
    } else if (this.filterMode === 'month') {
      url = `${API_URL}/admin/visitors/range?month=${this.filterMonth}`;
    } else {
      url = `${API_URL}/admin/visitors/range?year=${this.filterYear}`;
    }

    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: any) => {
        this.records      = data.visitors ?? [];
        this.backendOnline = true;
        this.isLoading    = false;
        this.cdr.markForCheck();
      })
      .catch(() => {
        this.backendOnline = false;
        this.isLoading    = false;
        this.errorMsg     = 'Could not load data. Make sure the backend is running.';
        this.cdr.markForCheck();
      });
  }

  // ── Print / PDF ─────────────────────────────────────────────────────────
  printReport(): void {
    window.print();
  }
}