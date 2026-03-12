import { Component, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { VisitorService } from '../visitor.service';
import { LangService, AppLabels } from '../services/lang.service';
import { Subscription } from 'rxjs';

type CheckoutStep = 'scan' | 'result';
type InputMode = 'scanner' | 'manual';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckoutComponent implements OnDestroy {

  // Properties
  labels!: AppLabels;
  private langSub!: Subscription;
  currentStep: CheckoutStep = 'scan';
  inputMode: InputMode = 'scanner';
  visitorData: any = null;
  loading = false;
  error = '';
  manualInput = '';
  scannerReady = true;

  private scanBuffer = '';
  private scanTimer: any = null;
  private readonly SCAN_TIMEOUT_MS = 100; // chars this fast = scanner, not human
  private keyListener: ((e: KeyboardEvent) => void) | null = null;

  constructor(
    private visitorService: VisitorService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private langService: LangService
  ) {
    this.labels = this.langService.labels;
    this.langSub = this.langService.lang$.subscribe(() => {
      this.labels = this.langService.labels;
      this.cdr.markForCheck();
    });
    this.attachScannerListener();
  }

  ngOnDestroy(): void {
    this.detachScannerListener();
    this.clearScanTimer();
    if (this.langSub) this.langSub.unsubscribe();
  }

  // Methods

  setMode(mode: InputMode): void {
    this.inputMode = mode;
    this.error = '';
    this.manualInput = '';
    this.scanBuffer = '';
    this.scannerReady = true;
    if (mode === 'scanner') {
      this.attachScannerListener();
    } else {
      this.detachScannerListener();
    }
    this.cdr.markForCheck();
  }

  onInputChange(event: Event): void {
    this.manualInput = (event.target as HTMLInputElement).value.trim().toUpperCase();
    this.error = '';
    this.cdr.markForCheck();
  }

  submitManual(): void {
    if (!this.manualInput) return;
    this.processCheckout(this.manualInput);
  }

  reset(): void {
    this.currentStep = 'scan';
    this.visitorData = null;
    this.manualInput = '';
    this.error = '';
    this.loading = false;
    this.scanBuffer = '';
    this.scannerReady = true;
    this.inputMode = 'scanner';
    this.attachScannerListener();
    this.cdr.markForCheck();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  // Private methods

  private attachScannerListener(): void {
    this.detachScannerListener();
    this.keyListener = (e: KeyboardEvent) => this.onGlobalKeydown(e);
    document.addEventListener('keydown', this.keyListener);
  }

  private detachScannerListener(): void {
    if (this.keyListener) {
      document.removeEventListener('keydown', this.keyListener);
      this.keyListener = null;
    }
  }

  private onGlobalKeydown(e: KeyboardEvent): void {
    // Ignore modifier keys
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    // Log every key for debugging
    console.log('[SCANNER] key:', JSON.stringify(e.key), 'mode:', this.inputMode, 'step:', this.currentStep, 'buffer:', this.scanBuffer);

    // Ignore if we're not in scanner mode or already processing
    if (this.inputMode !== 'scanner' || this.loading || this.currentStep !== 'scan') return;

    if (e.key === 'Enter' || e.key === 'Tab') {
      this.clearScanTimer();
      const code = this.scanBuffer.trim().toUpperCase();
      this.scanBuffer = '';
      console.log('[SCANNER] Submitting code:', code);
      if (code.length > 3) {
        this.zone.run(() => {
          this.scannerReady = false;
          this.processCheckout(code);
        });
      }
      return;
    }

    // Accumulate characters
    if (e.key.length === 1) {
      this.scanBuffer += e.key;
      this.clearScanTimer();
      // Increased timeout to 1000ms for slower scanners
      this.scanTimer = setTimeout(() => {
        console.log('[SCANNER] Buffer timeout, trying to submit:', this.scanBuffer);
        const code = this.scanBuffer.trim().toUpperCase();
        this.scanBuffer = '';
        if (code.length > 3) {
          this.zone.run(() => {
            this.scannerReady = false;
            this.processCheckout(code);
          });
        }
      }, 1000);
    }
  }

  private clearScanTimer(): void {
    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
      this.scanTimer = null;
    }
  }

  private processCheckout(controlNo: string): void {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    this.visitorService.processExit(controlNo).subscribe({
      next: (data: any) => {
        if (data.error) {
          this.error = 'Control number not found. Please check and try again.';
          this.loading = false;
          this.scannerReady = true;
        } else {
          this.visitorData = data;
          this.currentStep = 'result';
          this.loading = false;
          this.detachScannerListener();
          // Decrement "currently inside" counter
          const inside = parseInt(sessionStorage.getItem('tgk_in') ?? '0', 10);
          sessionStorage.setItem('tgk_in', String(Math.max(0, inside - 1)));
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'Could not connect to server. Please try again.';
        this.loading = false;
        this.scannerReady = true;
        this.cdr.markForCheck();
      }
    });
  }
}