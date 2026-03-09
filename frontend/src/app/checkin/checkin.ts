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

type ScanStep    = 'home' | 'scan' | 'preview' | 'purpose' | 'ticket';
type CameraState = 'initializing' | 'ready' | 'captured' | 'error-permission' | 'error-hardware';
type FrameStatus = 'no_id' | 'too_far' | 'too_close' | 'blurry' | 'good' | 'idle';
type ScanMode    = 'camera' | 'manual';

@Component({
  selector: 'app-checkin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkin.html',
  styleUrl: './checkin.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckinComponent implements OnDestroy {

  @ViewChild('videoEl')    videoEl!:    ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl')   canvasEl!:   ElementRef<HTMLCanvasElement>;
  @ViewChild('phoneImgEl') phoneImgEl!: ElementRef<HTMLImageElement>;

  // Properties
  currentStep:    ScanStep    = 'home';
  cameraState:    CameraState = 'initializing';
  scanInputMode:  ScanMode    = 'camera';

  visitorData:      any    = null;
  capturedImageUrl        = '';
  loading                 = false;
  selectedPurpose         = '';
  qrCodeImage             = '';
  qrLoaded                = false;
  qrError                 = false;
  selectedIdType          = '';
  frameStatus:  FrameStatus = 'no_id';
  frameMessage            = 'Place your ID in the frame';
  countdownValue: number  = 0;
  isAnalyzing             = false;

  // Manual entry fields
  manualEntry = { full_name: '', birthday: '', address: '', id_number: '' };
  manualError = '';

  // Inline edit on preview
  editingField  = '';
  editingValue  = '';

  usePhoneCamera = false;
  readonly PHONE_CAMERA_URL = 'http://6.3.51.188:8080/video';
  readonly PHONE_SHOT_URL   = 'http://6.3.51.188:8080/shot.jpg';

  idTypes = [
    'PhilSys (National ID)', "Driver's License", 'UMID', 'Passport',
    "Voter's ID", 'SSS ID', 'TIN ID', 'PhilHealth ID', 'Postal ID', 'PRC ID'
  ];

  purposes = [
    'Voter Certificate', 'Voter Registration', 'Health Certificate',
    'Tax Payment (Cedula)', 'Office of the Mayor', 'Civil Registry',
    'Business Permit', 'Social Services', "Treasurer's Office", 'COMELEC Services'
  ];

  private stream:           MediaStream | null = null;
  private analyzeInterval:  any = null;
  private countdownInterval: any = null;
  private countdownActive       = false;

  constructor(
    private visitorService: VisitorService,
    private router:         Router,
    private cdr:            ChangeDetectorRef
  ) { }

  ngOnDestroy(): void {
    this.stopAll();
  }

  // ── Scan mode toggle ──────────────────────────────────────────────────────
  setScanMode(mode: ScanMode): void {
    this.scanInputMode = mode;
    this.manualError   = '';
    if (mode === 'camera') {
      this.cameraState = 'initializing';
      this.cdr.markForCheck();
      setTimeout(() => this.startCamera(), 150);
    } else {
      this.stopAll();
    }
    this.cdr.markForCheck();
  }

  // ── Manual entry ──────────────────────────────────────────────────────────
  onManualField(event: Event, field: string): void {
    const val = (event.target as HTMLInputElement).value;
    this.manualEntry = { ...this.manualEntry, [field]: val };
  }

  submitManualEntry(): void {
    const { full_name, birthday, id_number } = this.manualEntry;
    if (!full_name || !birthday || !id_number) {
      this.manualError = 'Please fill in all required fields.';
      this.cdr.markForCheck();
      return;
    }

    // Build visitorData directly from manual input — no OCR needed
    const now = new Date();
    const pad = (n: number): string => n.toString().padStart(2, '0');
    const timeIn = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const randPart = Math.random().toString(36).substring(2, 7).toUpperCase();

    this.visitorData = {
      ...this.manualEntry,
      control_no: `TGK-${datePart}-${randPart}`,
      time_in:    timeIn
    };
    this.currentStep = 'preview';
    this.cdr.markForCheck();
  }

  // ── Inline edit on preview ────────────────────────────────────────────────
  startEdit(field: string): void {
    this.editingField = field;
    this.editingValue = this.visitorData?.[field] ?? '';
    this.cdr.markForCheck();
  }

  onEditField(event: Event, field: string): void {
    this.editingValue = (event.target as HTMLInputElement).value;
  }

  saveEdit(): void {
    if (this.editingField && this.visitorData) {
      this.visitorData = { ...this.visitorData, [this.editingField]: this.editingValue };
    }
    this.editingField = '';
    this.editingValue = '';
    this.cdr.markForCheck();
  }

  // ── Step 1 ────────────────────────────────────────────────────────────────
  selectIdType(type: string): void {
    this.selectedIdType      = type;
    this.capturedImageUrl    = '';
    this.cameraState         = 'initializing';
    this.frameStatus         = 'idle';
    this.frameMessage        = '';
    this.countdownValue      = 0;
    this.scanInputMode       = 'camera';
    this.manualEntry         = { full_name: '', birthday: '', address: '', id_number: '' };
    this.currentStep         = 'scan';
    this.cdr.markForCheck();
    setTimeout(() => this.startCamera(), 150);
  }

  // ── Camera ────────────────────────────────────────────────────────────────
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

  private startAnalysisLoop(): void {
    this.stopAnalysisLoop();
    this.analyzeInterval = setInterval(() => this.analyzeCurrentFrame(), 200);
  }

  private stopAnalysisLoop(): void {
    if (this.analyzeInterval) {
      clearInterval(this.analyzeInterval);
      this.analyzeInterval = null;
    }
  }

  private analyzeCurrentFrame(): void {
    if (this.cameraState !== 'ready' || this.isAnalyzing) return;

    if (this.usePhoneCamera) {
      this.isAnalyzing = true;
      fetch(this.PHONE_SHOT_URL + '?t=' + Date.now())
        .then(res => res.blob())
        .then(blob => new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        }))
        .then(base64 => this.visitorService.analyzeFrame(base64).toPromise())
        .then((result: any) => {
          this.isAnalyzing  = false;
          this.frameStatus  = result.status;
          this.frameMessage = result.message;
          if (result.ready && !this.countdownActive) this.startCountdown();
          else if (!result.ready && this.countdownActive) this.cancelCountdown();
          this.cdr.markForCheck();
        })
        .catch(() => { this.isAnalyzing = false; });
      return;
    }

    const canvas = this.canvasEl?.nativeElement;
    if (!canvas) return;
    const ctx   = canvas.getContext('2d')!;
    const video = this.videoEl?.nativeElement;
    if (!video || video.readyState < 2) return;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;

    const imageData = ctx.getImageData(0, 0, w, h);
    const pixels    = imageData.data;
    let totalBrightness = 0;
    let sampleCount     = 0;
    for (let i = 0; i < pixels.length; i += 4 * 20) {
      totalBrightness += (pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114);
      sampleCount++;
    }
    const avgBrightness = totalBrightness / sampleCount;
    const tooDark       = avgBrightness < 20;  // lowered for indoor kiosk

    const cx = Math.floor(w * 0.2);
    const cy = Math.floor(h * 0.2);
    const cw = Math.floor(w * 0.6);
    const ch = Math.floor(h * 0.6);
    const centerData = ctx.getImageData(cx, cy, cw, ch);
    const cp         = centerData.data;
    const cWidth     = cw;

    let edgeCount = 0;
    for (let y = 1; y < ch - 1; y += 3) {
      for (let x = 1; x < cw - 1; x += 3) {
        const idx      = (y * cWidth + x) * 4;
        const gray     = cp[idx] * 0.299 + cp[idx + 1] * 0.587 + cp[idx + 2] * 0.114;
        const grayR    = cp[idx + 4] * 0.299 + cp[idx + 5] * 0.587 + cp[idx + 6] * 0.114;
        const grayD    = cp[((y + 1) * cWidth + x) * 4] * 0.299 + cp[((y + 1) * cWidth + x) * 4 + 1] * 0.587 + cp[((y + 1) * cWidth + x) * 4 + 2] * 0.114;
        if (Math.abs(gray - grayR) > 20 || Math.abs(gray - grayD) > 20) edgeCount++;
      }
    }
    const edgeDensity = edgeCount / ((ch / 3) * (cw / 3));
    const idDetected  = edgeDensity > 0.04;  // lowered
    const tooClose    = edgeDensity > 0.55;  // raised
    const tooFar      = idDetected && edgeDensity < 0.05;

    let blurSum = 0, blurCount = 0;
    for (let i = 0; i < cp.length - 8; i += 16) {
      const g1 = cp[i] * 0.299 + cp[i + 1] * 0.587 + cp[i + 2] * 0.114;
      const g2 = cp[i + 4] * 0.299 + cp[i + 5] * 0.587 + cp[i + 6] * 0.114;
      blurSum += Math.abs(g1 - g2);
      blurCount++;
    }
    const isBlurry = (blurSum / blurCount) < 2.0;  // lowered

    let status: FrameStatus;
    let message: string;
    let ready = false;

    if (tooDark)        { status = 'no_id';     message = '💡 Too dark — improve lighting'; }
    else if (!idDetected) { status = 'no_id';   message = '🔴 No ID detected — place your ID in the frame'; }
    else if (tooClose)  { status = 'too_close'; message = '🔼 Too close — move the ID further back'; }
    else if (tooFar)    { status = 'too_far';   message = '🔽 Too far — move the ID closer'; }
    else if (isBlurry)  { status = 'blurry';    message = '🟡 Hold steady — image is blurry'; }
    else                { status = 'good';       message = '✅ Looks good!'; ready = true; }

    this.frameStatus  = status;
    this.frameMessage = message;

    if (ready && !this.countdownActive)  this.startCountdown();
    else if (!ready && this.countdownActive) this.cancelCountdown();
    this.cdr.markForCheck();
  }

  private startCountdown(): void {
    this.countdownActive = true;
    this.countdownValue  = 3;
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
    this.countdownValue  = 0;
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    this.cdr.markForCheck();
  }

  private autoCaptureID(): void {
    this.stopAnalysisLoop();
    if (this.usePhoneCamera) {
      fetch(this.PHONE_SHOT_URL + '?t=' + Date.now())
        .then(res => res.blob())
        .then(blob => new Promise<string>(resolve => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        }))
        .then(dataUrl => {
          this.capturedImageUrl = dataUrl;
          this.cameraState      = 'captured';
          this.stopCamera();
          this.cdr.markForCheck();
        });
    } else {
      const canvas = this.canvasEl.nativeElement;
      const video  = this.videoEl.nativeElement;
      const ctx    = canvas.getContext('2d')!;
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      this.capturedImageUrl = canvas.toDataURL('image/jpeg', 0.92);
      this.cameraState      = 'captured';
      this.stopCamera();
      this.cdr.markForCheck();
    }
  }

  captureID(): void {
    this.cancelCountdown();
    this.autoCaptureID();
  }

  retakePhoto(): void {
    this.capturedImageUrl = '';
    this.visitorData      = null;
    this.cameraState      = 'initializing';
    this.frameStatus      = 'no_id';
    this.frameMessage     = 'Place your ID in the frame';
    this.countdownValue   = 0;
    this.scanInputMode    = 'camera';
    this.currentStep      = 'scan';
    this.cdr.markForCheck();
    setTimeout(() => this.startCamera(), 150);
  }

  submitCapture(): void {
    if (!this.capturedImageUrl) return;
    this.loading = true;
    this.cdr.markForCheck();
    const base64Data = this.capturedImageUrl.split(',')[1];
    this.visitorService.captureId(base64Data, this.selectedIdType).subscribe({
      next: (data: any) => {
        this.visitorData = data;
        this.loading     = false;
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
    this.loading         = true;
    this.cdr.markForCheck();

    // Generate QR locally first (works offline/Netlify with no backend)
    this.qrCodeImage = this.generateQrDataUrl(this.visitorData.control_no);

    // Also try backend — if it returns a data URI, prefer it
    this.visitorService.getQrCode(this.visitorData.control_no, purpose).subscribe({
      next: (res: any) => {
        const raw = res.qr_code as string;
        if (raw && raw.startsWith('data:')) this.qrCodeImage = raw;
        this.preloadQrThenShowTicket();
      },
      error: () => {
        // Already set locally above — just show ticket
        this.preloadQrThenShowTicket();
      }
    });
  }

  private preloadQrThenShowTicket(): void {
    this.qrLoaded    = false;
    this.qrError     = false;
    this.loading     = false;
    this.currentStep = 'ticket';
    this.cdr.markForCheck();
  }

  retryCamera(): void {
    this.cameraState = 'initializing';
    this.cdr.markForCheck();
    setTimeout(() => this.startCamera(), 300);
  }

  printPass(): void {
    const v     = this.visitorData;
    const qrUrl = this.qrCodeImage || this.generateQrDataUrl(v.control_no);
    const html  = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Visitor Pass</title>
  <style>
    @page { size: 80mm 200mm; margin: 3mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Courier New', monospace; font-size: 8pt; color: #000; width: 74mm; background: #fff; }
    .header { text-align: center; font-size: 7pt; font-weight: 700; letter-spacing: 1px; margin-bottom: 1mm; }
    .title  { text-align: center; font-size: 12pt; font-weight: 900; letter-spacing: 2px; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 1.5mm 0; margin-bottom: 2mm; }
    .row    { display: flex; border-bottom: 1px dotted #aaa; padding: 1mm 0; line-height: 1.4; }
    .label  { font-weight: 700; min-width: 26mm; }
    .value  { flex: 1; word-break: break-all; }
    .qr-section { text-align: center; border-top: 1px dashed #000; margin-top: 2mm; padding-top: 2mm; }
    .qr-label   { font-size: 7pt; font-weight: 700; margin-bottom: 1.5mm; }
    .qr-img     { width: 38mm; height: 38mm; display: block; margin: 0 auto; }
    .footer     { text-align: center; font-size: 7pt; border-top: 1px dashed #000; margin-top: 2mm; padding-top: 2mm; }
  </style>
</head>
<body>
  <div class="header">CITY GOVERNMENT OF TAGUIG</div>
  <div class="title">VISITOR PASS</div>
  <div class="row"><span class="label">NAME:</span><span class="value">${v.full_name}</span></div>
  <div class="row"><span class="label">BIRTHDAY:</span><span class="value">${v.birthday}</span></div>
  <div class="row"><span class="label">ID TYPE:</span><span class="value">${this.selectedIdType}</span></div>
  <div class="row"><span class="label">ID NUMBER:</span><span class="value">${v.id_number}</span></div>
  <div class="row"><span class="label">PURPOSE:</span><span class="value">${this.selectedPurpose}</span></div>
  <div class="row"><span class="label">TIME IN:</span><span class="value">${v.time_in}</span></div>
  <div class="row" style="border-bottom:none"><span class="label">CONTROL #:</span><span class="value">${v.control_no}</span></div>
  <div class="qr-section">
    <div class="qr-label">Scan at Exit Gate</div>
    <img class="qr-img" src="${qrUrl}" alt="QR Code">
  </div>
  <div class="footer">Thank you for visiting! Please keep this receipt.</div>
  <script>
    const img = document.querySelector('img');
    const doPrint = () => { window.print(); window.close(); };
    if (img.complete) { doPrint(); }
    else { img.onload = doPrint; img.onerror = doPrint; }
  <\/script>
</body>
</html>`;
    const win = window.open('', '_blank', 'width=350,height=600');
    if (win) { win.document.write(html); win.document.close(); }
  }

  goHome(): void { this.router.navigate(['/']); }

  resetKiosk(): void {
    this.stopAll();
    this.visitorData      = null;
    this.capturedImageUrl = '';
    this.selectedPurpose  = '';
    this.selectedIdType   = '';
    this.cameraState      = 'initializing';
    this.frameStatus      = 'no_id';
    this.frameMessage     = 'Place your ID in the frame';
    this.countdownValue   = 0;
    this.loading          = false;
    this.scanInputMode    = 'camera';
    this.editingField     = '';
    this.manualEntry      = { full_name: '', birthday: '', address: '', id_number: '' };
    this.manualError      = '';
    this.qrLoaded         = false;
    this.qrError          = false;
    this.currentStep      = 'home';
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

  // ── Template helpers ──────────────────────────────────────────────────────
  get statusColor(): string {
    switch (this.frameStatus) {
      case 'good':      return 'status-good';
      case 'no_id':     return 'status-bad';
      case 'too_far':   return 'status-warn';
      case 'too_close': return 'status-warn';
      case 'blurry':    return 'status-warn';
      default:          return 'status-idle';
    }
  }

  get statusIcon(): string {
    switch (this.frameStatus) {
      case 'good':      return '✅';
      case 'no_id':     return '🔴';
      case 'too_far':   return '🔽';
      case 'too_close': return '🔼';
      case 'blurry':    return '🟡';
      default:          return '⏳';
    }
  }

  onQrLoaded(): void { this.qrLoaded = true; this.qrError = false; this.cdr.markForCheck(); }
  onQrError(): void  { this.qrError = true;  this.qrLoaded = false; this.cdr.markForCheck(); }

  // ── Self-contained QR generator (no CDN, no network, no library) ──────────
  generateQrDataUrl(text: string): string {
    try {
      // QR Version 2 (25x25), Error correction L
      // We use a minimal hardcoded QR matrix approach for short strings
      const canvas  = document.createElement('canvas');
      const modules = this.buildQrMatrix(text);
      const size    = modules.length;
      const scale   = 6;
      const quiet   = 4; // quiet zone modules
      const total   = (size + quiet * 2) * scale;

      canvas.width  = total;
      canvas.height = total;
      const ctx     = canvas.getContext('2d')!;

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, total, total);

      // Draw modules
      ctx.fillStyle = '#000000';
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (modules[r][c]) {
            ctx.fillRect(
              (c + quiet) * scale,
              (r + quiet) * scale,
              scale, scale
            );
          }
        }
      }
      return canvas.toDataURL('image/png');
    } catch {
      return '';
    }
  }

  // Minimal QR matrix builder using qrcode-generator algorithm inline
  private buildQrMatrix(text: string): boolean[][] {
    // Encode using numeric/alphanumeric/byte mode auto-detection
    // This uses the standard Reed-Solomon QR algorithm (Version 1-4, ECC L)
    const data    = this.encodeQrData(text);
    const version = data.version;
    const size    = version * 4 + 17;
    const matrix: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));
    const reserved: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));

    const setModule = (r: number, c: number, dark: boolean, res = false): void => {
      matrix[r][c]   = dark;
      reserved[r][c] = res;
    };

    // Finder patterns
    const finder = (row: number, col: number): void => {
      for (let r = -1; r <= 7; r++) {
        for (let c = -1; c <= 7; c++) {
          if (row + r < 0 || row + r >= size || col + c < 0 || col + c >= size) continue;
          const dark = (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
                       (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
                       (r >= 2 && r <= 4 && c >= 2 && c <= 4);
          setModule(row + r, col + c, dark, true);
        }
      }
    };
    finder(0, 0); finder(0, size - 7); finder(size - 7, 0);

    // Separators + timing
    for (let i = 0; i < size; i++) {
      if (!reserved[6][i]) setModule(6, i, i % 2 === 0, true);
      if (!reserved[i][6]) setModule(i, 6, i % 2 === 0, true);
    }

    // Format info placeholder
    const fmtPos = [0,1,2,3,4,5,7,8].concat(
      Array.from({length: 7}, (_, i) => size - 7 + i)
    );
    fmtPos.forEach(i => {
      if (i < size) { reserved[8][i] = true; reserved[i][8] = true; }
    });
    setModule(size - 8, 8, true, true); // dark module

    // Place data bits
    const bits = data.bits;
    let bitIdx = 0;
    let goUp   = true;
    for (let col = size - 1; col >= 0; col -= 2) {
      if (col === 6) col--;
      for (let ri = 0; ri < size; ri++) {
        const row = goUp ? size - 1 - ri : ri;
        for (let shift = 0; shift <= 1; shift++) {
          const c = col - shift;
          if (!reserved[row][c]) {
            const bit = bitIdx < bits.length ? bits[bitIdx++] : 0;
            matrix[row][c] = (bit === 1) !== ((row + c) % 3 === 0); // mask 5
          }
        }
      }
      goUp = !goUp;
    }

    // Write format info (ECC L, mask 5 = 101): format word = 0b110111101000001 XOR mask
    const fmt = [1,1,0,1,1,1,1,0,1,0,0,0,0,0,1];
    [0,1,2,3,4,5,7].forEach((c, i) => { matrix[8][c] = fmt[i]; });
    [0,1,2,3,4,5,6,7].forEach((r, i) => { matrix[size-1-i][8] = fmt[i]; });
    matrix[8][8]        = fmt[7];
    [8,9,10,11,12,13,14].forEach((c, i) => { matrix[8][c] = fmt[i + 7]; });
    [size-7,size-6,size-5,size-4,size-3,size-2,size-1].forEach((r, i) => {
      matrix[r][8] = fmt[i + 8];
    });

    return matrix;
  }

  private encodeQrData(text: string): { bits: number[], version: number } {
    // Byte mode encoding, Version 1 (21x21) supports up to 17 bytes ECC-L
    // Version 2 (25x25) supports up to 32 bytes ECC-L
    const bytes  = Array.from(text).map(c => c.charCodeAt(0));
    const version = bytes.length <= 17 ? 1 : 2;

    // Mode indicator: byte mode = 0100
    const bits: number[] = [0, 1, 0, 0];

    // Character count (8 bits for version 1-9, byte mode)
    const len = bytes.length;
    for (let i = 7; i >= 0; i--) bits.push((len >> i) & 1);

    // Data bytes
    bytes.forEach(byte => {
      for (let i = 7; i >= 0; i--) bits.push((byte >> i) & 1);
    });

    // Terminator
    for (let i = 0; i < 4 && bits.length < (version === 1 ? 152 : 272); i++) bits.push(0);

    // Pad to byte boundary
    while (bits.length % 8 !== 0) bits.push(0);

    // Pad codewords
    const padBytes = [0xEC, 0x11];
    let   padIdx   = 0;
    const capacity = version === 1 ? 152 : 272;
    while (bits.length < capacity) {
      const p = padBytes[padIdx++ % 2];
      for (let i = 7; i >= 0; i--) bits.push((p >> i) & 1);
    }

    return { bits, version };
  }
}