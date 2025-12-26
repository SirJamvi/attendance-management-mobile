import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Storage } from '@ionic/storage-angular';
import { environment } from 'src/environments/environment';
import { Observable, from, switchMap } from 'rxjs';

export interface SalaryData {
  period: string;
  shift_info: string;
  daily_wage: number;
  total_attendance: number;
  total_gross_salary: number;
  total_lates: number;
  penalty_amount: number;
  final_salary: number;
}

@Injectable({
  providedIn: 'root'
})
export class SalaryService {
  private http = inject(HttpClient);
  private storage = inject(Storage);
  private apiUrl = environment.apiUrl; 

  constructor() { }

  getDriverSalary(): Observable<{ success: boolean; data: SalaryData; message: string }> {
    console.log('🔍 SalaryService: Mengambil token dari storage...');
    
    // Ambil token dari storage terlebih dahulu
    return from(this.storage.get('auth_token')).pipe(
      switchMap((token) => {
        console.log('🔍 SalaryService: Token ditemukan?', token ? 'YES' : 'NO');
        
        if (!token) {
          console.error('❌ SalaryService: TOKEN TIDAK ADA!');
        } else {
          console.log('🔑 SalaryService: Token =', token.substring(0, 30) + '...');
        }
        
        // Buat headers dengan Authorization Bearer
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        });

        console.log('📤 SalaryService: Headers =', {
          Authorization: `Bearer ${token?.substring(0, 20)}...`,
          Accept: 'application/json'
        });
        
        const url = `${this.apiUrl}/driver/salary`;
        console.log('🌐 SalaryService: Requesting =', url);

        // Kirim request dengan headers
        return this.http.get<{ success: boolean; data: SalaryData; message: string }>(
          url,
          { headers }
        );
      })
    );
  }
}