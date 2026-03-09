import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Lang = 'en' | 'fil';

export interface AppLabels {
  // Landing
  tagline: string;
  welcomeTo: string;
  subtitle: string;
  prompt: string;
  visitorsToday: string;
  currentlyInside: string;
  checkinTitle: string;
  checkinDesc: string;
  checkinBtn: string;
  checkoutTitle: string;
  checkoutDesc: string;
  checkoutBtn: string;
  step1ci: string;
  step2ci: string;
  step3ci: string;
  step1co: string;
  step2co: string;
  step3co: string;
  navCheckin: string;
  navCheckout: string;
  footerSub: string;
  langToggleLabel: string;
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
    step1ci: '① Select ID',
    step2ci: '② Scan ID',
    step3ci: '③ Get Pass',
    step1co: '① Get Pass',
    step2co: '② Enter #',
    step3co: '③ Exit',
    navCheckin: '🏛️ Check-In',
    navCheckout: '🚪 Check-Out',
    footerSub: 'For assistance, please approach the nearest security personnel.',
    langToggleLabel: 'Filipino',
  },
  fil: {
    tagline: 'MAPANBAGO · MASIGLA · MAPAGMALASAKIT',
    welcomeTo: 'MALIGAYANG PAGDATING SA',
    subtitle: 'Mapanbago, Masigla, at Mapagmalasakit na Lungsod',
    prompt: 'Pumili ng transaksyon sa ibaba upang makapagsimula.',
    visitorsToday: 'Bisita Ngayon',
    currentlyInside: 'Kasalukuyang Nasa Loob',
    checkinTitle: 'PAG-CHECK IN',
    checkinDesc: 'Irehistro ang inyong pagbisita sa pamamagitan ng inyong government ID. Makatanggap ng visitor pass na may QR code para sa labasan.',
    checkinBtn: 'MAGSIMULA NG CHECK-IN →',
    checkoutTitle: 'PAG-CHECK OUT',
    checkoutDesc: 'Ilagay ang inyong control number mula sa visitor pass upang mairehistro ang inyong pag-alis sa gusali.',
    checkoutBtn: 'MAGSIMULA NG CHECK-OUT →',
    step1ci: '① Piliin ang ID',
    step2ci: '② I-scan ang ID',
    step3ci: '③ Kumuha ng Pass',
    step1co: '① Kunin ang Pass',
    step2co: '② Ilagay ang #',
    step3co: '③ Umalis',
    navCheckin: '🏛️ Mag-Check In',
    navCheckout: '🚪 Mag-Check Out',
    footerSub: 'Para sa tulong, makipag-ugnayan sa pinakamalapit na security personnel.',
    langToggleLabel: 'English',
  },
};

@Injectable({ providedIn: 'root' })
export class LangService {
  private langSubject = new BehaviorSubject<Lang>('en');

  lang$ = this.langSubject.asObservable();
  get lang(): Lang { return this.langSubject.value; }
  get labels(): AppLabels { return LABELS[this.langSubject.value]; }

  setLang(lang: Lang): void { this.langSubject.next(lang); }

  toggle(): void {
    this.setLang(this.lang === 'en' ? 'fil' : 'en');
  }
}