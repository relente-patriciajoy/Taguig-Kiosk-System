import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export interface VisitorRecord {
  id:          number;
  control_no:  string;
  full_name:   string;
  id_type:     string;
  purpose:     string;
  time_in:     string;
  time_out:    string | null;
  status:      'inside' | 'checked-out';
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminComponent implements OnInit, OnDestroy {

  // Properties
  currentTime    = new Date();
  searchQuery    = '';
  filterStatus   = 'all';
  filterDate     = new Date().toISOString().split('T')[0]; // today
  isLoading      = true;
  backendOnline  = false;
  records: VisitorRecord[] = [];

  private clockInterval: any = null;
  private pollInterval:  any = null;

  get visitorsToday(): number {
    return this.records.length;
  }

  get visitorsInside(): number {
    return this.records.filter(r => r.status === 'inside').length;
  }

  get visitorsOut(): number {
    return this.records.filter(r => r.status === 'checked-out').length;
  }

  get filteredRecords(): VisitorRecord[] {
    return this.records.filter(r => {
      const matchSearch = !this.searchQuery ||
        r.full_name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        r.control_no.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        r.purpose.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchStatus = this.filterStatus === 'all' || r.status === this.filterStatus;

      return matchSearch && matchStatus;
    });
  }

  constructor(
    private auth:   AuthService,
    private router: Router,
    private cdr:    ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.clockInterval = setInterval(() => {
      this.currentTime = new Date();
      this.cdr.markForCheck();
    }, 1000);

    this.loadRecords();
    this.pollInterval = setInterval(() => this.loadRecords(), 15000);
  }

  ngOnDestroy(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);
    if (this.pollInterval)  clearInterval(this.pollInterval);
  }

  private loadRecords(): void {
    fetch(`http://127.0.0.1:8000/admin/visitors?date=${this.filterDate}`)
      .then(r => r.json())
      .then((data: any) => {
        this.backendOnline = true;
        this.records       = data.visitors ?? [];
        this.isLoading     = false;
        this.cdr.markForCheck();
      })
      .catch(() => {
        this.backendOnline = false;
        this.isLoading     = false;
        // Use mock data so dashboard is usable even without backend
        this.records = this.getMockData();
        this.cdr.markForCheck();
      });
  }

  private getMockData(): VisitorRecord[] {
    const today = new Date().toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
    return [
      { id: 1, control_no: 'TGK-20260310-AA1B2', full_name: 'Juan dela Cruz',    id_type: 'PhilSys',    purpose: 'Business Permit',    time_in: '8:02 AM', time_out: '9:15 AM',  status: 'checked-out' },
      { id: 2, control_no: 'TGK-20260310-CC3D4', full_name: 'Maria Santos',       id_type: "Driver's License", purpose: 'Civil Registry', time_in: '8:30 AM', time_out: null,       status: 'inside' },
      { id: 3, control_no: 'TGK-20260310-EE5F6', full_name: 'Jose Reyes',         id_type: 'SSS ID',     purpose: 'Social Services',    time_in: '9:01 AM', time_out: '10:00 AM', status: 'checked-out' },
      { id: 4, control_no: 'TGK-20260310-GG7H8', full_name: 'Ana Bautista',       id_type: 'Postal ID',  purpose: 'Mayor\'s Office',    time_in: '9:45 AM', time_out: null,       status: 'inside' },
      { id: 5, control_no: 'TGK-20260310-II9J0', full_name: 'Roberto Fernandez',  id_type: 'UMID',       purpose: 'Treasury Office',    time_in: '10:12 AM',time_out: null,       status: 'inside' },
    ];
  }

  // Methods
  manualCheckout(record: VisitorRecord): void {
    if (!confirm(`Check out ${record.full_name}?`)) return;

    fetch(`http://127.0.0.1:8000/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ control_no: record.control_no })
    })
    .then(r => r.json())
    .then(() => this.loadRecords())
    .catch(() => {
      // Offline — update locally
      record.status   = 'checked-out';
      record.time_out = new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
      this.cdr.markForCheck();
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/home']);
  }

  onDateChange(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.loadRecords();
  }

  getStatusClass(status: string): string {
    return status === 'inside' ? 'status-inside' : 'status-out';
  }

  trackById(_: number, r: VisitorRecord): number {
    return r.id;
  }
}