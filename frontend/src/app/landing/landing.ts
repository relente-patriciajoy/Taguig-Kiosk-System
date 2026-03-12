import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { LangService, AppLabels } from '../services/lang.service';

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
  currentTime   = new Date();
  visitorsToday = 0;
  visitorsIn    = 0;
  labels!: AppLabels;

  private clockInterval:   any          = null;
  private counterInterval: any          = null;
  private langSub!:        Subscription;

  constructor(
    private router:      Router,
    private cdr:         ChangeDetectorRef,
    private langService: LangService
  ) { }

  ngOnInit(): void {
    // Sync labels from shared service (reacts to toggle too)
    this.labels = this.langService.labels;
    this.langSub = this.langService.lang$.subscribe(() => {
      this.labels = this.langService.labels;
      this.cdr.markForCheck();
    });

    // Live clock
    this.clockInterval = setInterval(() => {
      this.currentTime = new Date();
      this.cdr.markForCheck();
    }, 1000);

    // Visitor counters
    this.loadCounters();
    this.counterInterval = setInterval(() => this.loadCounters(), 30000);
  }

  ngOnDestroy(): void {
    if (this.clockInterval)   clearInterval(this.clockInterval);
    if (this.counterInterval) clearInterval(this.counterInterval);
    if (this.langSub)         this.langSub.unsubscribe();
  }


  private loadCounters(): void {
    fetch('https://localhost:8000/stats')
      .then(r => r.json())
      .then((data: any) => {
        this.visitorsToday = data.visitors_today ?? 0;
        this.visitorsIn    = data.visitors_in    ?? 0;
        this.cdr.markForCheck();
      })
      .catch(() => {
        this.visitorsToday = parseInt(sessionStorage.getItem('tgk_today') ?? '0', 10);
        this.visitorsIn    = parseInt(sessionStorage.getItem('tgk_in')    ?? '0', 10);
        this.cdr.markForCheck();
      });
  }

  // Methods
  goToCheckin(): void  { this.router.navigate(['/checkin']); }
  goToCheckout(): void { this.router.navigate(['/checkout']); }
}