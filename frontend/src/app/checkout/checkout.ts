import { Component, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { VisitorService } from '../visitor.service';

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
    private zone: NgZone
  ) {
    this.attachScannerListener();
  }

  ngOnDestroy(): void {
    this.detachScannerListener();
    this.clearScanTimer();
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
    // Ignore if we're not in scanner mode or already processing
    if (this.inputMode !== 'scanner' || this.loading || this.currentStep !== 'scan') return;
    // Ignore modifier keys
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    if (e.key === 'Enter') {
      this.clearScanTimer();
      const code = this.scanBuffer.trim().toUpperCase();
      this.scanBuffer = '';
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
      // If no Enter comes within timeout, clear buffer (manual key press, not scanner)
      this.scanTimer = setTimeout(() => {
        this.scanBuffer = '';
      }, 500);
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