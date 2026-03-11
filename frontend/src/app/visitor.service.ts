import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VisitorService {
  private baseUrl = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) {}

  // Save visitor check-in to the database and get a server-generated control number
  checkIn(data: {
    full_name: string;
    birthday?: string;
    address?: string;
    id_type?: string;
    id_number?: string;
    purpose: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/checkin`, data);
  }

  // Analyze a single frame for real-time feedback
  analyzeFrame(imageBase64: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/analyze-frame`, {
      image_base64: imageBase64
    });
  }

  // Send captured image for OCR
  captureId(imageBase64: string, idType: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/capture-id`, {
      image_base64: imageBase64,
      id_type: idType
    });
  }

  postScannedData(rawData: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/scan-id`, { raw_data: rawData });
  }

  getQrCode(controlNo: string, purpose: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/generate-qr?control_no=${controlNo}&purpose=${purpose}`);
  }

  processExit(controlNo: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/checkout`, { control_no: controlNo });
  }
}