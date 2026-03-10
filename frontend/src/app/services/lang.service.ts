import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Lang = 'en' | 'fil';

export interface AppLabels {
  // Landing
  tagline:         string;
  welcomeTo:       string;
  subtitle:        string;
  prompt:          string;
  visitorsToday:   string;
  currentlyInside: string;
  checkinTitle:    string;
  checkinDesc:     string;
  checkinBtn:      string;
  checkoutTitle:   string;
  checkoutDesc:    string;
  checkoutBtn:     string;
  step1ci:         string;
  step2ci:         string;
  step3ci:         string;
  step1co:         string;
  step2co:         string;
  step3co:         string;
  navCheckin:      string;
  navCheckout:     string;
  footerSub:       string;
  langToggleLabel: string;

  // Checkin — step bar
  stepSelectId:    string;
  stepScanId:      string;
  stepVerify:      string;
  stepPurpose:     string;
  stepGetPass:     string;

  // Checkin — home step
  howItWorks:      string;
  instr1Title:     string;
  instr1Desc:      string;
  instr2Title:     string;
  instr2Desc:      string;
  instr3Title:     string;
  instr3Desc:      string;
  instr4Title:     string;
  instr4Desc:      string;
  selectIdTitle:   string;

  // Checkin — scan step
  cameraScan:      string;
  typeManually:    string;
  capturingIn:     string;
  analyzing:       string;
  startingCamera:  string;
  cameraUnavail:   string;
  cameraAnotherApp:string;
  retryCamera:     string;
  cameraDenied:    string;
  cameraDeniedHint:string;
  alignId:         string;
  photoTaken:      string;
  captureManually: string;
  idVisibleQ:      string;
  retake:          string;
  looksGood:       string;
  readingId:       string;
  processing:      string;
  backToIdSelection:string;

  // Camera frame messages
  frameDefault:    string;
  frameNoId:       string;
  frameTooFar:     string;
  frameTooClose:   string;
  frameBlurry:     string;
  frameGood:       string;
  scanningLabel:   string;
  scanSubHint:     string;

  // Checkin — manual form
  manualDesc:      string;
  manualRequired:  string;
  fullName:        string;
  fullNamePH:      string;
  birthday:        string;
  address:         string;
  addressPH:       string;
  idNumber:        string;
  idNumberPH:      string;
  continueDetails: string;

  // Checkin — preview step
  verifyTitle:     string;
  verifyHint:      string;
  tapToEdit:       string;
  labelFullName:   string;
  labelBirthday:   string;
  labelAddress:    string;
  labelIdNumber:   string;
  labelIdType:     string;
  labelControl:    string;
  editNotice:      string;
  rescanId:        string;
  confirmContinue: string;

  // Checkin — purpose step
  purposeHello:    string;
  purposeQuestion: string;
  cancelStartOver: string;

  // Checkin — ticket step
  visitorPass:     string;
  labelName:       string;
  labelPurpose:    string;
  labelTimeIn:     string;
  scanAtExit:      string;
  printReceipt:    string;
  done:            string;

  // Checkout
  coTitle:         string;
  coDesc:          string;
  coScanTab:       string;
  coManualTab:     string;
  coScannerLabel:  string;
  coScannerHint:   string;
  coProcessing:    string;
  coNoScanner:     string;
  coTypeInstead:   string;
  coControlLabel:  string;
  coControlPH:     string;
  coConfirm:       string;
  coHaveScanner:   string;
  coSwitchScan:    string;
  coBackHome:      string;
  coSuccessTitle:  string;
  coSuccessSub:    string;
  coLabelName:     string;
  coLabelControl:  string;
  coLabelPurpose:  string;
  coLabelTimeIn:   string;
  coLabelTimeOut:  string;
  coCheckoutAnother:string;
  coGoHome:        string;
  coHome:          string;
}

export const LABELS: Record<Lang, AppLabels> = {
  en: {
    // Landing
    tagline:          'TRANSFORMATIVE · LIVELY · CARING',
    welcomeTo:        'WELCOME TO THE',
    subtitle:         'Transformative, Lively, and Caring City',
    prompt:           'Please select your transaction below to get started.',
    visitorsToday:    'Visitors Today',
    currentlyInside:  'Currently Inside',
    checkinTitle:     'CHECK-IN',
    checkinDesc:      'Register your visit by scanning your government-issued ID. Receive a visitor pass with QR code for exit.',
    checkinBtn:       'START CHECK-IN →',
    checkoutTitle:    'CHECK-OUT',
    checkoutDesc:     'Enter your control number from your visitor pass to log your exit from the building.',
    checkoutBtn:      'START CHECK-OUT →',
    step1ci:          '① Select ID',
    step2ci:          '② Scan ID',
    step3ci:          '③ Get Pass',
    step1co:          '① Get Pass',
    step2co:          '② Enter #',
    step3co:          '③ Exit',
    navCheckin:       '🏛️ Check-In',
    navCheckout:      '🚪 Check-Out',
    footerSub:        'For assistance, please approach the nearest security personnel.',
    langToggleLabel:  'Filipino',

    // Checkin — step bar
    stepSelectId:     'Select ID',
    stepScanId:       'Scan ID',
    stepVerify:       'Verify',
    stepPurpose:      'Purpose',
    stepGetPass:      'Get Pass',

    // Checkin — home
    howItWorks:       '📋 How It Works',
    instr1Title:      'Select your ID type',
    instr1Desc:       'Choose the government ID you brought today',
    instr2Title:      'Scan your ID',
    instr2Desc:       'Hold your ID steady in front of the camera',
    instr3Title:      'Verify details',
    instr3Desc:       'Confirm your information is correct',
    instr4Title:      'Get your pass',
    instr4Desc:       'Print your visitor pass and proceed',
    selectIdTitle:    'Select your ID type to begin',

    // Checkin — scan
    cameraScan:       '📷 Camera Scan',
    typeManually:     '⌨️ Type Manually',
    capturingIn:      'Capturing in',
    analyzing:        'Analyzing...',
    startingCamera:   'Starting camera...',
    cameraUnavail:    'Camera is currently unavailable.',
    cameraAnotherApp: 'Another app may be using the camera.',
    retryCamera:      '🔄 Retry Camera',
    cameraDenied:     'Camera permission was denied.',
    cameraDeniedHint: 'Click the 🔒 icon in the address bar, set Camera to Allow, then reload.',
    alignId:          'Align your ID within the box',
    photoTaken:       '✅ Photo Taken',
    captureManually:  '📷 Capture Manually',
    idVisibleQ:       'Is your ID clearly visible in the photo?',
    retake:           '↩ Retake',
    looksGood:        '✅ Looks Good — Submit',
    readingId:        '⏳ Reading ID...',
    processing:       '⏳ Processing...',
    backToIdSelection:'← Back to ID Selection',

    // Camera frame messages
    frameDefault:    'Place your ID in the frame',
    frameNoId:       '🔴 No ID detected — place your ID in the frame',
    frameTooFar:     '🟡 Move closer — ID is too far',
    frameTooClose:   '🟡 Move back — ID is too close',
    frameBlurry:     '🟡 Hold steady — image is blurry',
    frameGood:       '🟢 ID detected — hold still',
    scanningLabel:   'Scanning:',
    scanSubHint:     'Hold your ID flat and steady inside the guide box. The camera will capture automatically when ready.',

    // Manual form
    manualDesc:       'Enter the details from your ID manually.',
    manualRequired:   'All fields marked * are required.',
    fullName:         'Full Name',
    fullNamePH:       'e.g. Juan dela Cruz',
    birthday:         'Birthday',
    address:          'Address',
    addressPH:        'e.g. Brgy. Ususan, Taguig City',
    idNumber:         'ID Number',
    idNumberPH:       'ID number from your card',
    continueDetails:  '➡️ Continue with these details',

    // Preview
    verifyTitle:      'Please Verify Your Information',
    verifyHint:       'Check all details carefully.',
    tapToEdit:        'Tap any field to edit',
    labelFullName:    'Full Name',
    labelBirthday:    'Birthday',
    labelAddress:     'Address',
    labelIdNumber:    'ID Number',
    labelIdType:      'ID Type',
    labelControl:     'Control #',
    editNotice:       '✏️ Tap any field above to correct it before continuing.',
    rescanId:         '↩ Rescan ID',
    confirmContinue:  '✅ Confirm & Continue',

    // Purpose
    purposeHello:     'Hello',
    purposeQuestion:  'What is the purpose of your visit today?',
    cancelStartOver:  'Cancel and Start Over',

    // Ticket
    visitorPass:      'VISITOR PASS',
    labelName:        'NAME',
    labelPurpose:     'PURPOSE',
    labelTimeIn:      'TIME IN',
    scanAtExit:       'Scan at Exit Gate',
    printReceipt:     '🖨️ PRINT RECEIPT',
    done:             '✅ DONE',

    // Checkout
    coTitle:          'CHECK-OUT',
    coDesc:           'Scan your visitor pass QR code or enter your control number manually.',
    coScanTab:        '📷 Scan QR / Barcode',
    coManualTab:      '⌨️ Type Manually',
    coScannerLabel:   'Point the barcode scanner at the QR code',
    coScannerHint:    'The scanner will auto-submit once the code is read',
    coProcessing:     'Processing check-out...',
    coNoScanner:      'No scanner?',
    coTypeInstead:    'Type manually instead →',
    coControlLabel:   'Control Number',
    coControlPH:      'e.g. TGK-20260305-AB12C',
    coConfirm:        '✅ Confirm Check-Out',
    coHaveScanner:    'Have a scanner?',
    coSwitchScan:     'Switch to scan mode →',
    coBackHome:       '← Back to Home',
    coSuccessTitle:   'Check-Out Successful!',
    coSuccessSub:     'Thank you for visiting Taguig City Hall.',
    coLabelName:      'Name',
    coLabelControl:   'Control #',
    coLabelPurpose:   'Purpose',
    coLabelTimeIn:    'Time In',
    coLabelTimeOut:   'Time Out',
    coCheckoutAnother:'Check Out Another Visitor',
    coGoHome:         '🏠 Back to Home',
    coHome:           '🏠 Home',
  },

  fil: {
    // Landing
    tagline:          'MAPANBAGO · MASIGLA · MAPAGMALASAKIT',
    welcomeTo:        'MALIGAYANG PAGDATING SA',
    subtitle:         'Mapanbago, Masigla, at Mapagmalasakit na Lungsod',
    prompt:           'Pumili ng transaksyon sa ibaba upang makapagsimula.',
    visitorsToday:    'Bisita Ngayon',
    currentlyInside:  'Kasalukuyang Nasa Loob',
    checkinTitle:     'PAG-CHECK IN',
    checkinDesc:      'Irehistro ang inyong pagbisita gamit ang inyong government ID. Makatanggap ng visitor pass na may QR code para sa labasan.',
    checkinBtn:       'MAGSIMULA NG CHECK-IN →',
    checkoutTitle:    'PAG-CHECK OUT',
    checkoutDesc:     'Ilagay ang inyong control number mula sa visitor pass upang mairehistro ang inyong pag-alis.',
    checkoutBtn:      'MAGSIMULA NG CHECK-OUT →',
    step1ci:          '① Piliin ang ID',
    step2ci:          '② I-scan ang ID',
    step3ci:          '③ Kumuha ng Pass',
    step1co:          '① Kunin ang Pass',
    step2co:          '② Ilagay ang #',
    step3co:          '③ Umalis',
    navCheckin:       '🏛️ Mag-Check In',
    navCheckout:      '🚪 Mag-Check Out',
    footerSub:        'Para sa tulong, makipag-ugnayan sa pinakamalapit na security personnel.',
    langToggleLabel:  'English',

    // Checkin — step bar
    stepSelectId:     'Piliin ang ID',
    stepScanId:       'I-scan ang ID',
    stepVerify:       'I-verify',
    stepPurpose:      'Layunin',
    stepGetPass:      'Kumuha ng Pass',

    // Checkin — home
    howItWorks:       '📋 Paano Ito Gumagana',
    instr1Title:      'Piliin ang uri ng ID',
    instr1Desc:       'Piliin ang government ID na dala ninyo ngayon',
    instr2Title:      'I-scan ang inyong ID',
    instr2Desc:       'Hawakan ang ID nang maayos sa harap ng camera',
    instr3Title:      'Suriin ang mga detalye',
    instr3Desc:       'Tiyakin na tama ang inyong impormasyon',
    instr4Title:      'Kumuha ng pass',
    instr4Desc:       'I-print ang inyong visitor pass at magpatuloy',
    selectIdTitle:    'Piliin ang uri ng ID upang magsimula',

    // Checkin — scan
    cameraScan:       '📷 Camera Scan',
    typeManually:     '⌨️ Mag-type ng Mano-mano',
    capturingIn:      'Kukuha sa loob ng',
    analyzing:        'Sinusuri...',
    startingCamera:   'Sinisimulang ang camera...',
    cameraUnavail:    'Hindi available ang camera sa ngayon.',
    cameraAnotherApp: 'Maaaring ginagamit ng ibang app ang camera.',
    retryCamera:      '🔄 Subukan Muli ang Camera',
    cameraDenied:     'Tinanggihan ang pahintulot sa camera.',
    cameraDeniedHint: 'I-click ang icon na 🔒 sa address bar, itakda ang Camera sa Allow, pagkatapos ay i-reload.',
    alignId:          'Ilagay ang inyong ID sa loob ng kahon',
    photoTaken:       '✅ Nakuha ang Litrato',
    captureManually:  '📷 Kumuha ng Litrato',
    idVisibleQ:       'Malinaw ba ang inyong ID sa litrato?',
    retake:           '↩ Kumuha Muli',
    looksGood:        '✅ Maganda — Isumite',
    readingId:        '⏳ Binabasa ang ID...',
    processing:       '⏳ Pinoproseso...',
    backToIdSelection:'← Bumalik sa Pagpili ng ID',

    // Camera frame messages
    frameDefault:    'Ilagay ang inyong ID sa frame',
    frameNoId:       '🔴 Walang ID na nakita — ilagay ang inyong ID sa frame',
    frameTooFar:     '🟡 Lumapit pa — masyadong malayo ang ID',
    frameTooClose:   '🟡 Lumayo nang kaunti — masyadong malapit ang ID',
    frameBlurry:     '🟡 Huwag kumibo — malabo ang larawan',
    frameGood:       '🟢 Nakita ang ID — huwag gumalaw',
    scanningLabel:   'Sinasabuhay:',
    scanSubHint:     'Hawakan ang inyong ID nang patag at maayos sa loob ng guide box. Awtomatikong kukuha ang camera kapag handa na.',

    // Manual form
    manualDesc:       'Ilagay ang mga detalye mula sa inyong ID nang mano-mano.',
    manualRequired:   'Lahat ng field na may * ay kinakailangan.',
    fullName:         'Buong Pangalan',
    fullNamePH:       'hal. Juan dela Cruz',
    birthday:         'Kaarawan',
    address:          'Tirahan',
    addressPH:        'hal. Brgy. Ususan, Lungsod ng Taguig',
    idNumber:         'Numero ng ID',
    idNumberPH:       'Numero ng ID mula sa inyong kard',
    continueDetails:  '➡️ Magpatuloy sa mga detalyeng ito',

    // Preview
    verifyTitle:      'Mangyaring Suriin ang Inyong Impormasyon',
    verifyHint:       'Suriin ang lahat ng detalye nang maingat.',
    tapToEdit:        'I-tap ang kahit anong field upang i-edit',
    labelFullName:    'Buong Pangalan',
    labelBirthday:    'Kaarawan',
    labelAddress:     'Tirahan',
    labelIdNumber:    'Numero ng ID',
    labelIdType:      'Uri ng ID',
    labelControl:     'Kontrol #',
    editNotice:       '✏️ I-tap ang kahit anong field sa itaas upang itama bago magpatuloy.',
    rescanId:         '↩ I-scan Muli ang ID',
    confirmContinue:  '✅ Kumpirmahin at Magpatuloy',

    // Purpose
    purposeHello:     'Kumusta',
    purposeQuestion:  'Ano ang layunin ng inyong pagbisita ngayon?',
    cancelStartOver:  'Kanselahin at Magsimula Muli',

    // Ticket
    visitorPass:      'VISITOR PASS',
    labelName:        'PANGALAN',
    labelPurpose:     'LAYUNIN',
    labelTimeIn:      'ORAS NG PAGPASOK',
    scanAtExit:       'I-scan sa Exit Gate',
    printReceipt:     '🖨️ I-PRINT ANG RESIBO',
    done:             '✅ TAPOS NA',

    // Checkout
    coTitle:          'PAG-CHECK OUT',
    coDesc:           'I-scan ang QR code ng inyong visitor pass o ilagay ang inyong control number nang mano-mano.',
    coScanTab:        '📷 I-scan ang QR / Barcode',
    coManualTab:      '⌨️ Mag-type ng Mano-mano',
    coScannerLabel:   'Ituro ang barcode scanner sa QR code',
    coScannerHint:    'Awtomatikong isasumite kapag nabasa na ang code',
    coProcessing:     'Pinoproseso ang check-out...',
    coNoScanner:      'Walang scanner?',
    coTypeInstead:    'Mag-type ng mano-mano →',
    coControlLabel:   'Control Number',
    coControlPH:      'hal. TGK-20260305-AB12C',
    coConfirm:        '✅ Kumpirmahin ang Check-Out',
    coHaveScanner:    'May scanner?',
    coSwitchScan:     'Lumipat sa scan mode →',
    coBackHome:       '← Bumalik sa Home',
    coSuccessTitle:   'Matagumpay ang Check-Out!',
    coSuccessSub:     'Salamat sa pagbisita sa Taguig City Hall.',
    coLabelName:      'Pangalan',
    coLabelControl:   'Kontrol #',
    coLabelPurpose:   'Layunin',
    coLabelTimeIn:    'Oras ng Pagpasok',
    coLabelTimeOut:   'Oras ng Pag-alis',
    coCheckoutAnother:'Mag-check Out ng Ibang Bisita',
    coGoHome:         '🏠 Bumalik sa Home',
    coHome:           '🏠 Home',
  },
};

@Injectable({ providedIn: 'root' })
export class LangService {
  private langSubject = new BehaviorSubject<Lang>('en');

  lang$   = this.langSubject.asObservable();
  get lang():   Lang       { return this.langSubject.value; }
  get labels(): AppLabels  { return LABELS[this.langSubject.value]; }

  setLang(lang: Lang): void { this.langSubject.next(lang); }
  toggle(): void { this.setLang(this.lang === 'en' ? 'fil' : 'en'); }
}