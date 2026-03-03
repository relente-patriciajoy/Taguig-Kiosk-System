import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VisitorService {
  // This is the URL of your Python FastAPI backend
  private apiUrl = 'http://127.0.0.1:8000/scan-id';

  constructor(private http: HttpClient) { }

  // This function will be called when the user clicks "Scan"
  getScannedData(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  getQrCode(controlNo: string, purpose: string) {
    return this.http.get<any>(`http://127.0.0.1:8000/generate-qr?control_no=${controlNo}&purpose=${purpose}`);
  }
}