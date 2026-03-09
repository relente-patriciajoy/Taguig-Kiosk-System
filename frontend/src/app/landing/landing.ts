import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingComponent implements OnInit, OnDestroy {

  // Properties
  currentTime = new Date();
  visitorsToday = 0;
  visitorsIn = 0;

  private clockInterval: any = null;
  private counterInterval: any = null;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Live clock — ticks every second
    this.clockInterval = setInterval(() => {
      this.currentTime = new Date();
      this.cdr.markForCheck();
    }, 1000);

    // Visitor counter — tries backend, falls back to session storage
    this.loadCounters();
    this.counterInterval = setInterval(() => this.loadCounters(), 30000);
  }

  ngOnDestroy(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);
    if (this.counterInterval) clearInterval(this.counterInterval);
  }

  private loadCounters(): void {
    // Try to get from backend; use sessionStorage as fallback
    fetch('http://127.0.0.1:8000/stats')
      .then(r => r.json())
      .then((data: any) => {
        this.visitorsToday = data.visitors_today ?? 0;
        this.visitorsIn = data.visitors_in ?? 0;
        this.cdr.markForCheck();
      })
      .catch(() => {
        // Backend offline — read from sessionStorage (updated by checkin/checkout)
        this.visitorsToday = parseInt(sessionStorage.getItem('tgk_today') ?? '0', 10);
        this.visitorsIn = parseInt(sessionStorage.getItem('tgk_in') ?? '0', 10);
        this.cdr.markForCheck();
      });
  }

  // Methods
  goToCheckin(): void { this.router.navigate(['/checkin']); }
  goToCheckout(): void { this.router.navigate(['/checkout']); }
}