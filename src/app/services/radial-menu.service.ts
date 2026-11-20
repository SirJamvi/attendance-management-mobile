// src/app/services/radial-menu.service.ts
import { Injectable } from '@angular/core';

export interface MenuItem {
  label: string;
  icon: string;
  route: string;
}

@Injectable({ providedIn: 'root' })
export class RadialMenuService {

  isOpen = false;
  isClosing = false;
  items: MenuItem[] = [];
  centerX = 0;

  private onNavigate?: (route: string) => void;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Membuka bottom sheet menu navigasi.
   * Mendukung pemanggilan 2 parameter (items, onNavigate) maupun 3 parameter (items, centerX, onNavigate).
   */
  open(
    items: MenuItem[],
    onNavigateOrCenterX?: ((route: string) => void) | number,
    onNavigate?: (route: string) => void
  ) {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
    this.isClosing = false;
    this.items = items;

    if (typeof onNavigateOrCenterX === 'function') {
      this.onNavigate = onNavigateOrCenterX;
    } else {
      this.centerX = typeof onNavigateOrCenterX === 'number' ? onNavigateOrCenterX : 0;
      this.onNavigate = onNavigate;
    }

    this.isOpen = true;
  }

  /** Navigasi ke route item yang dipilih dan tutup sheet */
  navigate(route: string) {
    this.onNavigate?.(route);
    this.close();
  }

  /**
   * Menutup sheet dengan animasi slide-down 200ms sebelum me-reset state.
   */
  close() {
    if (!this.isOpen || this.isClosing) return;
    this.isClosing = true;

    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
    }

    this.closeTimer = setTimeout(() => {
      this.isOpen = false;
      this.isClosing = false;
      this.items = [];
      this.onNavigate = undefined;
      this.closeTimer = null;
    }, 200);
  }

  /** Toggle buka/tutup sheet */
  toggle(items: MenuItem[], onNavigate: (route: string) => void) {
    if (this.isOpen) {
      this.close();
    } else {
      this.open(items, onNavigate);
    }
  }
}
