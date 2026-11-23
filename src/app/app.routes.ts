import { Routes } from '@angular/router';

import { authGuard } from './guards/auth-guard';
import { publicGuard } from './guards/public.guard';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
    canActivate: [publicGuard],
  },
  {
    path: 'attendance-detail',
    loadComponent: () =>
      import('./pages/driver/attendance-detail/attendance-detail.page').then(
        (m) => m.AttendanceDetailPage
      ),
  },
  {
    path: 'tabs',
    loadComponent: () => import('./pages/tabs/tabs.page').then((m) => m.TabsPage),
    canActivate: [authGuard],
    children: [
      // ==========================================
      // RUTE KHUSUS KO / KASIR
      // ==========================================
      {
        path: 'ko',
        children: [
          {
            path: 'attendance',
            loadComponent: () =>
              import('./pages/common/attendance-screen/attendance-screen.page').then(
                (m) => m.AttendanceScreenPage
              ),
          },
          {
            path: 'checksheets',
            loadComponent: () =>
              import('./pages/ko/checksheets/ko-checksheets.page').then(
                (m) => m.KoChecksheetsPage
              ),
          },
          {
            path: 'checksheets/history',
            loadComponent: () =>
              import('./pages/ko/checksheet-history/ko-checksheet-history.page').then(
                (m) => m.KoChecksheetHistoryPage
              ),
          },
          {
            path: 'checksheets/form/:slug',
            loadComponent: () =>
              import('./pages/common/checksheet-form/checksheet-form.page').then(
                (m) => m.ChecksheetFormPage
              ),
          },
          {
            path: 'deliveries',
            loadComponent: () =>
              import('./pages/ko/deliveries/ko-deliveries.page').then(
                (m) => m.KoDeliveriesPage
              ),
          },
          {
            path: 'deliveries/:id',
            loadComponent: () =>
              import('./pages/ko/delivery-detail/ko-delivery-detail.page').then(
                (m) => m.KoDeliveryDetailPage
              ),
          },
          {
            path: 'kpi',
            loadComponent: () =>
              import('./pages/ko/kpi/ko-kpi.page').then((m) => m.KoKpiPage),
          },
          {
            path: 'leave',
            loadComponent: () =>
              import('./pages/common/leave-list/leave-list.page').then(
                (m) => m.LeaveListPage
              ),
          },
          {
            path: '',
            redirectTo: 'attendance',
            pathMatch: 'full',
          },
        ],
      },

      // ==========================================
      // RUTE KHUSUS DRIVER
      // ==========================================
      {
        path: 'driver',
        children: [
          {
            path: 'attendance',
            loadComponent: () =>
              import('./pages/common/attendance-screen/attendance-screen.page').then(
                (m) => m.AttendanceScreenPage
              ),
          },
          {
            path: 'inspection',
            loadComponent: () =>
              import('./pages/driver/driver-inspection/driver-inspection.page').then(
                (m) => m.DriverInspectionPage
              ),
          },
          {
            path: 'inspection/form/:slug',
            loadComponent: () =>
              import('./pages/common/checksheet-form/checksheet-form.page').then(
                (m) => m.ChecksheetFormPage
              ),
          },
          {
            path: 'bulk-delivery',
            loadComponent: () =>
              import('./pages/driver/bulk-delivery/bulk-delivery.page').then(
                (m) => m.DriverBulkDeliveryPage
              ),
          },
          {
            path: 'customers',
            loadComponent: () =>
              import('./pages/driver/customer-list/customer-list.page').then(
                (m) => m.CustomerListPage
              ),
          },
          {
            path: 'history',
            loadComponent: () =>
              import('./pages/driver/driver-history/driver-history.page').then(
                (m) => m.DriverHistoryPage
              ),
          },
          {
            path: 'leave',
            loadComponent: () =>
              import('./pages/common/leave-list/leave-list.page').then(
                (m) => m.LeaveListPage
              ),
          },
          {
            path: 'salary',
            loadComponent: () =>
              import('./pages/driver/driver-salary/driver-salary.page').then(
                (m) => m.DriverSalaryPage
              ),
          },
          {
            path: 'leaderboard',
            loadComponent: () =>
              import('./pages/driver/leaderboard/leaderboard.page').then(
                (m) => m.LeaderboardPage
              ),
          },
          {
            path: 'delivery-proof',
            loadComponent: () =>
              import('./pages/driver/delivery-proof/delivery-proof.page').then(
                (m) => m.DeliveryProofPage
              ),
          },
          {
            path: '',
            redirectTo: 'attendance',
            pathMatch: 'full',
          },
        ],
      },

      // ==========================================
      // RUTE KHUSUS SALES (DIPERTAHANKAN)
      // ==========================================
      {
        path: 'sales',
        children: [
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./pages/sales/sales-dashboard/sales-dashboard.page').then(
                (m) => m.SalesDashboardPage
              ),
          },
          {
            path: 'attendance',
            loadComponent: () =>
              import('./pages/common/attendance-screen/attendance-screen.page').then(
                (m) => m.AttendanceScreenPage
              ),
          },
          {
            path: 'visit-create',
            loadComponent: () =>
              import('./pages/sales/visit-report-create/visit-report-create.page').then(
                (m) => m.VisitReportCreatePage
              ),
          },
          {
            path: 'daily-report',
            loadComponent: () =>
              import('./pages/sales/daily-report-create/daily-report-create.page').then(
                (m) => m.DailyReportCreatePage
              ),
          },
          {
            path: 'history',
            loadComponent: () =>
              import('./pages/sales/sales-history/sales-history.page').then(
                (m) => m.SalesHistoryPage
              ),
          },
          {
            path: 'leave',
            loadComponent: () =>
              import('./pages/common/leave-list/leave-list.page').then(
                (m) => m.LeaveListPage
              ),
          },
          {
            path: '',
            redirectTo: 'dashboard',
            pathMatch: 'full',
          },
        ],
      },

      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/common/profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        path: '',
        redirectTo: '/home',
        pathMatch: 'full',
      },
    ],
  },

  // --- RUTE DI LUAR TABS ---
  {
    path: 'checksheets/form/:slug',
    loadComponent: () =>
      import('./pages/common/checksheet-form/checksheet-form.page').then(
        (m) => m.ChecksheetFormPage
      ),
    canActivate: [authGuard],
  },
  {
    path: 'leave-create',
    loadComponent: () =>
      import('./pages/common/leave-create/leave-create.page').then(
        (m) => m.LeaveCreatePage
      ),
    canActivate: [authGuard],
  },
  {
    path: 'visit-report-list',
    loadComponent: () =>
      import('./pages/sales/visit-report-list/visit-report-list.page').then(
        (m) => m.VisitReportListPage
      ),
    canActivate: [authGuard],
  },
  {
    path: 'driver-salary',
    loadComponent: () =>
      import('./pages/driver/driver-salary/driver-salary.page').then(
        (m) => m.DriverSalaryPage
      ),
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/common/profile/profile.page').then((m) => m.ProfilePage),
    canActivate: [authGuard],
  },
  {
    path: 'customer-list',
    loadComponent: () =>
      import('./pages/driver/customer-list/customer-list.page').then(
        (m) => m.CustomerListPage
      ),
    canActivate: [authGuard],
  },
  {
    path: 'cash-advance',
    loadComponent: () =>
      import('./pages/common/cash-advance/cash-advance.page').then(
        (m) => m.CashAdvancePage
      ),
    canActivate: [authGuard],
  },
];
