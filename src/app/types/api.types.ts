// Definisikan tipe data yang akan kita terima dari API Laravel

export interface Role {
  id: number;
  name: string;
  slug: 'admin' | 'driver' | 'sales';
}

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  role_id: number;
  is_active: boolean;
  role: Role; // Relasi
  // ... (properti lain jika diperlukan)
}

// Tipe data untuk respons login
export interface AuthResponse {
  token: string;
  user: User;
}

// Tipe data umum untuk respons API kita
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// Tipe data untuk presensi
export interface Attendance {
  id: number;
  user_id: number;
  date: string;
  check_in_time: string;
  check_in_photo: string;
  check_in_location: { latitude: number; longitude: number };
  check_out_time: string | null;
  check_out_photo: string | null;
  check_out_location: { latitude: number; longitude: number } | null;
  status: 'present' | 'late' | 'pending';
}

// (Tambahkan tipe data lain seperti LeaveRequest, VisitReport, dll. di sini)