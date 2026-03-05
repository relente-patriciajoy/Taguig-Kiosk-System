import {
  Component,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  OnDestroy,
  ElementRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { VisitorService } from '../visitor.service';

type ScanStep = 'home' | 'scan' | 'preview' | 'purpose' | 'ticket';
type CameraState = 'initializing' | 'ready' | 'captured' | 'error-permission' | 'error-hardware';
type FrameStatus = 'no_id' | 'too_far' | 'too_close' | 'blurry' | 'good' | 'idle';

@Component({
  selector: 'app-checkin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkin.html',
  styleUrl: './checkin.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckinComponent implements OnDestroy {

  @ViewChild('videoEl') videoEl!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl') canvasEl!: ElementRef<HTMLCanvasElement>;
  @ViewChild('phoneImgEl') phoneImgEl!: ElementRef<HTMLImageElement>;

  currentStep: ScanStep = 'home';
  cameraState: CameraState = 'initializing';

  visitorData: any = null;
  capturedImageUrl = '';
  loading = false;
  selectedPurpose = '';
  qrCodeImage = '';
  selectedIdType = '';

  // ── Real-time frame analysis state ────────────────────────────────────────
  frameStatus: FrameStatus = 'no_id';
  frameMessage = 'Place your ID in the frame';
  countdownValue: number = 0;      // 3 → 2 → 1 → 0 (capture)
  isAnalyzing = false;  // prevents overlapping requests

  private stream: MediaStream | null = null;
  private analyzeInterval: any = null;
  private countdownInterval: any = null;
  private countdownActive = false;

  // ── Phone camera config ───────────────────────────────────────────────────
  usePhoneCamera = false;
  readonly PHONE_CAMERA_URL = 'http://6.3.51.188:8080/video';   // direct phone stream
  readonly PHONE_SHOT_URL = 'http://6.3.51.188:8080/shot.jpg'; // direct snapshot

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
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnDestroy(): void {
    this.stopAll();
  }

  // ── Step 1 ────────────────────────────────────────────────────────────────
  selectIdType(type: string): void {
    this.selectedIdType = type;
    this.capturedImageUrl = '';
    this.cameraState = 'initializing';
    this.frameStatus = 'idle';
    this.frameMessage = '';
    this.countdownValue = 0;
    this.currentStep = 'scan';
    this.cdr.markForCheck();
    setTimeout(() => this.startCamera(), 150);
  }

  // ── Camera start ──────────────────────────────────────────────────────────
  private startCamera(): void {
    if (this.usePhoneCamera) {
      this.startPhoneCamera();
    } else {
      this.startLaptopCamera();
    }
  }

  private startPhoneCamera(): void {
    this.cameraState = 'ready';
    this.cdr.markForCheck();
    // Wait a moment for the <img> to load before starting analysis
    setTimeout(() => this.startAnalysisLoop(), 1000);
  }

  private async startLaptopCamera(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      const video = this.videoEl.nativeElement;
      video.srcObject = this.stream;
      await video.play();
      this.cameraState = 'ready';
      this.cdr.markForCheck();
      setTimeout(() => this.startAnalysisLoop(), 500);
    } catch (err: any) {
      this.cameraState = /NotAllowed|PermissionDenied/i.test(err.name)
        ? 'error-permission' : 'error-hardware';
      this.cdr.markForCheck();
    }
  }

  // ── Frame analysis loop ───────────────────────────────────────────────────
  private startAnalysisLoop(): void {
    this.stopAnalysisLoop();
    // Send a frame every 800ms for analysis
    this.analyzeInterval = setInterval(() => this.analyzeCurrentFrame(), 200);
  }

  private stopAnalysisLoop(): void {
    if (this.analyzeInterval) {
      clearInterval(this.analyzeInterval);
      this.analyzeInterval = null;
    }
  }

  private grabFrameAsBase64(): string | null {
    const canvas = this.canvasEl?.nativeElement;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d')!;

    if (this.usePhoneCamera) {
      const img = this.phoneImgEl?.nativeElement;
      if (!img) return null;
      const iw = img.naturalWidth || img.clientWidth || 640;
      const ih = img.naturalHeight || img.clientHeight || 480;
      if (iw === 0 || ih === 0) return null;
      canvas.width = iw;
      canvas.height = ih;
      try {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      } catch (e) { return null; }
    } else {
      const video = this.videoEl?.nativeElement;
      if (!video || video.readyState < 2) return null;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    // Use lower quality (0.6) for analysis frames — faster, smaller payload
    return canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
  }

  private analyzeCurrentFrame(): void {
    if (this.cameraState !== 'ready' || this.isAnalyzing) return;

    if (this.usePhoneCamera) {
      // For phone camera — fetch shot.jpg and analyze via backend
      // This avoids the cross-origin canvas restriction entirely
      this.isAnalyzing = true;
      fetch(this.PHONE_SHOT_URL + '?t=' + Date.now())
        .then(res => res.blob())
        .then(blob => new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        }))
        .then(base64 => {
          return this.visitorService.analyzeFrame(base64).toPromise();
        })
        .then((result: any) => {
          this.isAnalyzing = false;
          this.frameStatus = result.status;
          this.frameMessage = result.message;
          if (result.ready && !this.countdownActive) {
            this.startCountdown();
          } else if (!result.ready && this.countdownActive) {
            this.cancelCountdown();
          }
          this.cdr.markForCheck();
        })
        .catch(() => { this.isAnalyzing = false; });
      return;
    }

    // Laptop camera — use canvas pixel analysis (same origin, no CORS)
    const canvas = this.canvasEl?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const video = this.videoEl?.nativeElement;
    if (!video || video.readyState < 2) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;

    // ── 1. Brightness check — is the frame too dark? ─────────────────────
    const imageData = ctx.getImageData(0, 0, w, h);
    const pixels = imageData.data;
    let totalBrightness = 0;
    const sampleStep = 20; // sample every 20th pixel for speed
    let sampleCount = 0;
    for (let i = 0; i < pixels.length; i += 4 * sampleStep) {
      totalBrightness += (pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114);
      sampleCount++;
    }
    const avgBrightness = totalBrightness / sampleCount;
    const tooDark = avgBrightness < 40;

    // ── 2. Edge density — detect if an ID card is present ─────────────────
    // Sample the CENTER region only (where the ID should be)
    const cx = Math.floor(w * 0.2);
    const cy = Math.floor(h * 0.2);
    const cw = Math.floor(w * 0.6);
    const ch = Math.floor(h * 0.6);
    const centerData = ctx.getImageData(cx, cy, cw, ch);
    const cp = centerData.data;

    let edgeCount = 0;
    const cWidth = cw;
    for (let y = 1; y < ch - 1; y += 3) {
      for (let x = 1; x < cw - 1; x += 3) {
        const idx = (y * cWidth + x) * 4;
        const gray = cp[idx] * 0.299 + cp[idx + 1] * 0.587 + cp[idx + 2] * 0.114;
        const grayRight = cp[idx + 4] * 0.299 + cp[idx + 5] * 0.587 + cp[idx + 6] * 0.114;
        const grayDown = cp[((y + 1) * cWidth + x) * 4] * 0.299 +
          cp[((y + 1) * cWidth + x) * 4 + 1] * 0.587 +
          cp[((y + 1) * cWidth + x) * 4 + 2] * 0.114;
        if (Math.abs(gray - grayRight) > 20 || Math.abs(gray - grayDown) > 20) {
          edgeCount++;
        }
      }
    }
    const totalSampled = (ch / 3) * (cw / 3);
    const edgeDensity = edgeCount / totalSampled;
    const idDetected = edgeDensity > 0.08; // ID has text/edges → above threshold

    // ── 3. Size estimation — is ID too close or too far? ──────────────────
    // Count bright vs dark edge pixels at frame borders
    // Simple heuristic: if ID fills more than 90% of center → too close
    // If edge density very low in center → too far
    const tooClose = edgeDensity > 0.45;
    const tooFar = idDetected && edgeDensity < 0.10;

    // ── 4. Blur detection — variance of brightness differences ────────────
    let blurSum = 0;
    let blurCount = 0;
    for (let i = 0; i < cp.length - 8; i += 4 * 4) {
      const g1 = cp[i] * 0.299 + cp[i + 1] * 0.587 + cp[i + 2] * 0.114;
      const g2 = cp[i + 4] * 0.299 + cp[i + 5] * 0.587 + cp[i + 6] * 0.114;
      blurSum += Math.abs(g1 - g2);
      blurCount++;
    }
    const sharpness = blurSum / blurCount;
    const isBlurry = sharpness < 3.5;

    // ── Determine status ───────────────────────────────────────────────────
    let status: FrameStatus;
    let message: string;
    let ready = false;

    if (tooDark) {
      status = 'no_id';
      message = '💡 Too dark — improve lighting';
    } else if (!idDetected) {
      status = 'no_id';
      message = '🔴 No ID detected — place your ID in the frame';
    } else if (tooClose) {
      status = 'too_close';
      message = '🔼 Too close — move the ID further back';
    } else if (tooFar) {
      status = 'too_far';
      message = '🔽 Too far — move the ID closer';
    } else if (isBlurry) {
      status = 'blurry';
      message = '🟡 Hold steady — image is blurry';
    } else {
      status = 'good';
      message = '✅ Looks good!';
      ready = true;
    }

    this.frameStatus = status;
    this.frameMessage = message;

    if (ready && !this.countdownActive) {
      this.startCountdown();
    } else if (!ready && this.countdownActive) {
      this.cancelCountdown();
    }

    this.cdr.markForCheck();
  }

  // ── Countdown 3 → 2 → 1 → capture ───────────────────────────────────────
  private startCountdown(): void {
    this.countdownActive = true;
    this.countdownValue = 3;
    this.cdr.markForCheck();

    this.countdownInterval = setInterval(() => {
      this.countdownValue--;
      this.cdr.markForCheck();

      if (this.countdownValue <= 0) {
        this.cancelCountdown();
        this.autoCaptureID();
      }
    }, 1000);
  }

  private cancelCountdown(): void {
    this.countdownActive = false;
    this.countdownValue = 0;
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    this.cdr.markForCheck();
  }

  // ── Auto capture triggered by countdown ──────────────────────────────────
  private autoCaptureID(): void {
    this.stopAnalysisLoop();

    if (this.usePhoneCamera) {
      // Fetch fresh JPEG from /shot.jpg — avoids tainted canvas
      const shotUrl = this.PHONE_SHOT_URL + '?t=' + Date.now();
      fetch(shotUrl)
        .then(res => res.blob())
        .then(blob => new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        }))
        .then(dataUrl => {
          this.capturedImageUrl = dataUrl;
          this.cameraState = 'captured';
          this.stopCamera();
          this.cdr.markForCheck();
        });
    } else {
      // Laptop camera — draw from video element
      const canvas = this.canvasEl.nativeElement;
      const video = this.videoEl.nativeElement;
      const ctx = canvas.getContext('2d')!;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      this.capturedImageUrl = canvas.toDataURL('image/jpeg', 0.92);
      this.cameraState = 'captured';
      this.stopCamera();
      this.cdr.markForCheck();
    }
  }

  // ── Manual capture button (fallback) ─────────────────────────────────────
  captureID(): void {
    this.cancelCountdown();
    this.autoCaptureID();
  }

  // ── Retake ────────────────────────────────────────────────────────────────
  retakePhoto(): void {
    this.capturedImageUrl = '';
    this.visitorData = null;
    this.cameraState = 'initializing';
    this.frameStatus = 'no_id';
    this.frameMessage = 'Place your ID in the frame';
    this.countdownValue = 0;
    this.currentStep = 'scan';
    this.cdr.markForCheck();
    setTimeout(() => this.startCamera(), 150);
  }

  // ── Submit to OCR ─────────────────────────────────────────────────────────
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

  confirmData(): void {
    this.currentStep = 'purpose';
    this.cdr.markForCheck();
  }

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
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  retryCamera(): void {
    this.cameraState = 'initializing';
    this.cdr.markForCheck();
    setTimeout(() => this.startCamera(), 300);
  }

  printPass(): void { window.print(); }

  goHome(): void { this.router.navigate(['/']); }

  resetKiosk(): void {
    this.stopAll();
    this.visitorData = null;
    this.capturedImageUrl = '';
    this.selectedPurpose = '';
    this.selectedIdType = '';
    this.cameraState = 'initializing';
    this.frameStatus = 'no_id';
    this.frameMessage = 'Place your ID in the frame';
    this.countdownValue = 0;
    this.loading = false;
    this.currentStep = 'home';
    this.cdr.markForCheck();
  }

  private stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.phoneImgEl?.nativeElement) {
      this.phoneImgEl.nativeElement.src = '';
    }
  }

  private stopAll(): void {
    this.stopAnalysisLoop();
    this.cancelCountdown();
    this.stopCamera();
  }

  // ── Helper for template ───────────────────────────────────────────────────
  get statusColor(): string {
    switch (this.frameStatus) {
      case 'good': return 'status-good';
      case 'no_id': return 'status-bad';
      case 'too_far': return 'status-warn';
      case 'too_close': return 'status-warn';
      case 'blurry': return 'status-warn';
      default: return 'status-idle';
    }
  }

  get statusIcon(): string {
    switch (this.frameStatus) {
      case 'good': return '✅';
      case 'no_id': return '🔴';
      case 'too_far': return '🔽';
      case 'too_close': return '🔼';
      case 'blurry': return '🟡';
      default: return '⏳';
    }
  }
}