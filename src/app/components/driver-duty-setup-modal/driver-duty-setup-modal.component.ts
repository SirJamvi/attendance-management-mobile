import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  storefrontOutline,
  checkmark,
  close,
  timeOutline,
  calendarOutline,
  alertCircleOutline,
  arrowBackOutline,
  arrowForwardOutline,
  checkmarkCircle,
  warningOutline,
  informationCircleOutline
} from 'ionicons/icons';
import { Branch, OperationalShift } from 'src/app/types/api.types';

@Component({
  selector: 'app-driver-duty-setup-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon],
  template: `
    <div
      *ngIf="isOpen"
      class="duty-modal-overlay"
      [class.closing]="isClosing"
      role="dialog"
      aria-modal="true"
      aria-labelledby="duty-modal-title"
    >
      <!-- Backdrop Gelap -->
      <div class="duty-backdrop" (click)="handleBackdropClick()"></div>

      <!-- Bottom Sheet Dialog -->
      <div class="duty-sheet-card">
        <!-- Handle Bar -->
        <div class="sheet-handle" aria-hidden="true"></div>

        <!-- Stepper Indicator Header -->
        <div class="stepper-header">
          <div
            class="step-item"
            [class.active]="currentStep === 1"
            [class.completed]="currentStep > 1"
            (click)="goToStep(1)"
          >
            <span class="step-num">{{ currentStep > 1 ? '✓' : '1' }}</span>
            <span class="step-label">Cabang Tugas</span>
          </div>
          <div class="stepper-line" [class.active]="currentStep > 1"></div>
          <div
            class="step-item"
            [class.active]="currentStep === 2"
            [class.completed]="isStep2Valid"
            (click)="selectedBranchId ? goToStep(2) : null"
          >
            <span class="step-num">2</span>
            <span class="step-label">Jadwal Shift</span>
          </div>
        </div>

        <!-- ======================================================== -->
        <!-- LANGKAH 1: PILIH CABANG TUGAS -->
        <!-- ======================================================== -->
        <ng-container *ngIf="currentStep === 1">
          <div class="sheet-header">
            <div class="header-icon-box">
              <ion-icon name="storefront-outline"></ion-icon>
            </div>
            <div class="header-texts">
              <h2 id="duty-modal-title" class="sheet-title">Pilih Cabang Tugas</h2>
              <p class="sheet-subtitle">Tentukan lokasi depot penugasan Anda hari ini.</p>
            </div>
            <button
              *ngIf="canDismiss"
              type="button"
              class="btn-close"
              (click)="triggerDismiss()"
              aria-label="Tutup"
            >
              <ion-icon name="close"></ion-icon>
            </button>
          </div>

          <!-- Daftar Cabang -->
          <div class="list-container" role="radiogroup" aria-label="Daftar cabang">
            <button
              type="button"
              *ngFor="let branch of branches"
              class="selection-item"
              [class.selected]="isBranchSelected(branch.id)"
              (click)="selectBranch(branch)"
              role="radio"
              [attr.aria-checked]="isBranchSelected(branch.id)"
            >
              <div class="radio-indicator" aria-hidden="true">
                <div class="radio-circle" [class.checked]="isBranchSelected(branch.id)"></div>
              </div>

              <div class="item-info">
                <div class="item-title-row">
                  <span class="item-title">{{ branch.name }}</span>
                  <span
                    *ngIf="isHomeBranch(branch.id)"
                    class="badge-tag home"
                  >
                    Cabang Akun
                  </span>
                </div>
                <span *ngIf="branch.address" class="item-desc">
                  {{ branch.address }}
                </span>
              </div>

              <div *ngIf="isBranchSelected(branch.id)" class="selected-check" aria-hidden="true">
                <ion-icon name="checkmark"></ion-icon>
              </div>
            </button>
          </div>

          <!-- Footer Langkah 1 -->
          <div class="sheet-footer">
            <button
              type="button"
              class="btn-action primary"
              [disabled]="!selectedBranchId"
              (click)="goToStep(2)"
            >
              <span>Lanjut ke Jadwal Shift</span>
              <ion-icon name="arrow-forward-outline"></ion-icon>
            </button>
          </div>
        </ng-container>

        <!-- ======================================================== -->
        <!-- LANGKAH 2: KONFIRMASI JADWAL SHIFT -->
        <!-- ======================================================== -->
        <ng-container *ngIf="currentStep === 2">
          <div class="sheet-header">
            <div class="header-icon-box shift">
              <ion-icon name="time-outline"></ion-icon>
            </div>
            <div class="header-texts">
              <h2 id="duty-modal-title" class="sheet-title">Konfirmasi Jadwal Shift</h2>
              <p class="sheet-subtitle">
                Cabang: <strong>{{ selectedBranchName }}</strong>
              </p>
            </div>
            <button
              *ngIf="canDismiss"
              type="button"
              class="btn-close"
              (click)="triggerDismiss()"
              aria-label="Tutup"
            >
              <ion-icon name="close"></ion-icon>
            </button>
          </div>

          <div class="list-container shift-container">
            <!-- Kartu Jadwal Admin Hari Ini -->
            <div class="schedule-summary-card" [class.off]="isDayOff">
              <div class="summary-icon">
                <ion-icon [name]="isDayOff ? 'calendar-outline' : 'checkmark-circle'"></ion-icon>
              </div>
              <div class="summary-body">
                <span class="summary-label">Jadwal Resmi Admin Hari Ini:</span>
                <span class="summary-val">
                  {{ isDayOff ? 'Libur / Tidak Terjadwal' : (scheduledShiftName || 'Terjadwal') }}
                </span>
              </div>
              <div class="summary-badge" [class.warn]="isDayOff" [class.ok]="!isDayOff">
                {{ isDayOff ? 'Hari Libur' : 'Jadwal Anda' }}
              </div>
            </div>

            <!-- Daftar Shift Pilihan -->
            <div class="shift-group-title">Pilih shift yang Anda jalankan:</div>

            <div class="shift-cards-grid">
              <button
                type="button"
                *ngFor="let s of shifts"
                class="shift-card"
                [class.selected]="isShiftSelected(s.id)"
                [class.matched]="isShiftScheduled(s.id)"
                (click)="selectShift(s)"
              >
                <div class="shift-card-top">
                  <div class="shift-name">{{ s.name }}</div>
                  <span *ngIf="isShiftScheduled(s.id)" class="match-badge">
                    Sesuai Jadwal
                  </span>
                </div>
                <div class="shift-card-bottom">
                  <span class="shift-time">{{ formatShiftHours(s) }}</span>
                  <div class="radio-circle mini" [class.checked]="isShiftSelected(s.id)"></div>
                </div>
              </button>
            </div>

            <!-- Dynamic Alert Sesuai / Di Luar Jadwal -->
            <div *ngIf="selectedShift" class="validation-status-box" [class.matched]="isShiftMatch" [class.mismatch]="!isShiftMatch">
              <div class="status-box-header">
                <ion-icon [name]="isShiftMatch ? 'checkmark-circle' : 'warning-outline'"></ion-icon>
                <span class="status-box-title">
                  {{ isShiftMatch ? 'Shift Sesuai Jadwal Resmi' : 'Di Luar Jadwal / Tukar Shift' }}
                </span>
              </div>
              <p class="status-box-text">
                {{ isShiftMatch
                  ? 'Shift yang Anda pilih cocok dengan jadwal admin. Presensi masuk Anda langsung sah otomatis.'
                  : 'Shift yang Anda pilih berbeda dari jadwal admin (atau hari libur). Presensi Anda akan dicatat dan membutuhkan validasi Admin di Dashboard Web.' }}
              </p>

              <!-- Input Catatan Jika Berbeda / Di Luar Jadwal -->
              <div *ngIf="!isShiftMatch" class="shift-note-box">
                <label for="shiftNoteInput" class="note-label">Catatan / Alasan (Opsional):</label>
                <input
                  id="shiftNoteInput"
                  type="text"
                  [(ngModel)]="note"
                  placeholder="Contoh: Menggantikan shift rekan / lembur pesanan"
                  class="note-input"
                />
              </div>
            </div>
          </div>

          <!-- Footer Langkah 2 -->
          <div class="sheet-footer double-actions">
            <button
              type="button"
              class="btn-action secondary"
              (click)="goToStep(1)"
            >
              <ion-icon name="arrow-back-outline"></ion-icon>
              <span>Ubah Cabang</span>
            </button>
            <button
              type="button"
              class="btn-action primary"
              [disabled]="!selectedShiftId"
              (click)="confirmAll()"
            >
              <span>Konfirmasi & Mulai</span>
              <ion-icon name="checkmark"></ion-icon>
            </button>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .duty-modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 100000;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      pointer-events: none;
    }

    .duty-backdrop {
      position: fixed;
      inset: 0;
      background: var(--menu-backdrop, rgba(10, 18, 40, 0.45));
      pointer-events: all;
      animation: fadeInBackdrop 0.25s ease-out forwards;
      backdrop-filter: blur(2px);
      -webkit-backdrop-filter: blur(2px);
    }

    .duty-sheet-card {
      position: relative;
      background: #ffffff;
      border-radius: 22px 22px 0 0;
      box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.12);
      pointer-events: all;
      animation: slideUpSheet 0.25s ease-out forwards;
      padding: 0 16px calc(16px + env(safe-area-inset-bottom)) 16px;
      max-width: 500px;
      width: 100%;
      margin: 0 auto;
      max-height: 88vh;
      display: flex;
      flex-direction: column;
    }

    .duty-modal-overlay.closing {
      .duty-backdrop {
        animation: fadeOutBackdrop 0.2s ease-in forwards;
      }
      .duty-sheet-card {
        animation: slideDownSheet 0.2s ease-in forwards;
      }
    }

    .sheet-handle {
      width: 36px;
      height: 4px;
      border-radius: 2px;
      background: var(--menu-handle, #D1D5DB);
      margin: 12px auto 10px auto;
      flex-shrink: 0;
    }

    /* Stepper Header */
    .stepper-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 6px 0 12px 0;
      border-bottom: 1px solid #F3F4F6;
      margin-bottom: 12px;
      flex-shrink: 0;
    }

    .step-item {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      opacity: 0.55;
      transition: all 0.2s ease;

      &.active {
        opacity: 1;
        .step-num {
          background: #0277BD;
          color: #ffffff;
          border-color: #0277BD;
        }
        .step-label {
          color: #0277BD;
          font-weight: 700;
        }
      }

      &.completed {
        opacity: 0.9;
        .step-num {
          background: #E1F5FE;
          color: #0277BD;
          border-color: #0277BD;
        }
        .step-label {
          color: #374151;
        }
      }
    }

    .step-num {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 1.5px solid #D1D5DB;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      color: #6B7280;
    }

    .step-label {
      font-size: 12px;
      font-weight: 500;
      color: #6B7280;
    }

    .stepper-line {
      width: 30px;
      height: 2px;
      background: #E5E7EB;
      transition: background 0.2s ease;

      &.active {
        background: #0277BD;
      }
    }

    /* Header */
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

      &.shift {
        background: #FEF3C7;
        color: #D97706;
      }
    }

    .header-texts {
      flex: 1;
      min-width: 0;
    }

    .sheet-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--ui-text, #111827);
      margin: 0 0 2px 0;
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

    /* List Container */
    .list-container {
      flex: 1;
      overflow-y: auto;
      padding: 12px 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 360px;
      -webkit-overflow-scrolling: touch;
    }

    .selection-item {
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
      min-height: 52px;
      transition: all 0.15s ease;
      font-family: inherit;

      &:active {
        transform: scale(0.99);
      }

      &.selected {
        border-color: var(--ui-action, #0277BD);
        background: var(--ui-action-soft, #E1F5FE);
      }
    }

    .radio-indicator {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
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

      &.mini {
        width: 18px;
        height: 18px;
      }

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

    .item-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .item-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .item-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--ui-text, #111827);
    }

    .item-desc {
      font-size: 12px;
      color: var(--ui-text-muted, #6B7280);
      line-height: 1.35;
    }

    .badge-tag {
      font-size: 10.5px;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 6px;

      &.home {
        background: #EFF6FF;
        color: #2563EB;
        border: 1px solid #BFDBFE;
      }
    }

    .selected-check {
      color: var(--ui-action, #0277BD);
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Shift Screen Elements */
    .schedule-summary-card {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #F0FDF4;
      border: 1px solid #BBF7D0;
      border-radius: 12px;
      padding: 10px 12px;
      margin-bottom: 6px;

      &.off {
        background: #FFFBEB;
        border-color: #FDE68A;
      }
    }

    .summary-icon {
      font-size: 22px;
      color: #16A34A;
      display: flex;
      align-items: center;

      .off & {
        color: #D97706;
      }
    }

    .summary-body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .summary-label {
      font-size: 11px;
      color: #4B5563;
      font-weight: 500;
    }

    .summary-val {
      font-size: 13px;
      font-weight: 700;
      color: #111827;
    }

    .summary-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;

      &.ok {
        background: #DCFCE7;
        color: #15803D;
      }
      &.warn {
        background: #FEF3C7;
        color: #B45309;
      }
    }

    .shift-group-title {
      font-size: 12px;
      font-weight: 600;
      color: #374151;
      margin: 4px 0 2px 0;
    }

    .shift-cards-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .shift-card {
      background: #FFFFFF;
      border: 1.5px solid #E5E7EB;
      border-radius: 12px;
      padding: 10px 12px;
      text-align: left;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 6px;
      transition: all 0.15s ease;
      font-family: inherit;

      &.selected {
        border-color: #0277BD;
        background: #E1F5FE;
      }

      &.matched {
        border-color: #86EFAC;
      }

      &.matched.selected {
        border-color: #0277BD;
        background: #E1F5FE;
      }
    }

    .shift-card-top {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .shift-name {
      font-size: 12.5px;
      font-weight: 700;
      color: #111827;
      line-height: 1.25;
    }

    .match-badge {
      align-self: flex-start;
      font-size: 9.5px;
      font-weight: 700;
      background: #DCFCE7;
      color: #15803D;
      padding: 1px 5px;
      border-radius: 4px;
    }

    .shift-card-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 2px;
    }

    .shift-time {
      font-size: 11px;
      color: #6B7280;
      font-weight: 500;
    }

    /* Validation Status Box */
    .validation-status-box {
      border-radius: 12px;
      padding: 10px 12px;
      margin-top: 6px;

      &.matched {
        background: #F0FDF4;
        border: 1px solid #BBF7D0;
        .status-box-header {
          color: #15803D;
        }
        .status-box-text {
          color: #166534;
        }
      }

      &.mismatch {
        background: #FFFBEB;
        border: 1px solid #FDE68A;
        .status-box-header {
          color: #B45309;
        }
        .status-box-text {
          color: #92400E;
        }
      }
    }

    .status-box-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 4px;

      ion-icon {
        font-size: 17px;
      }
    }

    .status-box-text {
      font-size: 11.5px;
      line-height: 1.4;
      margin: 0;
    }

    .shift-note-box {
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .note-label {
      font-size: 11px;
      font-weight: 600;
      color: #78350F;
    }

    .note-input {
      background: #FFFFFF;
      border: 1px solid #FCD34D;
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 12px;
      color: #111827;
      outline: none;
      width: 100%;
      box-sizing: border-box;

      &:focus {
        border-color: #D97706;
      }
    }

    /* Footer Buttons */
    .sheet-footer {
      padding-top: 12px;
      border-top: 1px solid var(--ui-border, #E5E7EB);
      flex-shrink: 0;

      &.double-actions {
        display: flex;
        gap: 10px;
      }
    }

    .btn-action {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      min-height: 48px;
      border-radius: 14px;
      font-size: 14px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;

      &:active {
        transform: scale(0.99);
      }

      &.primary {
        background: #0277BD;
        color: #FFFFFF;

        &:disabled {
          background: #E5E7EB;
          color: #9CA3AF;
          cursor: not-allowed;
          transform: none;
        }
      }

      &.secondary {
        flex: 0 0 38%;
        background: #F3F4F6;
        color: #374151;
        border: 1px solid #E5E7EB;
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
export class DriverDutySetupModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() branches: Branch[] = [];
  @Input() selectedBranchId: number | null = null;
  @Input() homeBranchId: number | null = null;

  @Input() shifts: OperationalShift[] = [];
  @Input() scheduledShiftId: number | null = null;
  @Input() scheduledShiftName: string | null = null;
  @Input() isDayOff = false;
  @Input() selectedShiftId: number | null = null;
  @Input() note = '';
  @Input() canDismiss = true;

  @Output() dutyConfirmed = new EventEmitter<{
    branch: Branch;
    shift: OperationalShift;
    note?: string;
    isMatch: boolean;
  }>();
  @Output() dismiss = new EventEmitter<void>();

  currentStep: 1 | 2 = 1;
  isClosing = false;

  constructor() {
    addIcons({
      storefrontOutline, checkmark, close, timeOutline,
      calendarOutline, alertCircleOutline, arrowBackOutline,
      arrowForwardOutline, checkmarkCircle, warningOutline,
      informationCircleOutline
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.currentStep = 1;
      this.isClosing = false;
      if (!this.selectedBranchId && this.branches.length > 0) {
        this.selectedBranchId = this.homeBranchId || this.branches[0].id;
      }
      if (!this.selectedShiftId) {
        this.selectedShiftId = this.scheduledShiftId || (this.shifts[0]?.id ?? null);
      }
    }
  }

  isBranchSelected(branchId: number): boolean {
    if (!this.selectedBranchId) return false;
    return Number(branchId) === Number(this.selectedBranchId);
  }

  isHomeBranch(branchId: number): boolean {
    if (!this.homeBranchId) return false;
    return Number(branchId) === Number(this.homeBranchId);
  }

  isShiftSelected(shiftId: number): boolean {
    if (!this.selectedShiftId) return false;
    return Number(shiftId) === Number(this.selectedShiftId);
  }

  isShiftScheduled(shiftId: number): boolean {
    if (!this.scheduledShiftId) return false;
    return Number(shiftId) === Number(this.scheduledShiftId);
  }

  get selectedBranch(): Branch | undefined {
    if (!this.selectedBranchId) {
      return this.branches[0];
    }
    return this.branches.find((b) => Number(b.id) === Number(this.selectedBranchId)) || this.branches[0];
  }

  get selectedBranchName(): string {
    return this.selectedBranch?.name || 'Cabang Belum Dipilih';
  }

  get selectedShift(): OperationalShift | undefined {
    if (!this.selectedShiftId) {
      return this.shifts[0];
    }
    return this.shifts.find((s) => Number(s.id) === Number(this.selectedShiftId)) || this.shifts[0];
  }

  get isStep2Valid(): boolean {
    return !!this.selectedShiftId;
  }

  get isShiftMatch(): boolean {
    if (this.isDayOff || !this.scheduledShiftId || !this.selectedShiftId) {
      return false;
    }
    return Number(this.selectedShiftId) === Number(this.scheduledShiftId);
  }

  goToStep(step: 1 | 2) {
    if (step === 2 && !this.selectedBranchId) {
      return;
    }
    this.currentStep = step;
  }

  selectBranch(branch: Branch) {
    this.selectedBranchId = branch.id;
  }

  selectShift(shift: OperationalShift) {
    this.selectedShiftId = shift.id;
  }

  formatShiftHours(s: OperationalShift): string {
    const start = s.start_time ? s.start_time.substring(0, 5) : '';
    const end = s.end_time ? s.end_time.substring(0, 5) : '';
    return `${start} - ${end} WIB`;
  }

  confirmAll() {
    const branch = this.selectedBranch;
    const shift = this.selectedShift;
    if (!branch || !shift) {
      return;
    }

    this.isClosing = true;
    setTimeout(() => {
      this.dutyConfirmed.emit({
        branch,
        shift,
        note: this.note ? this.note.trim() : undefined,
        isMatch: this.isShiftMatch,
      });
      this.isClosing = false;
    }, 200);
  }

  handleBackdropClick() {
    if (this.canDismiss) {
      this.triggerDismiss();
    }
  }

  triggerDismiss() {
    this.isClosing = true;
    setTimeout(() => {
      this.dismiss.emit();
      this.isClosing = false;
    }, 200);
  }
}
