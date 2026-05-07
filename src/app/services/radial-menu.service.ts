// src/app/services/radial-menu.service.ts
// ─────────────────────────────────────────────────────────────
// Service ini memisahkan STATE menu radial dari TabsPage,
// sehingga overlay bisa dirender di AppComponent (level tertinggi)
// dan tidak memblokir interaksi Ionic.
// ─────────────────────────────────────────────────────────────

import { Injectable, signal } from '@angular/core';

export interface MenuItem {
  label: string;
  icon: string;
  route: string;
}

@Injectable({ providedIn: 'root' })
export class RadialMenuService {

  // State menggunakan Angular Signals agar reactive tanpa Subject
  isOpen = false;
  items: MenuItem[] = [];
  centerX = 0;   // posisi X tombol menu (untuk centering overlay)

  private onNavigate?: (route: string) => void;

  /** Dipanggil dari TabsPage saat hold threshold tercapai */
  open(items: MenuItem[], centerX: number, onNavigate: (route: string) => void) {
    this.items = items;
    this.centerX = centerX;
    this.onNavigate = onNavigate;
    this.isOpen = true;
  }

  /** Dipanggil dari AppComponent saat user melepas jari di item */
  navigate(route: string) {
    this.onNavigate?.(route);
    this.close();
  }

  close() {
    this.isOpen = false;
    this.items = [];
    this.onNavigate = undefined;
  }
}