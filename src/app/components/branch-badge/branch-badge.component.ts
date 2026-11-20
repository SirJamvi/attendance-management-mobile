import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { storefrontOutline, chevronDownOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth';

@Component({
  selector: 'app-branch-badge',
  standalone: true,
  imports: [CommonModule, IonIcon],
  template: `
    <button
      *ngIf="branchName"
      type="button"
      class="branch-pill"
      [class.clickable]="clickable"
      (click)="onClick()"
      [attr.aria-label]="clickable ? 'Ubah cabang tugas: ' + branchName : 'Cabang tugas: ' + branchName"
    >
      <ion-icon name="storefront-outline"></ion-icon>
      <span class="branch-label">{{ branchName }}</span>
      <ion-icon *ngIf="clickable" name="chevron-down-outline" class="pill-chevron"></ion-icon>
    </button>
  `,
  styles: [`
    .branch-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: rgba(255, 255, 255, 0.7);
      color: #06324D;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 500;
      margin-right: 8px;
      max-width: 165px;
      white-space: nowrap;
      overflow: hidden;
      border: 1px solid rgba(6, 50, 77, 0.12);
      font-family: inherit;
      transition: background 0.15s ease, transform 0.1s ease;

      ion-icon {
        font-size: 13px;
        flex-shrink: 0;
      }

      .branch-label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .pill-chevron {
        font-size: 11px;
        opacity: 0.75;
        margin-left: 1px;
      }

      &.clickable {
        cursor: pointer;
        padding-right: 8px;

        &:active {
          background: rgba(255, 255, 255, 0.95);
          transform: scale(0.97);
        }
      }
    }
  `]
})
export class BranchBadgeComponent implements OnInit, OnDestroy {
  @Input() clickable = false;
  @Output() clicked = new EventEmitter<void>();

  private authService = inject(AuthService);
  private sub?: Subscription;
  branchName = '';

  constructor() {
    addIcons({ storefrontOutline, chevronDownOutline });
  }

  ngOnInit() {
    this.branchName = this.authService.getBranchName();
    this.sub = this.authService.getCurrentUser().subscribe((user) => {
      this.branchName = user?.branch_name || '';
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  onClick() {
    if (this.clickable) {
      this.clicked.emit();
    }
  }
}
