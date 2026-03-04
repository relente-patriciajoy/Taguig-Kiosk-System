import {
  Component,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  OnDestroy,
  ElementRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisitorService } from './visitor.service';

type ScanStep = 'home' | 'scan' | 'preview' | 'purpose' | 'ticket';
type CameraState = 'initializing' | 'ready' | 'captured' | 'error-permission' | 'error-hardware';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnDestroy {

  @ViewChild('videoEl') videoEl!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl') canvasEl!: ElementRef<HTMLCanvasElement>;
  @ViewChild('phoneImgEl') phoneImgEl!: ElementRef<HTMLImageElement>;

  currentStep: ScanStep = 'home';
  cameraState: CameraState = 'initializing';

  visitorData: any = null;
  capturedImageUrl: string = '';
  loading = false;
  selectedPurpose = '';
  qrCodeImage = '';
  selectedIdType = '';

  private stream: MediaStream | null = null;

  // ── Phone camera config ───────────────────────────────────────────────────
  // true  = use IP Webcam app on phone (MJPEG stream via <img> tag)
  // false = use laptop built-in webcam
  usePhoneCamera = true;
  readonly PHONE_CAMERA_URL = 'http://6.3.51.188:8080/video';
  // ─────────────────────────────────────────────────────────────────────────

  idTypes = [
    'PhilSys (National ID)',
    "Driver's License",
    'UMID',
    'Passport',
    "Voter's ID",
    'SSS ID',
    'TIN ID',
    'PhilHealth ID',
    'Postal ID',
    'PRC ID'
  ];

  purposes = [
    'Voter Certificate',
    'Voter Registration',
    'Health Certificate',
    'Tax Payment (Cedula)',
    'Office of the Mayor',
    'Civil Registry',
    'Business Permit',
    'Social Services',
    "Treasurer's Office",
    'COMELEC Services'
  ];

  constructor(
    private visitorService: VisitorService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  // ── Step 1: Select ID type and open camera ────────────────────────────────
  selectIdType(type: string): void {
    this.selectedIdType = type;
    this.capturedImageUrl = '';
    this.cameraState = 'initializing';
    this.currentStep = 'scan';
    this.cdr.markForCheck();
    setTimeout(() => this.startCamera(), 150);
  }

  private startCamera(): void {
    if (this.usePhoneCamera) {
      this.startPhoneCamera();
    } else {
      this.startLaptopCamera();
    }
  }

  // Phone: just set state to ready — the <img> tag in HTML loads MJPEG automatically
  private startPhoneCamera(): void {
    this.cameraState = 'ready';
    this.cdr.markForCheck();
  }

  // Laptop: getUserMedia stream into <video> tag
  private async startLaptopCamera(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      const video = this.videoEl.nativeElement;
      video.srcObject = this.stream;
      await video.play();

      this.cameraState = 'ready';
      this.cdr.markForCheck();

    } catch (err: any) {
      console.error('Camera error:', err.name);
      if (/NotAllowed|PermissionDenied/i.test(err.name)) {
        this.cameraState = 'error-permission';
      } else {
        this.cameraState = 'error-hardware';
      }
      this.cdr.markForCheck();
    }
  }

  // ── Step 2: Capture a still frame ────────────────────────────────────────
  captureID(): void {
    if (this.usePhoneCamera) {
      // Fetch a fresh JPEG snapshot directly from IP Webcam's /shot.jpg endpoint
      // This avoids the canvas "tainted" CORS error from drawing cross-origin <img>
      this.cameraState = 'captured';
      this.cdr.markForCheck();

      const shotUrl = this.PHONE_CAMERA_URL.replace('/video', '/shot.jpg') + '?t=' + Date.now();

      fetch(shotUrl)
        .then(res => res.blob())
        .then(blob => new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        }))
        .then(dataUrl => {
          this.capturedImageUrl = dataUrl;
          this.cdr.markForCheck();
        })
        .catch(err => {
          console.error('Snapshot fetch failed:', err);
          // Fallback: try drawing from canvas anyway
          this.captureFromCanvas();
        });

    } else {
      this.captureFromCanvas();
    }
  }

  private captureFromCanvas(): void {
    const canvas = this.canvasEl.nativeElement;
    const ctx = canvas.getContext('2d')!;
    const video = this.videoEl.nativeElement;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    this.capturedImageUrl = canvas.toDataURL('image/jpeg', 0.92);
    this.cameraState = 'captured';
    this.stopCamera();
    this.cdr.markForCheck();
  }

  // ── Step 3: Retake ────────────────────────────────────────────────────────
  retakePhoto(): void {
    this.capturedImageUrl = '';
    this.visitorData = null;
    this.cameraState = 'initializing';
    this.currentStep = 'scan';
    this.cdr.markForCheck();
    setTimeout(() => this.startCamera(), 150);
  }

  // ── Step 4: Send to backend OCR ───────────────────────────────────────────
  submitCapture(): void {
    if (!this.capturedImageUrl) return;

    this.loading = true;
    this.cdr.markForCheck();

    const base64Data = this.capturedImageUrl.split(',')[1];

    this.visitorService.captureId(base64Data, this.selectedIdType).subscribe({
      next: (data: any) => {
        this.visitorData = data;
        this.loading = false;
        this.currentStep = 'preview';
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error('OCR error:', err);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Step 5: Confirm info ──────────────────────────────────────────────────
  confirmData(): void {
    this.currentStep = 'purpose';
    this.cdr.markForCheck();
  }

  // ── Step 6: Purpose ───────────────────────────────────────────────────────
  selectPurpose(purpose: string): void {
    this.selectedPurpose = purpose;
    this.loading = true;
    this.cdr.markForCheck();

    this.visitorService.getQrCode(this.visitorData.control_no, purpose).subscribe({
      next: (res: any) => {
        this.qrCodeImage = res.qr_code;
        this.currentStep = 'ticket';
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  retryCamera(): void {
    this.cameraState = 'initializing';
    this.cdr.markForCheck();
    setTimeout(() => this.startCamera(), 300);
  }

  printPass(): void {
    window.print();
  }

  resetKiosk(): void {
    this.stopCamera();
    this.visitorData = null;
    this.capturedImageUrl = '';
    this.selectedPurpose = '';
    this.selectedIdType = '';
    this.cameraState = 'initializing';
    this.loading = false;
    this.currentStep = 'home';
    this.cdr.markForCheck();
  }

  private stopCamera(): void {
    // Stop laptop stream
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    // Stop phone stream by clearing img src
    if (this.phoneImgEl?.nativeElement) {
      this.phoneImgEl.nativeElement.src = '';
    }
  }
}