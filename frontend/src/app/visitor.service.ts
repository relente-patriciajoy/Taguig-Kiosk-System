import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VisitorService {
  private baseUrl = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) { }

  // Sends base64 image + id type to backend for OCR
  captureId(imageBase64: string, idType: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/capture-id`, {
      image_base64: imageBase64,
      id_type: idType
    });
  }

  // Legacy demo mode
  postScannedData(rawData: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/scan-id`, { raw_data: rawData });
  }

  // Generates exit QR code after purpose is selected
  getQrCode(controlNo: string, purpose: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/generate-qr?control_no=${controlNo}&purpose=${purpose}`);
  }

  // Records visitor exit
  processExit(controlNo: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/exit?control_no=${controlNo}`);
  }
}