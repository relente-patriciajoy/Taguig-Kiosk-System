import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { VisitorService } from './visitor.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  // --- Variables ---
  visitorData: any = null;
  loading: boolean = false;
  currentStep: 'home' | 'scan' | 'purpose' | 'ticket' = 'home';
  selectedPurpose: string = '';
  qrCodeImage: string = '';

  selectedIdType: string = '';
  idTypes = ['PhilSys (National ID)', 'Driver\'s License', 'UMID', 'Passport', 'Voter\'s ID'];

  purposes = [
    'Voter Certificate',
    'Voter Registration',
    'Health Certificate',
    'Tax Payment (Cedula)',
    'Office of the Mayor'
  ];

  constructor(
    private visitorService: VisitorService,
    private cdr: ChangeDetectorRef // Added for UI refresh
  ) { }

  // --- Logic ---

  // Function to choose the ID
  selectIdType(type: string) {
    this.selectedIdType = type;
    this.currentStep = 'scan'; // Now move to the scan screen
    this.cdr.detectChanges();
  }
  onScanClick() {
    this.loading = true;

    this.visitorService.getScannedData().subscribe({
      next: (data) => {
        // Removed console.log for security
        this.visitorData = data;
        this.loading = false;
        this.currentStep = 'purpose';

        // Force Angular to update the screen immediately
        this.cdr.detectChanges();
      },
      error: (err) => {
        // We log the error type for debugging, but not the user data
        console.error("Connection to backend failed.");
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectPurpose(purpose: string) {
    this.selectedPurpose = purpose;
    this.loading = true;

    this.visitorService.getQrCode(this.visitorData.control_no, purpose).subscribe({
      next: (res) => {
        this.qrCodeImage = res.qr_code;
        this.currentStep = 'ticket';
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        alert("Error generating QR Pass");
        this.loading = false;
      }
    });
  }

  printPass() {
    window.print();
  }

  resetKiosk() {
    this.visitorData = null;
    this.selectedPurpose = '';
    this.currentStep = 'home';
    this.cdr.detectChanges();
  }
}