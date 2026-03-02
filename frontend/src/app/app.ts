import { Component } from '@angular/core';
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
  visitorData: any = null;
  loading: boolean = false;

  constructor(private visitorService: VisitorService) { }

  onScanClick() {
    this.loading = true;
    this.visitorService.getScannedData().subscribe({
      next: (data) => {
        this.visitorData = data;
        this.loading = false;
      },
      error: (err) => {
        alert("Make sure your Python Backend is running!");
        console.error(err);
        this.loading = false;
      }
    });
  }
}