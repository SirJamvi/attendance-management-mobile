// app.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonApp, IonRouterOutlet, IonIcon, Platform } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  close, closeOutline, gridOutline, peopleOutline, cardOutline,
  timeOutline, calendarOutline, cashOutline, personOutline,
  addCircleOutline, documentTextOutline
} from 'ionicons/icons';
import { RadialMenuService, MenuItem } from './services/radial-menu.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [IonApp, IonRouterOutlet, IonIcon, CommonModule]
})
export class AppComponent implements OnInit, OnDestroy {

  private backButtonSub?: Subscription;

  constructor(
    public radialMenu: RadialMenuService,
    private platform: Platform
  ) {
    addIcons({
      close,
      closeOutline,
      gridOutline,
      peopleOutline,
      cardOutline,
      timeOutline,
      calendarOutline,
      cashOutline,
      personOutline,
      addCircleOutline,
      documentTextOutline
    });
  }

  ngOnInit() {
    // Intersep tombol back hardware Android saat menu sheet terbuka
    this.backButtonSub = this.platform.backButton.subscribeWithPriority(10000, (processNextHandler) => {
      if (this.radialMenu.isOpen) {
        this.radialMenu.close();
      } else {
        processNextHandler();
      }
    });
  }

  ngOnDestroy() {
    this.backButtonSub?.unsubscribe();
  }

  closeMenu() {
    this.radialMenu.close();
  }

  selectItem(item: MenuItem) {
    this.radialMenu.navigate(item.route);
  }
}
