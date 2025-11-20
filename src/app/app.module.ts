import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

// --- TAMBAHAN BARU ---
import { HttpClientModule } from '@angular/common/http'; // 1. Impor Modul HTTP
import { IonicStorageModule } from '@ionic/storage-angular'; // 2. Impor Modul Storage
// --- AKHIR TAMBAHAN ---

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    
    // --- TAMBAHAN BARU ---
    HttpClientModule, // 3. Daftarkan Modul HTTP
    IonicStorageModule.forRoot() // 4. Daftarkan Modul Storage
    // --- AKHIR TAMBAHAN ---
  ],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule {}