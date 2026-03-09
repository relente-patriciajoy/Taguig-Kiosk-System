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
type ScanMode = 'camera' | 'manual';

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

  // Properties
  currentStep: ScanStep = 'home';
  cameraState: CameraState = 'initializing';
  scanInputMode: ScanMode = 'camera';

  visitorData: any = null;
  capturedImageUrl = '';
  loading = false;
  selectedPurpose = '';
  qrCodeImage = '';
  qrLoaded = false;
  qrError = false;
  selectedIdType = '';
  frameStatus: FrameStatus = 'no_id';
  frameMessage = 'Place your ID in the frame';
  countdownValue: number = 0;
  isAnalyzing = false;

  // Manual entry fields
  manualEntry = { full_name: '', birthday: '', address: '', id_number: '' };
  manualError = '';

  // Inline edit on preview
  editingField = '';
  editingValue = '';

  usePhoneCamera = false;
  readonly PHONE_CAMERA_URL = 'http://6.3.51.188:8080/video';
  readonly PHONE_SHOT_URL = 'http://6.3.51.188:8080/shot.jpg';

  idTypes = [
    'PhilSys (National ID)', "Driver's License", 'UMID', 'Passport',
    "Voter's ID", 'SSS ID', 'TIN ID', 'PhilHealth ID', 'Postal ID', 'PRC ID'
  ];

  purposes = [
    'Voter Certificate', 'Voter Registration', 'Health Certificate',
    'Tax Payment (Cedula)', 'Office of the Mayor', 'Civil Registry',
    'Business Permit', 'Social Services', "Treasurer's Office", 'COMELEC Services'
  ];

  private stream: MediaStream | null = null;
  private analyzeInterval: any = null;
  private countdownInterval: any = null;
  private countdownActive = false;

  constructor(
    private visitorService: VisitorService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnDestroy(): void {
    this.stopAll();
  }

  // ── Scan mode toggle ──────────────────────────────────────────────────────
  setScanMode(mode: ScanMode): void {
    this.scanInputMode = mode;
    this.manualError = '';
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
      time_in: timeIn
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
    this.selectedIdType = type;
    this.capturedImageUrl = '';
    this.cameraState = 'initializing';
    this.frameStatus = 'idle';
    this.frameMessage = '';
    this.countdownValue = 0;
    this.scanInputMode = 'camera';
    this.manualEntry = { full_name: '', birthday: '', address: '', id_number: '' };
    this.currentStep = 'scan';
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
          this.isAnalyzing = false;
          this.frameStatus = result.status;
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
    const ctx = canvas.getContext('2d')!;
    const video = this.videoEl?.nativeElement;
    if (!video || video.readyState < 2) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;

    const imageData = ctx.getImageData(0, 0, w, h);
    const pixels = imageData.data;
    let totalBrightness = 0;
    let sampleCount = 0;
    for (let i = 0; i < pixels.length; i += 4 * 20) {
      totalBrightness += (pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114);
      sampleCount++;
    }
    const avgBrightness = totalBrightness / sampleCount;
    const tooDark = avgBrightness < 20;  // lowered for indoor kiosk

    const cx = Math.floor(w * 0.2);
    const cy = Math.floor(h * 0.2);
    const cw = Math.floor(w * 0.6);
    const ch = Math.floor(h * 0.6);
    const centerData = ctx.getImageData(cx, cy, cw, ch);
    const cp = centerData.data;
    const cWidth = cw;

    let edgeCount = 0;
    for (let y = 1; y < ch - 1; y += 3) {
      for (let x = 1; x < cw - 1; x += 3) {
        const idx = (y * cWidth + x) * 4;
        const gray = cp[idx] * 0.299 + cp[idx + 1] * 0.587 + cp[idx + 2] * 0.114;
        const grayR = cp[idx + 4] * 0.299 + cp[idx + 5] * 0.587 + cp[idx + 6] * 0.114;
        const grayD = cp[((y + 1) * cWidth + x) * 4] * 0.299 + cp[((y + 1) * cWidth + x) * 4 + 1] * 0.587 + cp[((y + 1) * cWidth + x) * 4 + 2] * 0.114;
        if (Math.abs(gray - grayR) > 20 || Math.abs(gray - grayD) > 20) edgeCount++;
      }
    }
    const edgeDensity = edgeCount / ((ch / 3) * (cw / 3));
    const idDetected = edgeDensity > 0.04;  // lowered
    const tooClose = edgeDensity > 0.55;  // raised
    const tooFar = idDetected && edgeDensity < 0.05;

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

    if (tooDark) { status = 'no_id'; message = '💡 Too dark — improve lighting'; }
    else if (!idDetected) { status = 'no_id'; message = '🔴 No ID detected — place your ID in the frame'; }
    else if (tooClose) { status = 'too_close'; message = '🔼 Too close — move the ID further back'; }
    else if (tooFar) { status = 'too_far'; message = '🔽 Too far — move the ID closer'; }
    else if (isBlurry) { status = 'blurry'; message = '🟡 Hold steady — image is blurry'; }
    else { status = 'good'; message = '✅ Looks good!'; ready = true; }

    this.frameStatus = status;
    this.frameMessage = message;

    if (ready && !this.countdownActive) this.startCountdown();
    else if (!ready && this.countdownActive) this.cancelCountdown();
    this.cdr.markForCheck();
  }

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
          this.cameraState = 'captured';
          this.stopCamera();
          this.cdr.markForCheck();
        });
    } else {
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

  captureID(): void {
    this.cancelCountdown();
    this.autoCaptureID();
  }

  retakePhoto(): void {
    this.capturedImageUrl = '';
    this.visitorData = null;
    this.cameraState = 'initializing';
    this.frameStatus = 'no_id';
    this.frameMessage = 'Place your ID in the frame';
    this.countdownValue = 0;
    this.scanInputMode = 'camera';
    this.currentStep = 'scan';
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
    this.qrLoaded = false;
    this.qrError = false;
    this.loading = false;
    this.currentStep = 'ticket';
    this.cdr.markForCheck();
  }

  retryCamera(): void {
    this.cameraState = 'initializing';
    this.cdr.markForCheck();
    setTimeout(() => this.startCamera(), 300);
  }

  printPass(): void {
    const v = this.visitorData;
    const qrUrl = this.qrCodeImage || this.generateQrDataUrl(v.control_no);
    const html = `<!DOCTYPE html>
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
    this.visitorData = null;
    this.capturedImageUrl = '';
    this.selectedPurpose = '';
    this.selectedIdType = '';
    this.cameraState = 'initializing';
    this.frameStatus = 'no_id';
    this.frameMessage = 'Place your ID in the frame';
    this.countdownValue = 0;
    this.loading = false;
    this.scanInputMode = 'camera';
    this.editingField = '';
    this.manualEntry = { full_name: '', birthday: '', address: '', id_number: '' };
    this.manualError = '';
    this.qrLoaded = false;
    this.qrError = false;
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

  // ── Template helpers ──────────────────────────────────────────────────────
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

  onQrLoaded(): void { this.qrLoaded = true; this.qrError = false; this.cdr.markForCheck(); }
  onQrError(): void { this.qrError = true; this.qrLoaded = false; this.cdr.markForCheck(); }

  generateQrDataUrl(text: string): string {
    try {
      const qr = new QRCodeGenerator(0, 'M');
      qr.addData(text);
      qr.make();
      return qr.toDataURL(4, 4);
    } catch (e) {
      console.error('QR gen failed:', e);
      return '';
    }
  }
}

// ── Embedded QR Code Generator ────────────────────────────────────────────────
// Ported from qrcode-generator by Kazuhiko Arase (MIT License)
// https://github.com/kazuhikoarase/qrcode-generator
class QRCodeGenerator {
  private static readonly PAD0 = 0xEC;
  private static readonly PAD1 = 0x11;

  private typeNumber: number;
  private errorCorrectLevel: string;
  private modules: (boolean | null)[][] = [];
  private moduleCount = 0;
  private dataCache: number[] | null = null;
  private dataList: QRData[] = [];

  constructor(typeNumber: number, errorCorrectLevel: string) {
    this.typeNumber = typeNumber;
    this.errorCorrectLevel = errorCorrectLevel;
  }

  addData(data: string): void {
    this.dataList.push(new QR8BitByte(data));
    this.dataCache = null;
  }

  make(): void {
    if (this.typeNumber < 1) {
      this.typeNumber = 1;
      while (this.typeNumber < 40) {
        const rsBlocks = QRRSBlock.getRSBlocks(this.typeNumber, this.errorCorrectLevel);
        const buffer = new QRBitBuffer();
        let totalDataCount = 0;
        for (const b of rsBlocks) totalDataCount += b.dataCount;
        for (const d of this.dataList) {
          buffer.put(d.getMode(), 4);
          buffer.put(d.getLength(), QRUtil.getLengthInBits(d.getMode(), this.typeNumber));
          d.write(buffer);
        }
        if (buffer.getLengthInBits() <= totalDataCount * 8) break;
        this.typeNumber++;
      }
    }
    this.makeImpl(false, this.getBestMaskPattern());
  }

  private makeImpl(test: boolean, maskPattern: number): void {
    this.moduleCount = this.typeNumber * 4 + 17;
    this.modules = Array.from({ length: this.moduleCount }, () =>
      new Array(this.moduleCount).fill(null)
    );
    this.setupPositionProbePattern(0, 0);
    this.setupPositionProbePattern(this.moduleCount - 7, 0);
    this.setupPositionProbePattern(0, this.moduleCount - 7);
    this.setupPositionAdjustPattern();
    this.setupTimingPattern();
    this.setupTypeInfo(test, maskPattern);
    if (this.typeNumber >= 7) this.setupTypeNumber(test);
    if (!this.dataCache) this.dataCache = QRCodeGenerator.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
    this.mapData(this.dataCache, maskPattern);
  }

  private setupPositionProbePattern(row: number, col: number): void {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const pr = row + r, pc = col + c;
        if (pr < 0 || this.moduleCount <= pr || pc < 0 || this.moduleCount <= pc) continue;
        this.modules[pr][pc] =
          (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
          (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
          (2 <= r && r <= 4 && 2 <= c && c <= 4);
      }
    }
  }

  private setupTimingPattern(): void {
    for (let i = 8; i < this.moduleCount - 8; i++) {
      if (this.modules[6][i] !== null) continue;
      this.modules[6][i] = i % 2 === 0;
      this.modules[i][6] = i % 2 === 0;
    }
  }

  private setupPositionAdjustPattern(): void {
    const pos = QRUtil.getPatternPosition(this.typeNumber);
    for (const row of pos) {
      for (const col of pos) {
        if (this.modules[row][col] !== null) continue;
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            this.modules[row + r][col + c] =
              r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0);
          }
        }
      }
    }
  }

  private setupTypeNumber(test: boolean): void {
    const bits = QRUtil.getBCHTypeNumber(this.typeNumber);
    for (let i = 0; i < 18; i++) {
      const mod = !test && ((bits >> i) & 1) === 1;
      this.modules[Math.floor(i / 3)][i % 3 + this.moduleCount - 8 - 3] = mod;
      this.modules[i % 3 + this.moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
    }
  }

  private setupTypeInfo(test: boolean, maskPattern: number): void {
    const ecl = { 'L': 1, 'M': 0, 'Q': 3, 'H': 2 }[this.errorCorrectLevel] ?? 0;
    const data = (ecl << 3) | maskPattern;
    const bits = QRUtil.getBCHTypeInfo(data);
    for (let i = 0; i < 15; i++) {
      const mod = !test && ((bits >> i) & 1) === 1;
      if (i < 6) this.modules[i][8] = mod;
      else if (i < 8) this.modules[i + 1][8] = mod;
      else this.modules[this.moduleCount - 15 + i][8] = mod;
      if (i < 8) this.modules[8][this.moduleCount - i - 1] = mod;
      else if (i < 9) this.modules[8][15 - i - 1 + 1] = mod;
      else this.modules[8][15 - i - 1] = mod;
    }
    this.modules[this.moduleCount - 8][8] = !test;
  }

  private mapData(data: number[], maskPattern: number): void {
    let inc = -1, row = this.moduleCount - 1, bitIndex = 7, byteIndex = 0;
    const maskFunc = QRUtil.getMaskFunction(maskPattern);
    for (let col = this.moduleCount - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      while (true) {
        for (let c = 0; c < 2; c++) {
          const mc = col - c;
          if (this.modules[row][mc] === null) {
            let dark = false;
            if (byteIndex < data.length) dark = ((data[byteIndex] >>> bitIndex) & 1) === 1;
            if (maskFunc(row, mc)) dark = !dark;
            this.modules[row][mc] = dark;
            bitIndex--;
            if (bitIndex === -1) { byteIndex++; bitIndex = 7; }
          }
        }
        row += inc;
        if (row < 0 || this.moduleCount <= row) { row -= inc; inc = -inc; break; }
      }
    }
  }

  private getBestMaskPattern(): number {
    let minLostPoint = 0, pattern = 0;
    for (let i = 0; i < 8; i++) {
      this.makeImpl(true, i);
      const lost = QRUtil.getLostPoint(this);
      if (i === 0 || minLostPoint > lost) { minLostPoint = lost; pattern = i; }
    }
    return pattern;
  }

  isDark(row: number, col: number): boolean { return this.modules[row][col] === true; }
  getModuleCount(): number { return this.moduleCount; }

  toDataURL(cellSize = 4, margin = 4): string {
    const size = this.moduleCount * cellSize + margin * 2;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000000';
    for (let r = 0; r < this.moduleCount; r++) {
      for (let c = 0; c < this.moduleCount; c++) {
        if (this.isDark(r, c)) {
          ctx.fillRect(margin + c * cellSize, margin + r * cellSize, cellSize, cellSize);
        }
      }
    }
    return canvas.toDataURL('image/png');
  }

  private static createData(typeNumber: number, ecl: string, dataList: QRData[]): number[] {
    const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, ecl);
    const buffer = new QRBitBuffer();
    for (const d of dataList) {
      buffer.put(d.getMode(), 4);
      buffer.put(d.getLength(), QRUtil.getLengthInBits(d.getMode(), typeNumber));
      d.write(buffer);
    }
    let totalDataCount = 0;
    for (const b of rsBlocks) totalDataCount += b.dataCount;
    if (buffer.getLengthInBits() > totalDataCount * 8) throw new Error('Too long');
    if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) buffer.put(0, 4);
    while (buffer.getLengthInBits() % 8 !== 0) buffer.putBit(false);
    while (true) {
      if (buffer.getLengthInBits() >= totalDataCount * 8) break;
      buffer.put(QRCodeGenerator.PAD0, 8);
      if (buffer.getLengthInBits() >= totalDataCount * 8) break;
      buffer.put(QRCodeGenerator.PAD1, 8);
    }
    return QRCodeGenerator.createBytes(buffer, rsBlocks);
  }

  private static createBytes(buffer: QRBitBuffer, rsBlocks: QRRSBlock[]): number[] {
    let offset = 0, maxDcCount = 0, maxEcCount = 0;
    const dcdata: number[][] = [], ecdata: number[][] = [];
    for (let r = 0; r < rsBlocks.length; r++) {
      const dcCount = rsBlocks[r].dataCount, ecCount = rsBlocks[r].totalCount - dcCount;
      maxDcCount = Math.max(maxDcCount, dcCount);
      maxEcCount = Math.max(maxEcCount, ecCount);
      dcdata[r] = Array.from({ length: dcCount }, (_, i) => 0xff & buffer.buffer[i + offset]);
      offset += dcCount;
      const rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
      const rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
      const modPoly = rawPoly.mod(rsPoly);
      ecdata[r] = Array.from({ length: rsPoly.getLength() - 1 }, (_, i) => {
        const mi = i + modPoly.getLength() - (rsPoly.getLength() - 1);
        return mi >= 0 ? modPoly.get(mi) : 0;
      });
    }
    const data: number[] = [];
    for (let i = 0; i < maxDcCount; i++) for (const dc of dcdata) if (i < dc.length) data.push(dc[i]);
    for (let i = 0; i < maxEcCount; i++) for (const ec of ecdata) if (i < ec.length) data.push(ec[i]);
    return data;
  }
}

interface QRData { getMode(): number; getLength(): number; write(buf: QRBitBuffer): void; }

class QR8BitByte implements QRData {
  private data: string;
  constructor(data: string) { this.data = data; }
  getMode(): number { return 4; }
  getLength(): number { return this.data.length; }
  write(buf: QRBitBuffer): void {
    for (let i = 0; i < this.data.length; i++) buf.put(this.data.charCodeAt(i), 8);
  }
}

class QRBitBuffer {
  buffer: number[] = [];
  private length = 0;
  get(index: number): boolean { return ((this.buffer[Math.floor(index / 8)] >>> (7 - index % 8)) & 1) === 1; }
  put(num: number, length: number): void { for (let i = 0; i < length; i++) this.putBit(((num >>> (length - i - 1)) & 1) === 1); }
  getLengthInBits(): number { return this.length; }
  putBit(bit: boolean): void {
    if (this.length === this.buffer.length * 8) this.buffer.push(0);
    if (bit) this.buffer[Math.floor(this.length / 8)] |= 0x80 >>> (this.length % 8);
    this.length++;
  }
}

class QRPolynomial {
  private num: number[];
  constructor(num: number[], shift: number) {
    let offset = 0;
    while (offset < num.length && num[offset] === 0) offset++;
    this.num = new Array(num.length - offset + shift);
    for (let i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
  }
  get(index: number): number { return this.num[index]; }
  getLength(): number { return this.num.length; }
  mod(e: QRPolynomial): QRPolynomial {
    if (this.getLength() - e.getLength() < 0) return this;
    const ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
    const num = this.num.slice();
    for (let i = 0; i < e.getLength(); i++) num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
    return new QRPolynomial(num, 0).mod(e);
  }
}

class QRMath {
  static readonly EXP_TABLE: number[] = (() => {
    const t = new Array(256);
    for (let i = 0; i < 8; i++) t[i] = 1 << i;
    for (let i = 8; i < 256; i++) t[i] = t[i - 4] ^ t[i - 5] ^ t[i - 6] ^ t[i - 8];
    return t;
  })();
  static readonly LOG_TABLE: number[] = (() => {
    const t = new Array(256).fill(0);
    const exp = QRMath.EXP_TABLE;
    for (let i = 0; i < 255; i++) t[exp[i]] = i;
    return t;
  })();
  static gexp(n: number): number {
    while (n < 0) n += 255;
    while (n >= 256) n -= 255;
    return QRMath.EXP_TABLE[n];
  }
  static glog(n: number): number {
    if (n < 1) throw new Error('glog(' + n + ')');
    return QRMath.LOG_TABLE[n];
  }
}

class QRRSBlock {
  totalCount: number; dataCount: number;
  constructor(totalCount: number, dataCount: number) { this.totalCount = totalCount; this.dataCount = dataCount; }
  static getRSBlocks(typeNumber: number, ecl: string): QRRSBlock[] {
    const t = QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + ['M', 'L', 'H', 'Q'].indexOf(ecl)];
    if (!t) throw new Error('Bad type/ecl');
    const list: QRRSBlock[] = [];
    for (let i = 0; i < t.length; i += 3)
      for (let j = 0; j < t[i]; j++) list.push(new QRRSBlock(t[i + 1], t[i + 2]));
    return list;
  }
  private static RS_BLOCK_TABLE: number[][] = [
    [1, 26, 16], [1, 26, 19], [1, 26, 9], [1, 26, 13],
    [1, 44, 28], [1, 44, 34], [1, 44, 16], [1, 44, 22],
    [1, 70, 44], [1, 70, 55], [2, 35, 13], [2, 35, 17],
    [1, 100, 64], [2, 50, 40], [4, 25, 9], [2, 50, 24],
    [1, 134, 86], [2, 67, 53], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12]
  ];
}

class QRUtil {
  static getLengthInBits(mode: number, type: number): number {
    if (mode === 1) return type < 10 ? 10 : type < 27 ? 12 : 14;
    if (mode === 2) return type < 10 ? 9 : type < 27 ? 11 : 13;
    if (mode === 4) return type < 10 ? 8 : type < 27 ? 16 : 16;
    return 8;
  }
  static getErrorCorrectPolynomial(ecl: number): QRPolynomial {
    let a = new QRPolynomial([1], 0);
    for (let i = 0; i < ecl; i++) {
      const b = new QRPolynomial([1, QRMath.gexp(i)], 0);
      const num = new Array(a.getLength() + b.getLength() - 1).fill(0);
      for (let j = 0; j < a.getLength(); j++) {
        if (a.get(j) === 0) continue;
        for (let k = 0; k < b.getLength(); k++) {
          if (b.get(k) === 0) continue;
          num[j + k] ^= QRMath.gexp(QRMath.glog(a.get(j)) + QRMath.glog(b.get(k)));
        }
      }
      a = new QRPolynomial(num, 0);
    }
    return a;
  }
  static getMaskFunction(pattern: number): (i: number, j: number) => boolean {
    const fns: ((i: number, j: number) => boolean)[] = [
      (i, j) => (i + j) % 2 === 0, (i, _) => i % 2 === 0, (_, j) => j % 3 === 0, (i, j) => (i + j) % 3 === 0,
      (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0, (i, j) => (i * j) % 2 + (i * j) % 3 === 0,
      (i, j) => ((i * j) % 2 + (i * j) % 3) % 2 === 0, (i, j) => ((i + j) % 2 + (i * j) % 3) % 2 === 0
    ];
    return fns[pattern];
  }
  static getLostPoint(qr: QRCodeGenerator): number {
    const mc = qr.getModuleCount(); let lostPoint = 0;
    for (let r = 0; r < mc; r++) {
      for (let c = 0; c < mc; c++) {
        let sameCount = 0; const dark = qr.isDark(r, c);
        for (let rr = -1; rr <= 1; rr++) for (let cc = -1; cc <= 1; cc++) {
          if (r + rr < 0 || mc <= r + rr || c + cc < 0 || mc <= c + cc) continue;
          if (qr.isDark(r + rr, c + cc) === dark) sameCount++;
        }
        if (sameCount > 5) lostPoint += 3 + sameCount - 5;
      }
    }
    return lostPoint;
  }
  static getBCHTypeInfo(data: number): number {
    let d = data << 10;
    while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(0x537) >= 0)
      d ^= 0x537 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(0x537));
    return ((data << 10) | d) ^ 0x5412;
  }
  static getBCHTypeNumber(data: number): number {
    let d = data << 12;
    while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(0x1F25) >= 0)
      d ^= 0x1F25 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(0x1F25));
    return (data << 12) | d;
  }
  static getBCHDigit(data: number): number { let d = 0; while (data !== 0) { d++; data >>>= 1; } return d; }
  static getPatternPosition(type: number): number[] {
    return [[], [6, 18], [6, 22], [6, 26], [6, 30]][type] ?? [];
  }
}