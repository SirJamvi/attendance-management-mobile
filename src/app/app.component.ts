// app.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonApp, IonRouterOutlet, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, closeOutline } from 'ionicons/icons';
import { RadialMenuService } from './services/radial-menu.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [IonApp, IonRouterOutlet, IonIcon, CommonModule]
})
export class AppComponent {

  hoveredIndex = -1;

  // Radius item dari pusat (px) — samakan dengan SCSS jika diubah
  private readonly RADIAL_RADIUS = 100;

  constructor(public radialMenu: RadialMenuService) {
    addIcons({ close, closeOutline });
  }

  // ─────────────────────────────────────────────
  // Track posisi jari/mouse → update item yang di-hover
  // ─────────────────────────────────────────────
  onSwipeMove(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    let clientX: number, clientY: number;
    if (event instanceof TouchEvent) {
      if (!event.touches.length) return;
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    this.hoveredIndex = this.findClosestItem(clientX, clientY);
  }

  // ─────────────────────────────────────────────
  // Saat jari dilepas → navigasi jika ada item yang di-hover
  // ─────────────────────────────────────────────
  onRelease(event: MouseEvent | TouchEvent) {
    const items = this.radialMenu.items;
    if (this.hoveredIndex >= 0 && this.hoveredIndex < items.length) {
      this.radialMenu.navigate(items[this.hoveredIndex].route);
    } else {
      this.radialMenu.close();
    }
    this.hoveredIndex = -1;
  }

  // ─────────────────────────────────────────────
  // Hitung sudut item ke-i
  // Spread -150° sampai -30° (setengah lingkaran atas)
  // ─────────────────────────────────────────────
  private getAngle(index: number): number {
    const count = this.radialMenu.items.length;
    const startDeg = -150;
    const endDeg = -30;
    const step = count > 1 ? (endDeg - startDeg) / (count - 1) : 0;
    return (startDeg + index * step) * (Math.PI / 180);
  }

  // ─────────────────────────────────────────────
  // CSS transform untuk posisi item di radial
  // ─────────────────────────────────────────────
  getItemTransform(index: number): string {
    const angle = this.getAngle(index);
    const x = Math.cos(angle) * this.RADIAL_RADIUS;
    const y = Math.sin(angle) * this.RADIAL_RADIUS;
    const scale = this.hoveredIndex === index ? 1.15 : 1;
    return `translate(${x}px, ${y}px) scale(${scale})`;
  }

  // ─────────────────────────────────────────────
  // Cari item terdekat dari posisi jari (threshold 55px)
  // ─────────────────────────────────────────────
  private findClosestItem(clientX: number, clientY: number): number {
    const TAB_BAR_H = 68;
    const originX = this.radialMenu.centerX;
    const originY = window.innerHeight - TAB_BAR_H / 2;

    let closestIdx = -1;
    let minDist = 55;

    this.radialMenu.items.forEach((_, i) => {
      const angle = this.getAngle(i);
      const ix = originX + Math.cos(angle) * this.RADIAL_RADIUS;
      const iy = originY + Math.sin(angle) * this.RADIAL_RADIUS;
      const dist = Math.sqrt((clientX - ix) ** 2 + (clientY - iy) ** 2);
      if (dist < minDist) { minDist = dist; closestIdx = i; }
    });

    return closestIdx;
  }
}