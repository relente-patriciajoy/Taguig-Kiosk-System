import { Component, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { VisitorService } from '../visitor.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckoutComponent {
  currentStep: 'scan' | 'result' = 'scan';
  visitorData: any = null;
  loading = false;
  error = '';
  manualInput = '';

  constructor(
    private visitorService: VisitorService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  onInputChange(event: Event): void {
    this.manualInput = (event.target as HTMLInputElement).value.trim().toUpperCase();
  }

  submitManual(): void {
    if (!this.manualInput) return;
    this.processCheckout(this.manualInput);
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
        } else {
          this.visitorData = data;
          this.currentStep = 'result';
          this.loading = false;
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'Could not connect to server. Please try again.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  reset(): void {
    this.currentStep = 'scan';
    this.visitorData = null;
    this.manualInput = '';
    this.error = '';
    this.loading = false;
    this.cdr.markForCheck();
  }

  goHome(): void { this.router.navigate(['/']); }
}