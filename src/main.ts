import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { IonicStorageModule } from '@ionic/storage-angular';

// --- 1. IMPORT PWA ELEMENTS ---
import { defineCustomElements } from '@ionic/pwa-elements/loader';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

// --- 2. IMPORT ICON ---
import { addIcons } from 'ionicons';
import {
  chevronDownOutline,
  chevronUpOutline,
  chevronForwardOutline,
  chevronBackOutline,
  calendarOutline,
  timeOutline,
  cameraOutline,
  closeOutline,
  closeCircle,         // ← untuk chip clear button
  checkmarkOutline,
  addOutline,
  removeOutline,
  searchOutline,
  menuOutline,
  personOutline,
  logOutOutline,
  homeOutline,
  documentTextOutline,
  locationOutline,
  // ── Icon tambahan untuk delivery-proof page ──
  informationCircleOutline,
  sendOutline,
  storefrontOutline,
  addCircleOutline,
  listOutline,
  alertCircleOutline,
  // ── Icon lain yang umum dipakai ──
  close,
  trashOutline,
  createOutline,
  eyeOutline,
  starOutline,
  starSharp,
  warningOutline,
  checkmarkCircleOutline,
  helpCircleOutline,
  refreshOutline,
  arrowBackOutline,
  notificationsOutline,
  settingsOutline,
  // ── payment dropdown icons ──
  cardOutline,
  qrCodeOutline,
} from 'ionicons/icons';

if (environment.production) {
  enableProdMode();
}

// --- 3. JALANKAN LOADER SEBELUM BOOTSTRAP ---
defineCustomElements(window);

// --- 4. REGISTER ICONS (lengkap) ---
addIcons({
  'chevron-down-outline': chevronDownOutline,
  'chevron-up-outline': chevronUpOutline,
  'chevron-forward-outline': chevronForwardOutline,
  'chevron-back-outline': chevronBackOutline,
  'calendar-outline': calendarOutline,
  'time-outline': timeOutline,
  'camera-outline': cameraOutline,
  'close-outline': closeOutline,
  'close': close,
  'close-circle': closeCircle,
  'checkmark-outline': checkmarkOutline,
  'add-outline': addOutline,
  'remove-outline': removeOutline,
  'search-outline': searchOutline,
  'menu-outline': menuOutline,
  'person-outline': personOutline,
  'log-out-outline': logOutOutline,
  'home-outline': homeOutline,
  'document-text-outline': documentTextOutline,
  'location-outline': locationOutline,
  // ── delivery-proof ──
  'information-circle-outline': informationCircleOutline,
  'send-outline': sendOutline,
  'storefront-outline': storefrontOutline,
  'add-circle-outline': addCircleOutline,
  'list-outline': listOutline,
  'alert-circle-outline': alertCircleOutline,
  // ── umum ──
  'trash-outline': trashOutline,
  'create-outline': createOutline,
  'eye-outline': eyeOutline,
  'star-outline': starOutline,
  'star-sharp': starSharp,
  'warning-outline': warningOutline,
  'checkmark-circle-outline': checkmarkCircleOutline,
  'help-circle-outline': helpCircleOutline,
  'refresh-outline': refreshOutline,
  'arrow-back-outline': arrowBackOutline,
  'notifications-outline': notificationsOutline,
  'settings-outline': settingsOutline,
  'card-outline': cardOutline,
  'qr-code-outline': qrCodeOutline,
});

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({
      mode: 'md',             // ← FIX #1: Force Material Design mode, stabil di Android WebView
      animated: true,
    }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    importProvidersFrom(IonicStorageModule.forRoot())
  ],
});