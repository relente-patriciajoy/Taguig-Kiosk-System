import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { LangService, AppLabels } from '../services/lang.service';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terms.html',
  styleUrl: './terms.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TermsComponent implements OnInit, OnDestroy {

  labels!: AppLabels;
  scrolledToBottom = false;
  private langSub!: Subscription;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private langService: LangService
  ) {
    // Set immediately so labels are available before first render
    this.labels = this.langService.labels;
  }

  ngOnInit(): void {
    this.langSub = this.langService.lang$.subscribe(() => {
      this.labels = this.langService.labels;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    if (this.langSub) this.langSub.unsubscribe();
  }

  onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (atBottom && !this.scrolledToBottom) {
      this.scrolledToBottom = true;
      this.cdr.markForCheck();
    }
  }

  accept(): void {
    this.router.navigate(['/home']);
  }

  decline(): void {
    this.router.navigate(['/']);
  }
}