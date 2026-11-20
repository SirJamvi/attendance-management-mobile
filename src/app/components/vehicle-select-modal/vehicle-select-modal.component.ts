import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  bicycleOutline,
  checkmarkCircle,
  close,
  checkmark,
  alertCircleOutline
} from 'ionicons/icons';
import { VehicleOption } from 'src/app/types/api.types';

@Component({
  selector: 'app-vehicle-select-modal',
  standalone: true,
  imports: [CommonModule, IonIcon],
  template: `
    <div
      *ngIf="isOpen"
      class="vehicle-modal-overlay"
      [class.closing]="isClosing"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vehicle-modal-title"
    >
      <!-- Backdrop Gelap -->
      <div
        class="vehicle-backdrop"
        (click)="handleBackdropClick()"
      ></div>

      <!-- Bottom Sheet Dialog -->
      <div class="vehicle-sheet-card">
        <!-- Handle Bar -->
        <div class="sheet-handle" aria-hidden="true"></div>

        <!-- Header -->
        <div class="sheet-header">
          <div class="header-icon-box">
            <ion-icon name="bicycle-outline"></ion-icon>
          </div>
          <div class="header-texts">
            <h2 id="vehicle-modal-title" class="sheet-title">{{ title }}</h2>
            <p class="sheet-subtitle">{{ subtitle }}</p>
          </div>
          <button
            type="button"
            class="btn-close"
            (click)="triggerDismiss()"
            aria-label="Tutup"
          >
            <ion-icon name="close"></ion-icon>
          </button>
        </div>

        <!-- Daftar Motor -->
        <div class="vehicle-list" role="radiogroup" aria-label="Daftar armada motor">
          <button
            type="button"
            *ngFor="let v of vehicles"
            class="vehicle-item"
            [class.selected]="v.id === selectedId"
            [class.disabled]="isVehicleCompleted(v.id)"
            [disabled]="isVehicleCompleted(v.id)"
            (click)="selectVehicle(v)"
            role="radio"
            [attr.aria-checked]="v.id === selectedId"
          >
            <!-- Radio Indicator / Centang Selesai -->
            <div class="vehicle-indicator" aria-hidden="true">
              <ion-icon
                *ngIf="isVehicleCompleted(v.id)"
                name="checkmark-circle"
                class="done-check-icon"
              ></ion-icon>
              <div
                *ngIf="!isVehicleCompleted(v.id)"
                class="radio-circle"
                [class.checked]="v.id === selectedId"
              ></div>
            </div>

            <!-- Detail Motor -->
            <div class="vehicle-info">
              <div class="vehicle-name-row">
                <span class="vehicle-name">{{ v.name }}</span>
                <span *ngIf="v.plate_number" class="plate-badge">{{ v.plate_number }}</span>
              </div>

              <!-- Status Ketersediaan -->
              <div *ngIf="isVehicleCompleted(v.id)" class="vehicle-status done">
                <span>Sudah dicek oleh {{ getCompletedInspector(v.id) }}</span>
              </div>
              <div *ngIf="!isVehicleCompleted(v.id)" class="vehicle-status ready">
                <span>Tersedia untuk dicek</span>
              </div>
            </div>

            <!-- Selected checkmark indicator -->
            <div *ngIf="v.id === selectedId && !isVehicleCompleted(v.id)" class="selected-check" aria-hidden="true">
              <ion-icon name="checkmark"></ion-icon>
            </div>
          </button>

          <div *ngIf="vehicles.length === 0" class="vehicle-empty">
            <ion-icon name="bicycle-outline"></ion-icon>
            <span>Tidak ada armada motor aktif pada cabang ini.</span>
          </div>
        </div>

        <!-- Footer / Tombol Aksi -->
        <div class="sheet-footer">
          <button
            type="button"
            class="ui-btn-action"
            [disabled]="!selectedId || isVehicleCompleted(selectedId)"
            (click)="confirmSelection()"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .vehicle-modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 100000;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      pointer-events: none;
    }

    .vehicle-backdrop {
      position: fixed;
      inset: 0;
      background: var(--menu-backdrop, rgba(10, 18, 40, 0.45));
      pointer-events: all;
      animation: fadeInBackdrop 0.25s ease-out forwards;
      backdrop-filter: blur(2px);
      -webkit-backdrop-filter: blur(2px);
    }

    .vehicle-sheet-card {
      position: relative;
      background: #FFFFFF;
      border-radius: 22px 22px 0 0;
      box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.12);
      pointer-events: all;
      animation: slideUpSheet 0.25s ease-out forwards;
      padding: 0 16px calc(16px + env(safe-area-inset-bottom)) 16px;
      max-width: 500px;
      width: 100%;
      margin: 0 auto;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
    }

    .vehicle-modal-overlay.closing {
      .vehicle-backdrop {
        animation: fadeOutBackdrop 0.2s ease-in forwards;
      }
      .vehicle-sheet-card {
        animation: slideDownSheet 0.2s ease-in forwards;
      }
    }

    .sheet-handle {
      width: 36px;
      height: 4px;
      border-radius: 2px;
      background: var(--menu-handle, #D1D5DB);
      margin: 12px auto 14px auto;
      flex-shrink: 0;
    }

    .sheet-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--ui-border, #E5E7EB);
      flex-shrink: 0;
      position: relative;
    }

    .header-icon-box {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: var(--ui-action-soft, #E1F5FE);
      color: var(--ui-action, #0277BD);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      flex-shrink: 0;
    }

    .header-texts {
      flex: 1;
      min-width: 0;
    }

    .sheet-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--ui-text, #111827);
      margin: 0 0 3px 0;
      line-height: 1.25;
    }

    .sheet-subtitle {
      font-size: 12px;
      color: var(--ui-text-2, #4B5563);
      margin: 0;
      line-height: 1.4;
    }

    .btn-close {
      background: transparent;
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--ui-text-muted, #6B7280);
      font-size: 20px;
      cursor: pointer;
      flex-shrink: 0;
      padding: 0;
      &:active {
        background: #F3F4F6;
      }
    }

    .vehicle-list {
      flex: 1;
      overflow-y: auto;
      padding: 12px 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 320px;
      -webkit-overflow-scrolling: touch;
    }

    .vehicle-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      background: #FFFFFF;
      border: 1.5px solid var(--ui-border, #E5E7EB);
      border-radius: 14px;
      cursor: pointer;
      text-align: left;
      width: 100%;
      min-height: 54px;
      transition: all 0.15s ease;
      font-family: inherit;

      &:active:not(:disabled) {
        transform: scale(0.99);
      }

      &.selected {
        border-color: var(--ui-action, #0277BD);
        background: var(--ui-action-soft, #E1F5FE);
      }

      &.disabled {
        opacity: 0.65;
        background: #F9FAFB;
        cursor: not-allowed;
        border-color: #E5E7EB;
      }
    }

    .vehicle-indicator {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
    }

    .done-check-icon {
      font-size: 20px;
      color: var(--ui-ok, #059669);
    }

    .radio-circle {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid var(--ui-border, #D1D5DB);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;

      &.checked {
        border-color: var(--ui-action, #0277BD);
        background: #FFFFFF;

        &::after {
          content: '';
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--ui-action, #0277BD);
        }
      }
    }

    .vehicle-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .vehicle-name-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .vehicle-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--ui-text, #111827);
    }

    .plate-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 1px 6px;
      border-radius: 4px;
      background: #F3F4F6;
      color: #374151;
      border: 1px solid #E5E7EB;
      white-space: nowrap;
    }

    .vehicle-status {
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 4px;

      &.ready {
        color: var(--ui-text-muted, #6B7280);
      }

      &.done {
        color: var(--ui-ok, #059669);
        font-weight: 500;
      }
    }

    .selected-check {
      color: var(--ui-action, #0277BD);
      font-size: 18px;
      flex-shrink: 0;
    }

    .vehicle-empty {
      padding: 24px;
      text-align: center;
      color: var(--ui-text-muted, #6B7280);
      font-size: 13px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;

      ion-icon {
        font-size: 28px;
        opacity: 0.5;
      }
    }

    .sheet-footer {
      padding-top: 10px;
      flex-shrink: 0;
    }

    .ui-btn-action {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 48px;
      border-radius: 12px;
      background: var(--ui-action, #0277BD);
      color: #FFFFFF;
      font-size: 14px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: opacity 0.2s ease, transform 0.1s ease;
      font-family: inherit;

      &:active:not(:disabled) {
        transform: scale(0.99);
        opacity: 0.9;
      }

      &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
    }

    @keyframes fadeInBackdrop {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes fadeOutBackdrop {
      from { opacity: 1; }
      to { opacity: 0; }
    }

    @keyframes slideUpSheet {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }

    @keyframes slideDownSheet {
      from { transform: translateY(0); }
      to { transform: translateY(100%); }
    }
  `]
})
export class VehicleSelectModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() vehicles: VehicleOption[] = [];
  @Input() selectedVehicleId: number | null = null;
  @Input() completedMap: Record<number, { submitted_by?: string | null; submitted_at?: string | null }> = {};
  @Input() title = 'Pilih armada motor';
  @Input() subtitle = 'Pilih unit motor yang Anda gunakan bertugas hari ini.';
  @Input() confirmText = 'Pilih motor ini';

  @Output() vehicleSelected = new EventEmitter<VehicleOption>();
  @Output() dismiss = new EventEmitter<void>();

  selectedId: number | null = null;
  isClosing = false;

  constructor() {
    addIcons({
      bicycleOutline,
      checkmarkCircle,
      close,
      checkmark,
      alertCircleOutline
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedVehicleId']) {
      this.selectedId = this.selectedVehicleId;
    }
    if (changes['isOpen'] && this.isOpen) {
      this.isClosing = false;
      // Jika motor yang terpilih saat ini sudah completed, auto-select motor pertama yang belum completed
      if (this.selectedId && this.isVehicleCompleted(this.selectedId)) {
        this.selectedId = this.findFirstAvailableVehicleId();
      } else if (!this.selectedId && this.vehicles.length > 0) {
        this.selectedId = this.findFirstAvailableVehicleId();
      }
    }
  }

  isVehicleCompleted(vehicleId?: number): boolean {
    if (!vehicleId) return false;
    return !!this.completedMap[vehicleId];
  }

  getCompletedInspector(vehicleId?: number): string {
    if (!vehicleId) return 'Petugas';
    return this.completedMap[vehicleId]?.submitted_by || 'Petugas';
  }

  private findFirstAvailableVehicleId(): number | null {
    const available = this.vehicles.find(v => !this.isVehicleCompleted(v.id));
    return available ? available.id : (this.vehicles[0]?.id ?? null);
  }

  selectVehicle(vehicle: VehicleOption): void {
    if (this.isVehicleCompleted(vehicle.id)) return;
    this.selectedId = vehicle.id;
  }

  confirmSelection(): void {
    if (!this.selectedId || this.isVehicleCompleted(this.selectedId)) return;
    const chosen = this.vehicles.find(v => v.id === this.selectedId);
    if (chosen) {
      this.vehicleSelected.emit(chosen);
    }
  }

  handleBackdropClick(): void {
    this.triggerDismiss();
  }

  triggerDismiss(): void {
    this.isClosing = true;
    setTimeout(() => {
      this.isClosing = false;
      this.dismiss.emit();
    }, 200);
  }
}
