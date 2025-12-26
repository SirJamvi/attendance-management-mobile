import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
  IonBackButton, IonList, IonItem, IonLabel, IonIcon, 
  IonSkeletonText, IonRefresher, IonRefresherContent 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mapOutline, locationOutline, callOutline } from 'ionicons/icons';

// --- IMPORT SERVICE & TYPE ---
// Pastikan path import ini sesuai dengan struktur foldermu
import { CustomerService } from 'src/app/services/customer.service';
import { Customer } from 'src/app/types/customer.types';

@Component({
  selector: 'app-customer-list',
  templateUrl: './customer-list.page.html',
  styleUrls: ['./customer-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
    IonBackButton, IonList, IonItem, IonLabel, IonIcon,
    IonSkeletonText, IonRefresher, IonRefresherContent
  ]
})
export class CustomerListPage implements OnInit {
  
  customers: Customer[] = [];
  isLoading: boolean = true;

  constructor(private customerService: CustomerService) {
    // Daftarkan icon yang dipakai
    addIcons({ mapOutline, locationOutline, callOutline });
  }

  ngOnInit() {
    this.loadData();
  }

  /**
   * Mengambil data dari API
   */
  loadData(event?: any) {
    this.customerService.getCustomers().subscribe({
      next: (response) => {
        // response adalah object { success, data, message }
        // Kita ambil array di dalam 'data'
        this.customers = response.data || [];
        this.isLoading = false;
        
        // Matikan animasi loading refresher jika ada
        if (event) event.target.complete();
      },
      error: (err) => {
        console.error('Gagal mengambil data customer:', err);
        this.isLoading = false;
        if (event) event.target.complete();
      }
    });
  }

  /**
   * Membuka Google Maps Eksternal
   */
  openMap(link: string) {
    if (link) {
      // '_system' akan memaksa membuka aplikasi Google Maps di HP
      window.open(link, '_system');
    }
  }

  /**
   * (Opsional) Telepon Customer
   */
  callCustomer(phone: string | null) {
    if (phone) {
      window.open(`tel:${phone}`, '_system');
    }
  }
}