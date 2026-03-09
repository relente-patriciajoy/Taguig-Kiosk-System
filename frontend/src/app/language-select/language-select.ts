import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { LangService, Lang } from '../services/lang.service';

@Component({
  selector: 'app-language-select',
  standalone: true,
  templateUrl: './language-select.html',
  styleUrl: './language-select.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [LangService]
})
export class LanguageSelectComponent {

  animating: Lang | null = null;
  today = new Date().getFullYear();

  constructor(
    private router: Router,
    private langService: LangService
  ) { }

  choose(lang: Lang): void {
    this.animating = lang;
    this.langService.setLang(lang);
    // Short delay so the user sees the selection flash before navigating
    setTimeout(() => this.router.navigate(['/home']), 420);
  }
}