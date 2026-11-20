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
  storefrontOutline,
  checkmark,
  close,
  businessOutline
} from 'ionicons/icons';
import { Branch } from 'src/app/types/api.types';

@Component({
  selector: 'app-branch-select-modal',
  standalone: true,
  imports: [CommonModule, IonIcon],
  template: `
    <div
      *ngIf="isOpen"
      class="branch-modal-overlay"
      [class.closing]="isClosing"
      role="dialog"
      aria-modal="true"
      aria-labelledby="branch-modal-title"
    >
      <!-- Backdrop Gelap -->
      <div
        class="branch-backdrop"
        (click)="handleBackdropClick()"
      ></div>

      <!-- Bottom Sheet Dialog -->
      <div class="branch-sheet-card">
        <!-- Handle Bar -->
        <div class="sheet-handle" aria-hidden="true"></div>

        <!-- Header -->
        <div class="sheet-header">
          <div class="header-icon-box">
            <ion-icon name="storefront-outline"></ion-icon>
          </div>
          <div class="header-texts">
            <h2 id="branch-modal-title" class="sheet-title">{{ title }}</h2>
            <p class="sheet-subtitle">{{ subtitle }}</p>
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
        <div class="branch-list" role="radiogroup" aria-label="Daftar cabang">
          <button
            type="button"
            *ngFor="let branch of branches"
            class="branch-item"
            [class.selected]="branch.id === selectedId"
            (click)="selectBranch(branch)"
            role="radio"
            [attr.aria-checked]="branch.id === selectedId"
          >
            <!-- Radio Indicator -->
            <div class="branch-radio" aria-hidden="true">
              <div
                class="radio-circle"
                [class.checked]="branch.id === selectedId"
              ></div>
            </div>

            <!-- Detail Cabang -->
            <div class="branch-info">
              <div class="branch-name-row">
                <span class="branch-name">{{ branch.name }}</span>
                <span
                  *ngIf="homeBranchId && branch.id === homeBranchId"
                  class="branch-tag home"
                >
                  Cabang akun
                </span>
              </div>
              <span *ngIf="branch.address" class="branch-address">
                {{ branch.address }}
              </span>
            </div>

            <!-- Checkmark Indicator -->
            <div *ngIf="branch.id === selectedId" class="selected-check" aria-hidden="true">
              <ion-icon name="checkmark"></ion-icon>
            </div>
          </button>

          <div *ngIf="branches.length === 0" class="branch-empty">
            <ion-icon name="business-outline"></ion-icon>
            <span>Memuat daftar cabang...</span>
          </div>
        </div>

        <!-- Footer / Tombol Aksi -->
        <div class="sheet-footer">
          <button
            type="button"
            class="ui-btn-action"
            [disabled]="!selectedId"
            (click)="confirmSelection()"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .branch-modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 100000;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      pointer-events: none;
    }

    .branch-backdrop {
      position: fixed;
      inset: 0;
      background: var(--menu-backdrop, rgba(10, 18, 40, 0.45));
      pointer-events: all;
      animation: fadeInBackdrop 0.25s ease-out forwards;
      backdrop-filter: blur(2px);
      -webkit-backdrop-filter: blur(2px);
    }

    .branch-sheet-card {
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
      max-height: 85vh;
      display: flex;
      flex-direction: column;
    }

    .branch-modal-overlay.closing {
      .branch-backdrop {
        animation: fadeOutBackdrop 0.2s ease-in forwards;
      }
      .branch-sheet-card {
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

    .branch-list {
      flex: 1;
      overflow-y: auto;
      padding: 12px 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 320px;
      -webkit-overflow-scrolling: touch;
    }

    .branch-item {
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

    .branch-radio {
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

    .branch-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .branch-name-row {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .branch-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--ui-text, #111827);
    }

    .branch-tag {
      font-size: 11px;
      font-weight: 500;
      padding: 1px 6px;
      border-radius: 4px;
      white-space: nowrap;

      &.home {
        background: #DBEAFE;
        color: #1E40AF;
      }
    }

    .branch-address {
      font-size: 12px;
      color: var(--ui-text-muted, #6B7280);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .selected-check {
      color: var(--ui-action, #0277BD);
      font-size: 18px;
      flex-shrink: 0;
    }

    .branch-empty {
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
export class BranchSelectModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() branches: Branch[] = [];
  @Input() selectedBranchId: number | null = null;
  @Input() homeBranchId: number | null = null;
  @Input() title = 'Pilih cabang tugas';
  @Input() subtitle = 'Konfirmasi cabang tempat Anda bertugas hari ini. Pilihan motor dan checksheet otomatis menyesuaikan.';
  @Input() confirmText = 'Konfirmasi & mulai';
  @Input() canDismiss = false;

  @Output() branchSelected = new EventEmitter<Branch>();
  @Output() dismiss = new EventEmitter<void>();

  selectedId: number | null = null;
  isClosing = false;

  constructor() {
    addIcons({
      storefrontOutline,
      checkmark,
      close,
      businessOutline
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedBranchId']) {
      this.selectedId = this.selectedBranchId;
    }
    if (changes['isOpen'] && this.isOpen) {
      this.isClosing = false;
      if (!this.selectedId && this.branches.length > 0) {
        this.selectedId = this.homeBranchId || this.branches[0].id;
      }
    }
  }

  selectBranch(branch: Branch): void {
    this.selectedId = branch.id;
  }

  confirmSelection(): void {
    if (!this.selectedId) return;
    const chosen = this.branches.find(b => b.id === this.selectedId);
    if (chosen) {
      this.branchSelected.emit(chosen);
    }
  }

  handleBackdropClick(): void {
    if (this.canDismiss) {
      this.triggerDismiss();
    }
  }

  triggerDismiss(): void {
    this.isClosing = true;
    setTimeout(() => {
      this.isClosing = false;
      this.dismiss.emit();
    }, 200);
  }
}
