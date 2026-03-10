import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Lang = 'en' | 'fil';

export interface AppLabels {
  tagline: string; welcomeTo: string; subtitle: string; prompt: string;
  visitorsToday: string; currentlyInside: string;
  checkinTitle: string; checkinDesc: string; checkinBtn: string;
  checkoutTitle: string; checkoutDesc: string; checkoutBtn: string;
  step1ci: string; step2ci: string; step3ci: string;
  step1co: string; step2co: string; step3co: string;
  navCheckin: string; navCheckout: string; footerSub: string; langToggleLabel: string;
  stepSelectId: string; stepScanId: string; stepVerify: string; stepPurpose: string; stepGetPass: string;
  howItWorks: string; instr1Title: string; instr1Desc: string; instr2Title: string; instr2Desc: string;
  instr3Title: string; instr3Desc: string; instr4Title: string; instr4Desc: string; selectIdTitle: string;
  cameraScan: string; typeManually: string; capturingIn: string; analyzing: string;
  startingCamera: string; cameraUnavail: string; cameraAnotherApp: string; retryCamera: string;
  cameraDenied: string; cameraDeniedHint: string; alignId: string; photoTaken: string;
  captureManually: string; idVisibleQ: string; retake: string; looksGood: string;
  readingId: string; processing: string; backToIdSelection: string;
  frameDefault: string; frameNoId: string; frameTooFar: string; frameTooClose: string;
  frameBlurry: string; frameGood: string; scanningLabel: string; scanSubHint: string;
  manualDesc: string; manualRequired: string; fullName: string; fullNamePH: string;
  birthday: string; address: string; addressPH: string; idNumber: string; idNumberPH: string; continueDetails: string;
  verifyTitle: string; verifyHint: string; tapToEdit: string;
  labelFullName: string; labelBirthday: string; labelAddress: string;
  labelIdNumber: string; labelIdType: string; labelControl: string;
  editNotice: string; rescanId: string; confirmContinue: string;
  purposeHello: string; purposeQuestion: string; cancelStartOver: string;
  visitorPass: string; labelName: string; labelPurpose: string; labelTimeIn: string;
  scanAtExit: string; printReceipt: string; done: string;
  coTitle: string; coDesc: string; coScanTab: string; coManualTab: string;
  coScannerLabel: string; coScannerHint: string; coProcessing: string;
  coNoScanner: string; coTypeInstead: string; coControlLabel: string; coControlPH: string;
  coConfirm: string; coHaveScanner: string; coSwitchScan: string; coBackHome: string;
  coSuccessTitle: string; coSuccessSub: string;
  coLabelName: string; coLabelControl: string; coLabelPurpose: string;
  coLabelTimeIn: string; coLabelTimeOut: string;
  coCheckoutAnother: string; coGoHome: string; coHome: string;
  termsHeaderTitle: string; termsHeaderSub: string; termsTitle: string; termsSubtitle: string; termsLawBadge: string;
  termsS1Title: string; termsS1Body: string; termsS1Li1: string; termsS1Li2: string; termsS1Li3: string; termsS1Li4: string; termsS1Li5: string;
  termsS2Title: string; termsS2Body: string; termsS2Li1: string; termsS2Li2: string; termsS2Li3: string;
  termsS3Title: string; termsS3Body: string; termsS3Li1: string; termsS3Li2: string; termsS3Li3: string; termsS3Li4: string;
  termsS4Title: string; termsS4Body: string; termsS4Li1: string; termsS4Li2: string; termsS4Li3: string; termsS4Li4: string; termsS4Li5: string; termsS4Li6: string;
  termsS5Title: string; termsS5Body: string;
  termsS6Title: string; termsS6Body: string;
  termsS7Title: string; termsS7Body: string;
  termsContactDPO: string; termsContactOffice: string; termsContactAddr: string; termsContactEmail: string;
  termsScrollHint: string; termsScrollDone: string; termsDecline: string; termsAccept: string; termsNote: string;
}

export const LABELS: Record<Lang, AppLabels> = {
  en: {
    tagline: 'TRANSFORMATIVE · LIVELY · CARING',
    welcomeTo: 'WELCOME TO THE',
    subtitle: 'Transformative, Lively, and Caring City',
    prompt: 'Please select your transaction below to get started.',
    visitorsToday: 'Visitors Today',
    currentlyInside: 'Currently Inside',
    checkinTitle: 'CHECK-IN',
    checkinDesc: 'Register your visit by scanning your government-issued ID. Receive a visitor pass with QR code for exit.',
    checkinBtn: 'START CHECK-IN →',
    checkoutTitle: 'CHECK-OUT',
    checkoutDesc: 'Enter your control number from your visitor pass to log your exit from the building.',
    checkoutBtn: 'START CHECK-OUT →',
    step1ci: '① Select ID', step2ci: '② Scan ID', step3ci: '③ Get Pass',
    step1co: '① Get Pass', step2co: '② Enter #', step3co: '③ Exit',
    navCheckin: '🏛️ Check-In', navCheckout: '🚪 Check-Out',
    footerSub: 'For assistance, please approach the nearest security personnel.',
    langToggleLabel: 'Filipino',
    stepSelectId: 'Select ID', stepScanId: 'Scan ID', stepVerify: 'Verify', stepPurpose: 'Purpose', stepGetPass: 'Get Pass',
    howItWorks: '📋 How It Works',
    instr1Title: 'Select your ID type', instr1Desc: 'Choose the government ID you brought today',
    instr2Title: 'Scan your ID', instr2Desc: 'Hold your ID steady in front of the camera',
    instr3Title: 'Verify details', instr3Desc: 'Confirm your information is correct',
    instr4Title: 'Get your pass', instr4Desc: 'Print your visitor pass and proceed',
    selectIdTitle: 'Select your ID type to begin',
    cameraScan: '📷 Camera Scan', typeManually: '⌨️ Type Manually',
    capturingIn: 'Capturing in', analyzing: 'Analyzing...',
    startingCamera: 'Starting camera...', cameraUnavail: 'Camera is currently unavailable.',
    cameraAnotherApp: 'Another app may be using the camera.', retryCamera: '🔄 Retry Camera',
    cameraDenied: 'Camera permission was denied.',
    cameraDeniedHint: 'Click the 🔒 icon in the address bar, set Camera to Allow, then reload.',
    alignId: 'Align your ID within the box', photoTaken: '✅ Photo Taken',
    captureManually: '📷 Capture Manually', idVisibleQ: 'Is your ID clearly visible in the photo?',
    retake: '↩ Retake', looksGood: '✅ Looks Good — Submit',
    readingId: '⏳ Reading ID...', processing: '⏳ Processing...',
    backToIdSelection: '← Back to ID Selection',
    frameDefault: 'Place your ID in the frame',
    frameNoId: '🔴 No ID detected — place your ID in the frame',
    frameTooFar: '🟡 Move closer — ID is too far',
    frameTooClose: '🟡 Move back — ID is too close',
    frameBlurry: '🟡 Hold steady — image is blurry',
    frameGood: '🟢 ID detected — hold still',
    scanningLabel: 'Scanning:',
    scanSubHint: 'Hold your ID flat and steady inside the guide box. The camera will capture automatically when ready.',
    manualDesc: 'Enter the details from your ID manually.',
    manualRequired: 'All fields marked * are required.',
    fullName: 'Full Name', fullNamePH: 'e.g. Juan dela Cruz',
    birthday: 'Birthday', address: 'Address', addressPH: 'e.g. Brgy. Ususan, Taguig City',
    idNumber: 'ID Number', idNumberPH: 'ID number from your card',
    continueDetails: '➡️ Continue with these details',
    verifyTitle: 'Please Verify Your Information',
    verifyHint: 'Check all details carefully.', tapToEdit: 'Tap any field to edit',
    labelFullName: 'Full Name', labelBirthday: 'Birthday', labelAddress: 'Address',
    labelIdNumber: 'ID Number', labelIdType: 'ID Type', labelControl: 'Control #',
    editNotice: '✏️ Tap any field above to correct it before continuing.',
    rescanId: '↩ Rescan ID', confirmContinue: '✅ Confirm & Continue',
    purposeHello: 'Hello', purposeQuestion: 'What is the purpose of your visit today?',
    cancelStartOver: 'Cancel and Start Over',
    visitorPass: 'VISITOR PASS', labelName: 'NAME', labelPurpose: 'PURPOSE', labelTimeIn: 'TIME IN',
    scanAtExit: 'Scan at Exit Gate', printReceipt: '🖨️ PRINT RECEIPT', done: '✅ DONE',
    coTitle: 'CHECK-OUT', coDesc: 'Scan your visitor pass QR code or enter your control number manually.',
    coScanTab: '📷 Scan QR / Barcode', coManualTab: '⌨️ Type Manually',
    coScannerLabel: 'Point the barcode scanner at the QR code',
    coScannerHint: 'The scanner will auto-submit once the code is read',
    coProcessing: 'Processing check-out...', coNoScanner: 'No scanner?',
    coTypeInstead: 'Type manually instead →', coControlLabel: 'Control Number',
    coControlPH: 'e.g. TGK-20260305-AB12C', coConfirm: '✅ Confirm Check-Out',
    coHaveScanner: 'Have a scanner?', coSwitchScan: 'Switch to scan mode →',
    coBackHome: '← Back to Home', coSuccessTitle: 'Check-Out Successful!',
    coSuccessSub: 'Thank you for visiting Taguig City Hall.',
    coLabelName: 'Name', coLabelControl: 'Control #', coLabelPurpose: 'Purpose',
    coLabelTimeIn: 'Time In', coLabelTimeOut: 'Time Out',
    coCheckoutAnother: 'Check Out Another Visitor', coGoHome: '🏠 Back to Home', coHome: '🏠 Home',
    termsHeaderTitle: 'LUNGSOD NG TAGUIG', termsHeaderSub: 'VISITOR KIOSK SYSTEM',
    termsTitle: 'Privacy Notice & Terms of Use',
    termsSubtitle: 'Please read carefully before proceeding.',
    termsLawBadge: 'Republic Act No. 10173 — Data Privacy Act of 2012',
    termsS1Title: 'Personal Information We Collect',
    termsS1Body: 'As part of the visitor registration process, the City Government of Taguig collects the following personal data:',
    termsS1Li1: 'Full name as appearing on your government-issued ID',
    termsS1Li2: 'Date of birth', termsS1Li3: 'Home address',
    termsS1Li4: 'ID type and ID number',
    termsS1Li5: 'Time and date of visit, and purpose of visit',
    termsS2Title: 'Purpose of Data Collection',
    termsS2Body: 'Your personal information is collected solely for the following purposes:',
    termsS2Li1: 'Visitor identification and security management within Taguig City Hall premises',
    termsS2Li2: 'Generation of a visitor pass for entry and exit tracking',
    termsS2Li3: 'Compliance with government security and audit requirements',
    termsS3Title: 'Legal Basis for Processing',
    termsS3Body: 'The collection and processing of your personal data is lawfully based on:',
    termsS3Li1: 'Performance of a government function — RA 10173, Sec. 12(c)',
    termsS3Li2: 'Compliance with legal obligations applicable to the City Government',
    termsS3Li3: 'Protection of vital interests of data subjects and the public — RA 10173, Sec. 12(e)',
    termsS3Li4: 'Your voluntary consent provided by proceeding with this registration',
    termsS4Title: 'Your Rights Under RA 10173',
    termsS4Body: 'As a data subject under the Data Privacy Act of 2012, you have the following rights:',
    termsS4Li1: 'Right to be Informed — to know how your data is collected and used',
    termsS4Li2: 'Right to Access — to request a copy of your personal data held by this office',
    termsS4Li3: 'Right to Rectification — to correct inaccurate or incomplete data',
    termsS4Li4: 'Right to Erasure — to request deletion of data no longer necessary',
    termsS4Li5: 'Right to Object — to object to the processing of your personal data',
    termsS4Li6: 'Right to File a Complaint — with the National Privacy Commission (NPC)',
    termsS5Title: 'Data Retention',
    termsS5Body: 'Visitor records are retained for a period of one (1) year from the date of visit, after which they are securely disposed of in accordance with the National Archives Act and the NPC guidelines. Records may be retained longer if required by law or ongoing legal proceedings.',
    termsS6Title: 'Data Security',
    termsS6Body: 'The City Government of Taguig implements appropriate technical and organizational measures to protect your personal data against unauthorized access, disclosure, alteration, or destruction. Access to visitor records is restricted to authorized government personnel only.',
    termsS7Title: 'Contact & Data Protection Officer',
    termsS7Body: 'For questions, concerns, or to exercise your data privacy rights, please contact our Data Protection Officer:',
    termsContactDPO: 'Data Protection Officer',
    termsContactOffice: 'City Government of Taguig — ICT Department',
    termsContactAddr: 'Gen. Luna St., Tuktukan, Taguig, Philippines',
    termsContactEmail: 'itoffice@taguig.gov.ph',
    termsScrollHint: 'Scroll down to read the full notice',
    termsScrollDone: 'You have read the full notice',
    termsDecline: 'Decline & Go Back',
    termsAccept: '✓ I Understand & Agree',
    termsNote: 'By tapping "I Understand & Agree", you consent to the collection and processing of your personal data as described above.',
  },

  fil: {
    tagline: 'MAPANBAGO · MASIGLA · MAPAGMALASAKIT',
    welcomeTo: 'MALIGAYANG PAGDATING SA',
    subtitle: 'Mapanbago, Masigla, at Mapagmalasakit na Lungsod',
    prompt: 'Pumili ng transaksyon sa ibaba upang makapagsimula.',
    visitorsToday: 'Bisita Ngayon',
    currentlyInside: 'Kasalukuyang Nasa Loob',
    checkinTitle: 'PAG-CHECK IN',
    checkinDesc: 'Irehistro ang inyong pagbisita gamit ang inyong government ID. Makatanggap ng visitor pass na may QR code para sa labasan.',
    checkinBtn: 'MAGSIMULA NG CHECK-IN →',
    checkoutTitle: 'PAG-CHECK OUT',
    checkoutDesc: 'Ilagay ang inyong control number mula sa visitor pass upang mairehistro ang inyong pag-alis.',
    checkoutBtn: 'MAGSIMULA NG CHECK-OUT →',
    step1ci: '① Piliin ang ID', step2ci: '② I-scan ang ID', step3ci: '③ Kumuha ng Pass',
    step1co: '① Kunin ang Pass', step2co: '② Ilagay ang #', step3co: '③ Umalis',
    navCheckin: '🏛️ Mag-Check In', navCheckout: '🚪 Mag-Check Out',
    footerSub: 'Para sa tulong, makipag-ugnayan sa pinakamalapit na security personnel.',
    langToggleLabel: 'English',
    stepSelectId: 'Piliin ang ID', stepScanId: 'I-scan ang ID', stepVerify: 'I-verify', stepPurpose: 'Layunin', stepGetPass: 'Kumuha ng Pass',
    howItWorks: '📋 Paano Ito Gumagana',
    instr1Title: 'Piliin ang uri ng ID', instr1Desc: 'Piliin ang government ID na dala ninyo ngayon',
    instr2Title: 'I-scan ang inyong ID', instr2Desc: 'Hawakan ang ID nang maayos sa harap ng camera',
    instr3Title: 'Suriin ang mga detalye', instr3Desc: 'Tiyakin na tama ang inyong impormasyon',
    instr4Title: 'Kumuha ng pass', instr4Desc: 'I-print ang inyong visitor pass at magpatuloy',
    selectIdTitle: 'Piliin ang uri ng ID upang magsimula',
    cameraScan: '📷 Camera Scan', typeManually: '⌨️ Mag-type ng Mano-mano',
    capturingIn: 'Kukuha sa loob ng', analyzing: 'Sinusuri...',
    startingCamera: 'Sinisimulang ang camera...', cameraUnavail: 'Hindi available ang camera sa ngayon.',
    cameraAnotherApp: 'Maaaring ginagamit ng ibang app ang camera.', retryCamera: '🔄 Subukan Muli ang Camera',
    cameraDenied: 'Tinanggihan ang pahintulot sa camera.',
    cameraDeniedHint: 'I-click ang icon na 🔒 sa address bar, itakda ang Camera sa Allow, pagkatapos ay i-reload.',
    alignId: 'Ilagay ang inyong ID sa loob ng kahon', photoTaken: '✅ Nakuha ang Litrato',
    captureManually: '📷 Kumuha ng Litrato', idVisibleQ: 'Malinaw ba ang inyong ID sa litrato?',
    retake: '↩ Kumuha Muli', looksGood: '✅ Maganda — Isumite',
    readingId: '⏳ Binabasa ang ID...', processing: '⏳ Pinoproseso...',
    backToIdSelection: '← Bumalik sa Pagpili ng ID',
    frameDefault: 'Ilagay ang inyong ID sa frame',
    frameNoId: '🔴 Walang ID na nakita — ilagay ang inyong ID sa frame',
    frameTooFar: '🟡 Lumapit pa — masyadong malayo ang ID',
    frameTooClose: '🟡 Lumayo nang kaunti — masyadong malapit ang ID',
    frameBlurry: '🟡 Huwag kumibo — malabo ang larawan',
    frameGood: '🟢 Nakita ang ID — huwag gumalaw',
    scanningLabel: 'Sinasabuhay:',
    scanSubHint: 'Hawakan ang inyong ID nang patag at maayos sa loob ng guide box. Awtomatikong kukuha ang camera kapag handa na.',
    manualDesc: 'Ilagay ang mga detalye mula sa inyong ID nang mano-mano.',
    manualRequired: 'Lahat ng field na may * ay kinakailangan.',
    fullName: 'Buong Pangalan', fullNamePH: 'hal. Juan dela Cruz',
    birthday: 'Kaarawan', address: 'Tirahan', addressPH: 'hal. Brgy. Ususan, Lungsod ng Taguig',
    idNumber: 'Numero ng ID', idNumberPH: 'Numero ng ID mula sa inyong kard',
    continueDetails: '➡️ Magpatuloy sa mga detalyeng ito',
    verifyTitle: 'Mangyaring Suriin ang Inyong Impormasyon',
    verifyHint: 'Suriin ang lahat ng detalye nang maingat.', tapToEdit: 'I-tap ang kahit anong field upang i-edit',
    labelFullName: 'Buong Pangalan', labelBirthday: 'Kaarawan', labelAddress: 'Tirahan',
    labelIdNumber: 'Numero ng ID', labelIdType: 'Uri ng ID', labelControl: 'Kontrol #',
    editNotice: '✏️ I-tap ang kahit anong field sa itaas upang itama bago magpatuloy.',
    rescanId: '↩ I-scan Muli ang ID', confirmContinue: '✅ Kumpirmahin at Magpatuloy',
    purposeHello: 'Kumusta', purposeQuestion: 'Ano ang layunin ng inyong pagbisita ngayon?',
    cancelStartOver: 'Kanselahin at Magsimula Muli',
    visitorPass: 'VISITOR PASS', labelName: 'PANGALAN', labelPurpose: 'LAYUNIN', labelTimeIn: 'ORAS NG PAGPASOK',
    scanAtExit: 'I-scan sa Exit Gate', printReceipt: '🖨️ I-PRINT ANG RESIBO', done: '✅ TAPOS NA',
    coTitle: 'PAG-CHECK OUT', coDesc: 'I-scan ang QR code ng inyong visitor pass o ilagay ang inyong control number nang mano-mano.',
    coScanTab: '📷 I-scan ang QR / Barcode', coManualTab: '⌨️ Mag-type ng Mano-mano',
    coScannerLabel: 'Ituro ang barcode scanner sa QR code',
    coScannerHint: 'Awtomatikong isasumite kapag nabasa na ang code',
    coProcessing: 'Pinoproseso ang check-out...', coNoScanner: 'Walang scanner?',
    coTypeInstead: 'Mag-type ng mano-mano →', coControlLabel: 'Control Number',
    coControlPH: 'hal. TGK-20260305-AB12C', coConfirm: '✅ Kumpirmahin ang Check-Out',
    coHaveScanner: 'May scanner?', coSwitchScan: 'Lumipat sa scan mode →',
    coBackHome: '← Bumalik sa Home', coSuccessTitle: 'Matagumpay ang Check-Out!',
    coSuccessSub: 'Salamat sa pagbisita sa Taguig City Hall.',
    coLabelName: 'Pangalan', coLabelControl: 'Kontrol #', coLabelPurpose: 'Layunin',
    coLabelTimeIn: 'Oras ng Pagpasok', coLabelTimeOut: 'Oras ng Pag-alis',
    coCheckoutAnother: 'Mag-check Out ng Ibang Bisita', coGoHome: '🏠 Bumalik sa Home', coHome: '🏠 Home',
    termsHeaderTitle: 'LUNGSOD NG TAGUIG', termsHeaderSub: 'VISITOR KIOSK SYSTEM',
    termsTitle: 'Abiso sa Privacy at Mga Tuntunin ng Paggamit',
    termsSubtitle: 'Mangyaring basahin nang mabuti bago magpatuloy.',
    termsLawBadge: 'Republic Act Blg. 10173 — Data Privacy Act ng 2012',
    termsS1Title: 'Personal na Impormasyon na Kinokolekta Namin',
    termsS1Body: 'Bilang bahagi ng proseso ng pagpaparehistro ng bisita, kinokolekta ng Lungsod ng Taguig ang sumusunod na personal na datos:',
    termsS1Li1: 'Buong pangalan ayon sa inyong government-issued ID',
    termsS1Li2: 'Petsa ng kapanganakan', termsS1Li3: 'Tirahan',
    termsS1Li4: 'Uri ng ID at numero ng ID',
    termsS1Li5: 'Oras at petsa ng pagbisita, at layunin ng pagbisita',
    termsS2Title: 'Layunin ng Pagkolekta ng Datos',
    termsS2Body: 'Ang inyong personal na impormasyon ay kinokolekta lamang para sa mga sumusunod na layunin:',
    termsS2Li1: 'Pagpapatunay ng pagkakakilanlan ng bisita at pamamahala ng seguridad sa loob ng Taguig City Hall',
    termsS2Li2: 'Paggawa ng visitor pass para sa pagsubaybay ng pagpasok at paglabas',
    termsS2Li3: 'Pagsunod sa mga kinakailangan ng seguridad at pag-audit ng gobyerno',
    termsS3Title: 'Legal na Batayan ng Pagpoproseso',
    termsS3Body: 'Ang pagkolekta at pagpoproseso ng inyong personal na datos ay legal na nakabatay sa:',
    termsS3Li1: 'Pagganap ng tungkulin ng gobyerno — RA 10173, Sek. 12(c)',
    termsS3Li2: 'Pagsunod sa mga legal na obligasyon na naaangkop sa Lungsod ng Taguig',
    termsS3Li3: 'Proteksyon ng mahahalagang interes ng mga data subject at ng publiko — RA 10173, Sek. 12(e)',
    termsS3Li4: 'Ang inyong kusang-loob na pahintulot na ibinibigay sa pamamagitan ng pagpapatuloy sa pagpaparehistro',
    termsS4Title: 'Ang Inyong mga Karapatan sa Ilalim ng RA 10173',
    termsS4Body: 'Bilang isang data subject sa ilalim ng Data Privacy Act ng 2012, mayroon kayong mga sumusunod na karapatan:',
    termsS4Li1: 'Karapatang Maabisuhan — malaman kung paano kinokolekta at ginagamit ang inyong datos',
    termsS4Li2: 'Karapatang Ma-access — humiling ng kopya ng inyong personal na datos',
    termsS4Li3: 'Karapatang Itama — itama ang hindi tama o hindi kumpletong datos',
    termsS4Li4: 'Karapatang Burahin — humiling ng pagtanggal ng datos na hindi na kailangan',
    termsS4Li5: 'Karapatang Tumutol — tumutol sa pagpoproseso ng inyong personal na datos',
    termsS4Li6: 'Karapatang Magreklamo — sa National Privacy Commission (NPC)',
    termsS5Title: 'Panahon ng Pagpapanatili ng Datos',
    termsS5Body: 'Ang mga rekord ng bisita ay pinapanatili sa loob ng isang (1) taon mula sa petsa ng pagbisita, pagkatapos nito ay ligtas na itatapon alinsunod sa National Archives Act at mga alituntunin ng NPC. Maaaring mapanatili ang mga rekord nang mas matagal kung kinakailangan ng batas o kasalukuyang legal na proseso.',
    termsS6Title: 'Seguridad ng Datos',
    termsS6Body: 'Ang Lungsod ng Taguig ay nagpapatupad ng naaangkop na teknikal at organisasyonal na mga hakbang upang protektahan ang inyong personal na datos laban sa hindi awtorisadong pag-access, pagsisiwalat, pagbabago, o pagkasira. Ang access sa mga rekord ng bisita ay limitado lamang sa mga awtorisadong tauhan ng gobyerno.',
    termsS7Title: 'Makipag-ugnayan at Data Protection Officer',
    termsS7Body: 'Para sa mga katanungan, alalahanin, o upang gamitin ang inyong mga karapatan sa privacy ng datos, makipag-ugnayan sa aming Data Protection Officer:',
    termsContactDPO: 'Data Protection Officer',
    termsContactOffice: 'Lungsod ng Taguig — Kagawaran ng ICT',
    termsContactAddr: 'Gen. Luna St., Tuktukan, Taguig, Philippines',
    termsContactEmail: 'itoffice@taguig.gov.ph',
    termsScrollHint: 'Mag-scroll pababa upang mabasa ang buong abiso',
    termsScrollDone: 'Nabasa na ninyo ang buong abiso',
    termsDecline: 'Tumanggi at Bumalik',
    termsAccept: '✓ Naiintindihan at Sumasang-ayon Ako',
    termsNote: 'Sa pag-tap ng "Naiintindihan at Sumasang-ayon Ako", pumapayag kayo sa pagkolekta at pagpoproseso ng inyong personal na datos ayon sa nakalagay sa itaas.',
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