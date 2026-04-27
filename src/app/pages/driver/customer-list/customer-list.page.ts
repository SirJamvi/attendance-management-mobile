import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
  IonBackButton, IonList, IonItem, IonLabel, IonIcon, 
  IonSkeletonText, IonRefresher, IonRefresherContent,
  IonSearchbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mapOutline, locationOutline, callOutline, arrowForward } from 'ionicons/icons'; // ← TAMBAHKAN arrowForward

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
    IonSkeletonText, IonRefresher, IonRefresherContent,
    IonSearchbar
  ]
})
export class CustomerListPage implements OnInit {
  
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  isLoading: boolean = true;
  searchTerm: string = '';

  constructor(private customerService: CustomerService) {
    // ✅ PERBAIKAN: Tambahkan arrowForward
    addIcons({ mapOutline, locationOutline, callOutline, arrowForward });
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
        this.customers = response.data || [];
        this.filteredCustomers = this.customers;
        this.isLoading = false;
        
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
   * Filter data customer berdasarkan search term
   */
  handleSearch(event: any) {
    const query = event.target.value.toLowerCase();
    this.searchTerm = query;

    if (!query.trim()) {
      this.filteredCustomers = this.customers;
      return;
    }

    this.filteredCustomers = this.customers.filter((customer) => {
      return (
        customer.name?.toLowerCase().includes(query) ||
        customer.address?.toLowerCase().includes(query) ||
        customer.phone?.toLowerCase().includes(query)
      );
    });
  }

  /**
   * Membuka Google Maps Eksternal
   */
  openMap(link: string) {
    if (link) {
      window.open(link, '_system');
    }
  }

  /**
   * Telepon Customer
   */
  callCustomer(phone: string | null) {
    if (phone) {
      window.open(`tel:${phone}`, '_system');
    }
  }
}