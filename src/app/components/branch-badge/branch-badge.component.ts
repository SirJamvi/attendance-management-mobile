import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { storefrontOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth';

@Component({
  selector: 'app-branch-badge',
  standalone: true,
  imports: [CommonModule, IonIcon],
  template: `
    <div *ngIf="branchName" class="branch-pill">
      <ion-icon name="storefront-outline"></ion-icon>
      <span>{{ branchName }}</span>
    </div>
  `,
  styles: [`
    .branch-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: rgba(255, 255, 255, 0.22);
      color: #ffffff;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      margin-right: 8px;
      max-width: 150px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .branch-pill ion-icon {
      font-size: 13px;
      flex-shrink: 0;
    }
  `]
})
export class BranchBadgeComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private sub?: Subscription;
  branchName = '';

  constructor() {
    addIcons({ storefrontOutline });
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
}
