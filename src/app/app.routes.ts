import { Routes } from '@angular/router';

// --- PERBAIKAN IMPORT ---
// (Menggunakan nama file yang benar: auth-guard.ts dan public.guard.ts)
import { authGuard } from './guards/auth-guard';
import { publicGuard } from './guards/public.guard';
// -------------------------

export const routes: Routes = [
  {
    // Rute awal (loading/redirector)
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    // Rute default, arahkan ke 'home'
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    // Halaman Login (Dilindungi oleh PublicGuard)
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage),
    canActivate: [publicGuard] // <-- HANYA bisa diakses jika BELUM login
  },

   {
    path: 'attendance-detail',
    loadComponent: () => import('./pages/driver/attendance-detail/attendance-detail.page').then(m => m.AttendanceDetailPage)
  },
  {
    // Halaman Internal (Tabs) - (Dilindungi oleh AuthGuard)
    path: 'tabs',
    loadComponent: () => import('./pages/tabs/tabs.page').then( m => m.TabsPage),
    canActivate: [authGuard], // <-- HANYA bisa diakses jika SUDAH login
    
    // --- Rute anak di dalam Tabs ---
    children: [
      {
        // Rute untuk Driver
        path: 'driver',
        children: [
          {
            // Halaman default Driver: Presensi
            path: 'attendance',
            loadComponent: () => import('./pages/common/attendance-screen/attendance-screen.page').then( m => m.AttendanceScreenPage)
          },
          // --- TAMBAHKAN INI (Customer List) ---
          {
            path: 'customers',
            loadComponent: () => import('./pages/driver/customer-list/customer-list.page').then( m => m.CustomerListPage)
          },
          // -------------------------------------
          {
            path: 'history',
            loadComponent: () => import('./pages/driver/driver-history/driver-history.page').then( m => m.DriverHistoryPage)
          },
          {
            path: 'leave',
            loadComponent: () => import('./pages/common/leave-list/leave-list.page').then( m => m.LeaveListPage)
          },
          {
            path: 'salary',
            loadComponent: () => import('./pages/driver/driver-salary/driver-salary.page').then( m => m.DriverSalaryPage)
          },
          {
            // Arahkan /tabs/driver ke halaman presensi
            path: '',
            redirectTo: 'attendance',
            pathMatch: 'full'
          }
        ]
      },
      {
        // Rute untuk Sales
        path: 'sales',
        children: [
          {
            // Halaman default Sales: Dashboard
            path: 'dashboard',
            loadComponent: () => import('./pages/sales/sales-dashboard/sales-dashboard.page').then( m => m.SalesDashboardPage)
          },
          {
            path: 'attendance',
            loadComponent: () => import('./pages/common/attendance-screen/attendance-screen.page').then( m => m.AttendanceScreenPage)
          },
          {
            path: 'visit-create',
            loadComponent: () => import('./pages/sales/visit-report-create/visit-report-create.page').then( m => m.VisitReportCreatePage)
          },
          {
            path: 'daily-report',
            loadComponent: () => import('./pages/sales/daily-report-create/daily-report-create.page').then( m => m.DailyReportCreatePage)
          },
          {
            path: 'history',
            loadComponent: () => import('./pages/sales/sales-history/sales-history.page').then( m => m.SalesHistoryPage)
          },
           {
            path: 'leave',
            loadComponent: () => import('./pages/common/leave-list/leave-list.page').then( m => m.LeaveListPage)
          },
          {
            // Arahkan /tabs/sales ke halaman dashboard
            path: '',
            redirectTo: 'dashboard',
            pathMatch: 'full'
          }
        ]
      },
      
      {
        // ✅ ROUTE PROFILE BARU (DI DALAM TABS)
        path: 'profile',
        loadComponent: () => import('./pages/common/profile/profile.page').then(m => m.ProfilePage)
      },
      {
        // Arahkan /tabs ke /home (jika user mengakses tanpa role)
        path: '',
        redirectTo: '/home',
        pathMatch: 'full'
      }
    ]
  },
  
  // --- RUTE DILUAR TABS (UNTUK FORM) ---
  // (Kita letakkan di luar 'tabs' agar tidak ada navigasi bawah)
  {
    path: 'leave-create',
    loadComponent: () => import('./pages/common/leave-create/leave-create.page').then( m => m.LeaveCreatePage),
    canActivate: [authGuard] // <-- Lindungi
  },
  {
    path: 'visit-report-list',
    loadComponent: () => import('./pages/sales/visit-report-list/visit-report-list.page').then( m => m.VisitReportListPage),
    canActivate: [authGuard] // <-- Lindungi
  },
  {
    path: 'attendance-detail',
    loadComponent: () => import('./pages/driver/attendance-detail/attendance-detail.page').then( m => m.AttendanceDetailPage)
  },
  {
    path: 'driver-salary',
    loadComponent: () => import('./pages/driver/driver-salary/driver-salary.page').then( m => m.DriverSalaryPage)
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/common/profile/profile.page').then( m => m.ProfilePage)
  },
  {
    path: 'customer-list',
    loadComponent: () => import('./pages/driver/customer-list/customer-list.page').then( m => m.CustomerListPage)
  }
];