import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Storage } from '@ionic/storage-angular';
import { environment } from 'src/environments/environment';
import { Observable, from, switchMap } from 'rxjs';

// ✅ UPDATE: Interface disesuaikan dengan response Controller terbaru
export interface SalaryData {
  period: string;
  shift_info: string;
  daily_wage: number;
  total_attendance: number;
  total_overtime: number; 
  total_gross_salary: number;
  total_lates: number;
  penalty_amount: number;
  
  // ✅ TAMBAHAN GAMIFICATION:
  gamification_bonus: number; 
  gamification_title?: string;
  
  final_salary: number;
  severe_warning?: boolean; 
  warning_message?: string;
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
        // --- LOGIKA DEBUGGING ---
        console.log('🔍 SalaryService: Token ditemukan?', token ? 'YES' : 'NO');
        
        if (!token) {
          console.error('❌ SalaryService: TOKEN TIDAK ADA! User mungkin belum login.');
        } else {
          // Log sebagian token untuk memastikan bukan string kosong/null
          console.log('🔑 SalaryService: Token =', token.substring(0, 30) + '...');
        }
        
        // Buat headers dengan Authorization Bearer
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        });

        // Log Headers untuk memastikan format benar sebelum dikirim
        console.log('📤 SalaryService: Headers =', {
          Authorization: `Bearer ${token ? token.substring(0, 20) : 'null'}...`,
          Accept: 'application/json'
        });
        
        const url = `${this.apiUrl}/driver/salary`;
        console.log('🌐 SalaryService: Requesting URL =', url);

        // Kirim request ke Backend
        return this.http.get<{ success: boolean; data: SalaryData; message: string }>(
          url,
          { headers }
        );
      })
    );
  }
}