import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
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
  gridOutline, close, closeOutline, clipboardOutline,
  checkmarkDoneOutline, statsChartOutline, cubeOutline,
  cardOutline
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

  userRole = '';
  private userSub?: Subscription;

  koMenuItems: MenuItem[] = [
    { label: 'Riwayat',  icon: 'time-outline',     route: '/tabs/ko/checksheets/history' },
    { label: 'Cuti',     icon: 'calendar-outline', route: '/tabs/ko/leave'               },
    { label: 'Kasbon',   icon: 'cash-outline',     route: '/cash-advance'                },
    { label: 'Profil',   icon: 'person-outline',   route: '/tabs/profile'                },
  ];

  driverMenuItems: MenuItem[] = [
    { label: 'Pelanggan',  icon: 'people-outline',   route: '/tabs/driver/customers'      },
    { label: 'Kartu nama', icon: 'card-outline',     route: '/tabs/driver/delivery-proof' },
    { label: 'Riwayat',    icon: 'time-outline',     route: '/tabs/driver/history'        },
    { label: 'Cuti',       icon: 'calendar-outline', route: '/tabs/driver/leave'          },
    { label: 'Kasbon',     icon: 'cash-outline',     route: '/cash-advance'               },
    { label: 'Profil',     icon: 'person-outline',   route: '/tabs/profile'               },
  ];

  salesMenuItems: MenuItem[] = [
    { label: 'Visit',    icon: 'add-circle-outline',     route: '/tabs/sales/visit-create' },
    { label: 'Laporan',  icon: 'document-text-outline',  route: '/tabs/sales/daily-report' },
    { label: 'Riwayat',  icon: 'time-outline',           route: '/tabs/sales/history'      },
    { label: 'Kasbon',   icon: 'cash-outline',           route: '/cash-advance'            },
    { label: 'Profil',   icon: 'person-outline',         route: '/tabs/profile'            },
  ];

  get menuOpen() { return this.radialMenuService.isOpen; }

  get isKoRole(): boolean {
    return this.authService.isKoRole(this.userRole);
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private radialMenuService: RadialMenuService
  ) {
    addIcons({
      home, homeOutline, time, timeOutline, calendar, calendarOutline,
      person, personOutline, speedometer, speedometerOutline,
      location, locationOutline, documentText, documentTextOutline,
      addCircle, addCircleOutline, wallet, walletOutline,
      people, peopleOutline, cashOutline, cash,
      gridOutline, close, closeOutline, clipboardOutline,
      checkmarkDoneOutline, statsChartOutline, cubeOutline,
      cardOutline
    });
  }

  ngOnInit() {
    const user = this.authService.getCurrentUserValue();
    this.userRole = user?.role || '';

    this.userSub = this.authService.getCurrentUser().subscribe((u) => {
      if (u?.role) {
        this.userRole = u.role;
      }
    });
  }

  ngOnDestroy() {
    this.radialMenuService.close();
    this.userSub?.unsubscribe();
  }

  /**
   * Menampilkan atau menutup bottom sheet menu navigasi sekali ketuk
   */
  toggleMenu() {
    if (this.menuOpen) {
      this.radialMenuService.close();
    } else {
      let items = this.salesMenuItems;
      if (this.isKoRole) {
        items = this.koMenuItems;
      } else if (this.userRole === 'driver') {
        items = this.driverMenuItems;
      }

      this.radialMenuService.open(items, (route) => {
        this.router.navigateByUrl(route);
      });
    }
  }

  /**
   * Tutup bottom sheet saat tab lain disentuh / berpindah
   */
  onTabChange() {
    if (this.menuOpen) {
      this.radialMenuService.close();
    }
  }
}
