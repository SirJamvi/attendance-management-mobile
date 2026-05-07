import { Component, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonTabs, IonTabBar, IonTabButton, IonIcon,
  IonLabel, IonRouterOutlet
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  home, homeOutline, time, timeOutline, calendar, calendarOutline,
  person, personOutline, speedometer, speedometerOutline,
  location, locationOutline, documentText, documentTextOutline,
  addCircle, addCircleOutline, wallet, walletOutline,
  people, peopleOutline, cashOutline, cash,
  gridOutline, close, closeOutline
} from 'ionicons/icons';
import { AuthService } from 'src/app/services/auth';
import { RadialMenuService, MenuItem } from 'src/app/services/radial-menu.service';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: true,
  imports: [
    IonTabs, IonTabBar, IonTabButton, IonIcon,
    IonLabel, IonRouterOutlet, CommonModule, FormsModule
  ]
})
export class TabsPage implements OnInit, OnDestroy {

  userRole: string = '';
  isHolding: boolean = false;

  private holdTimer: any = null;
  private readonly HOLD_DURATION_MS = 400;

  driverMenuItems: MenuItem[] = [
    { label: 'Pelanggan', icon: 'people-outline',         route: '/tabs/driver/customers' },
    { label: 'Riwayat',   icon: 'time-outline',           route: '/tabs/driver/history'   },
    { label: 'Gaji',      icon: 'wallet-outline',         route: '/tabs/driver/salary'    },
    { label: 'Cuti',      icon: 'calendar-outline',       route: '/tabs/driver/leave'     },
    { label: 'Kasbon',    icon: 'cash-outline',           route: '/cash-advance'          },
  ];

  salesMenuItems: MenuItem[] = [
    { label: 'Visit',    icon: 'add-circle-outline',     route: '/tabs/sales/visit-create' },
    { label: 'Laporan',  icon: 'document-text-outline',  route: '/tabs/sales/daily-report' },
    { label: 'Riwayat',  icon: 'time-outline',           route: '/tabs/sales/history'      },
    { label: 'Kasbon',   icon: 'cash-outline',           route: '/cash-advance'            },
    { label: 'Profil',   icon: 'person-outline',         route: '/tabs/profile'            },
  ];

  get menuOpen() { return this.radialMenuService.isOpen; }

  constructor(
    private authService: AuthService,
    private router: Router,
    private el: ElementRef,
    private radialMenuService: RadialMenuService
  ) {
    addIcons({
      home, homeOutline, time, timeOutline, calendar, calendarOutline,
      person, personOutline, speedometer, speedometerOutline,
      location, locationOutline, documentText, documentTextOutline,
      addCircle, addCircleOutline, wallet, walletOutline,
      people, peopleOutline, cashOutline, cash,
      gridOutline, close, closeOutline
    });
  }

  ngOnInit() {
    const user = this.authService.getCurrentUserValue();
    this.userRole = user?.role || '';
  }

  ngOnDestroy() {
    this.cancelHold();
    this.radialMenuService.close();
  }

  onHoldStart(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    this.isHolding = true;

    // Ambil posisi X center tombol untuk RadialMenuService
    const btn = event.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;

    const items = this.userRole === 'driver' ? this.driverMenuItems : this.salesMenuItems;

    this.holdTimer = setTimeout(() => {
      this.isHolding = false;
      // Buka menu via service — overlay dirender di AppComponent
      this.radialMenuService.open(items, centerX, (route) => {
        this.router.navigateByUrl(route);
      });
    }, this.HOLD_DURATION_MS);
  }

  onHoldEnd(event: MouseEvent | TouchEvent) {
    // Dilepas sebelum threshold — batalkan, jangan buka menu
    if (!this.menuOpen) {
      this.cancelHold();
    }
  }

  cancelHold() {
    this.isHolding = false;
    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
  }
}