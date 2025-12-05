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
  checkmarkOutline,
  addOutline,
  removeOutline,
  searchOutline,
  menuOutline,
  personOutline,
  logOutOutline,
  homeOutline,
  documentTextOutline,
  locationOutline
} from 'ionicons/icons';

if (environment.production) {
  enableProdMode();
}

// --- 3. JALANKAN LOADER SEBELUM BOOTSTRAP ---
// Ini mendaftarkan komponen <pwa-camera-modal> ke browser
defineCustomElements(window);

// --- 4. REGISTER ICONS ---
addIcons({
  'chevron-down-outline': chevronDownOutline,
  'chevron-up-outline': chevronUpOutline,
  'chevron-forward-outline': chevronForwardOutline,
  'chevron-back-outline': chevronBackOutline,
  'calendar-outline': calendarOutline,
  'time-outline': timeOutline,
  'camera-outline': cameraOutline,
  'close-outline': closeOutline,
  'checkmark-outline': checkmarkOutline,
  'add-outline': addOutline,
  'remove-outline': removeOutline,
  'search-outline': searchOutline,
  'menu-outline': menuOutline,
  'person-outline': personOutline,
  'log-out-outline': logOutOutline,
  'home-outline': homeOutline,
  'document-text-outline': documentTextOutline,
  'location-outline': locationOutline
});

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes),
    // Menggunakan provideHttpClient (Code baru) menggantikan HttpClientModule
    provideHttpClient(withInterceptorsFromDi()), 
    // Storage tetap dipertahankan menggunakan importProvidersFrom
    importProvidersFrom(IonicStorageModule.forRoot())
  ],
});