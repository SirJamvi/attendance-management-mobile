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
  walletOutline,
  people // <-- 1. TAMBAHKAN INI
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
      walletOutline,
      people // <-- 2. DAN DAFTARKAN DI SINI
    });
  }

  ngOnInit() {
    const user = this.authService.getCurrentUserValue();
    this.userRole = user?.role.slug || '';
  }

}