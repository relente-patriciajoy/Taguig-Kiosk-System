import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.html',
  styleUrl: './landing.css'
})
export class LandingComponent {
  currentTime = new Date();

  constructor(private router: Router) {
    setInterval(() => { this.currentTime = new Date(); }, 1000);
  }

  goToCheckin(): void { this.router.navigate(['/checkin']); }
  goToCheckout(): void { this.router.navigate(['/checkout']); }
}