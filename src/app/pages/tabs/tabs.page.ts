import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  home,
  time,
  calendar,
  person,
  speedometer,
  location,
  documentText,
  addCircle,
  wallet,
  people,
  arrowForward // ← TAMBAHAN untuk fix icon warning
} from 'ionicons/icons';

import { AuthService } from 'src/app/services/auth';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: true,
  imports: [
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
    IonRouterOutlet,
    CommonModule,
    FormsModule
  ]
})
export class TabsPage implements OnInit {

  userRole: string = '';

  constructor(private authService: AuthService) {
    // Daftarkan semua icon yang dipakai di tabs.page.html
    addIcons({
      home,
      time,
      calendar,
      person,
      speedometer,
      location,
      documentText,
      addCircle,
      wallet,
      people,
      arrowForward // ← TAMBAHAN untuk fix icon warning
    });
  }

  ngOnInit() {
    const user = this.authService.getCurrentUserValue();
    
    // ✅ PERBAIKAN: role adalah string langsung dari backend
    this.userRole = user?.role || '';
    
    // Debugging: Cek di Console Chrome/Logcat apakah role terbaca dengan benar
    console.log('🔹 Tabs Init - User Role:', this.userRole);
    console.log('🔹 Tabs Init - User Object:', user);
  }

}