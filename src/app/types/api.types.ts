// Definisikan tipe data yang akan diterima & dikirim ke API Laravel v1

export type UserRole = 'owner' | 'admin' | 'ko' | 'kasir' | 'driver' | 'sales' | string;

export interface Role {
  id: number;
  name: string;
  slug: UserRole;
}

export interface Branch {
  id: number;
  name: string;
  address?: string | null;
  phone?: string | null;
}

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  branch_id?: number | null;
  branch_name?: string | null;
  phone?: string;
  role_id?: number;
  is_active?: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T, M = any> {
  success: boolean;
  data: T;
  message: string;
  meta?: M;
}

// ==========================================
// PRESENSI & GATEKEEPER CHECK-OUT DRIVER
// ==========================================

export interface CheckoutRequirement {
  key: 'vehicle_fuel_inspection' | 'daily_delivery_report' | string;
  title: string;
  completed: boolean;
  status: string;
  action_slug?: string | null;
  message?: string | null;
}

export interface CheckoutEligibility {
  can_checkout: boolean;
  bypass_applied: boolean;
  bypass_reason: string | null;
  requirements: CheckoutRequirement[];
}

export interface AttendanceStatusMeta {
  shift_name?: string;
  shift_start?: string;
  shift_end?: string;
  is_day_off?: boolean;
  current_day?: string;
  severe_warning?: boolean;
  warning_message?: string;
  checkout_eligibility?: CheckoutEligibility | null;
  duty_branch_id?: number | null;
  duty_branch_name?: string | null;
  previous_sessions?: any[];
  current_session_number?: number;
  can_check_in_next_session?: boolean;
}

export interface Attendance {
  id: number;
  user_id: number;
  branch_id?: number | null;
  session_number?: number;
  date: string;
  check_in_time: string;
  check_in_photo: string;
  check_in_location: { latitude: number; longitude: number };
  check_out_time: string | null;
  check_out_photo: string | null;
  check_out_location: { latitude: number; longitude: number } | null;
  status: 'present' | 'late' | 'pending' | string;
  auto_checksheet?: any;
}

// ==========================================
// UNIFIED ACS — CHECKSHEET 3 FASE & INSIDENTAL
// ==========================================

export type ChecksheetSlotStatus =
  | 'upcoming'
  | 'open'
  | 'done'
  | 'late'
  | 'missed'
  | 'needs_owner_review'
  | 'exempt'
  | string;

export interface ChecksheetVehicleStatus {
  id?: number;
  vehicle_id?: number;
  name?: string;
  vehicle_name?: string;
  plate_number?: string | null;
  completed: boolean;
  submitted_by?: string | null;
  submitted_by_role?: string | null;
  submitted_at?: string | null;
  submission_id?: number | null;
  is_verified?: boolean;
  verified_by?: string | null;
  verified_at?: string | null;
  verification_status?: string;
  review_notes?: string | null;
  answers?: Record<string, { value_text?: string; value_numeric?: number; file_path?: string | null }> | null;
}

export interface ChecksheetSlot {
  id?: number;
  form_schedule_id?: number;
  slug: string;
  title: string;
  description?: string | null;
  phase?: 'pagi' | 'siang' | 'sore' | 'malam' | string;
  slot_name?: string;
  window_start?: string;
  window_end?: string;
  time_window?: string;
  status: ChecksheetSlotStatus;
  window_status?: ChecksheetSlotStatus;
  source?: 'auto' | 'manual' | 'pos_web_sync' | string;
  requires_vehicle?: boolean;
  is_gatekeeper?: boolean;
  is_checkout_gatekeeper?: boolean;
  is_exempt?: boolean;
  exempt_reason?: string | null;
  pos_synced?: boolean;
  synced_operator?: string | null;
  pos_sync_info?: any;
  submitted_at?: string | null;
  submitted_by?: string | null;
  vehicles?: ChecksheetVehicleStatus[];
}

export interface ChecksheetTodayData {
  date?: string;
  branch_id?: number;
  branch_name?: string;
  active_shift?: 'pagi' | 'siang';
  active_phases?: string[];
  completed_slots: number;
  total_slots: number;
  progress_percent: number;
  phases: {
    pagi: ChecksheetSlot[];
    siang: ChecksheetSlot[];
    sore: ChecksheetSlot[];
    malam?: ChecksheetSlot[];
  };
}

export interface ChecksheetIncidentalForm {
  id?: number;
  slug: string;
  title: string;
  description?: string | null;
  requires_vehicle?: boolean;
}

export interface ChecksheetSubmissionSummary {
  id: number;
  slug?: string;
  form_title?: string;
  title?: string;
  status?: ChecksheetSlotStatus;
  submitted_at?: string;
  submitted_by?: string;
  vehicle_name?: string | null;
  driver_name?: string | null;
  notes?: string | null;
  answers?: Record<string, any>;
}

export interface ChecksheetIncidentalData {
  forms: ChecksheetIncidentalForm[];
  today_submissions: ChecksheetSubmissionSummary[];
}

export type ChecksheetFieldType =
  | 'checklist'
  | 'boolean'
  | 'number'
  | 'currency'
  | 'text'
  | 'textarea'
  | 'select'
  | 'photo';

export interface ChecksheetFieldOption {
  label: string;
  value: string;
}

export interface ChecksheetFormField {
  key?: string;
  field_key?: string;
  label: string;
  field_type: ChecksheetFieldType;
  required?: boolean;
  is_required?: boolean;
  placeholder?: string | null;
  help_text?: string | null;
  options?: Array<string | ChecksheetFieldOption> | null;
  default_value?: any;
  sort_order?: number;
}

export interface ChecksheetFormSchema {
  id?: number;
  slug: string;
  title: string;
  description?: string | null;
  requires_vehicle?: boolean;
  fields: ChecksheetFormField[];
  active_schedules?: any[];
  activeSchedules?: any[];
}

export interface VehicleOption {
  id: number;
  name: string;
  plate_number?: string | null;
  type?: string | null;
  is_active?: boolean;
}

export interface DriverOption {
  id: number;
  name: string;
  username?: string;
}

export interface OpnameProductItem {
  product_id: number;
  product_name: string;
  unit: string;
  inventory_id: number;
  system_stock: number;
  actual_stock?: number;
  kulkas_1?: number;
  kulkas_2?: number;
  kulkas_3?: number;
  notes?: string;
}

export interface ChecksheetFormMeta {
  is_blind_count?: boolean;
  vehicles?: VehicleOption[];
  drivers?: DriverOption[];
  opname_products?: OpnameProductItem[];
  active_schedule_id?: number | null;
}

export interface ChecksheetFormDetailResponse {
  form: ChecksheetFormSchema;
  meta?: ChecksheetFormMeta;
}

export interface ChecksheetSubmitPayload {
  form_schedule_id?: number | null;
  vehicle_id?: number | null;
  driver_id?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  answers: Record<string, any>;
  items?: any[];
  actual_cash_drawer?: number | null;
}

export interface BlindCountReconciliation {
  pos_expected_cash: number;
  actual_cash_drawer: number;
  cash_variance: number;
  shortage_amount: number;
  status?: ChecksheetSlotStatus;
}

export interface ChecksheetSubmitResult {
  submission_id?: number;
  status?: ChecksheetSlotStatus;
  reconciliation?: BlindCountReconciliation;
  pos_expected_cash?: number;
  actual_cash_drawer?: number;
  cash_variance?: number;
  shortage_amount?: number;
  checkout_eligibility?: CheckoutEligibility | null;
}

// ==========================================
// KO — DELIVERY APPROVAL, POS CROSS-CHECK & KPI
// ==========================================

export interface PosCrossCheckDriver {
  driver_id: number;
  driver_name: string;
  attendance_id?: number | null;
  total_balls_driver: number;
  total_balls_pos: number;
  total_cash_driver: number;
  total_cash_expected_from_driver: number;
  unsettled_hold_count: number;
  is_anomaly: boolean;
  anomaly_reasons: string[];
  bypass_applied?: boolean;
  bypass_reason?: string | null;
}

export interface KoDeliveryItem {
  id: number;
  driver_id?: number;
  driver_name: string;
  driver?: { id: number; name: string } | null;
  customer_name: string;
  delivery_address?: string | null;
  delivery_date?: string;
  qty_20kg: number;
  qty_15kg: number;
  qty_10kg: number;
  qty_5kg: number;
  total_balls: number;
  total_weight_kg: number;
  payment_method: 'cash' | 'transfer' | 'qris' | 'kasbon' | string;
  cash_collected: number;
  status: 'pending' | 'approved' | 'rejected' | string;
  rejection_reason?: string | null;
  input_mode?: 'magic_paste' | 'manual' | string;
  is_manual?: boolean;
  notes?: string | null;
  raw_wa_text?: string | null;
  proof_photo?: string | null;
  proof_photo_url?: string | null;
  photo_proof_url?: string | null;
  vehicle_name?: string | null;
  vehicle?: { id: number; name: string; plate_number?: string } | null;
  created_at?: string;
}

export interface KoDeliveriesData {
  date?: string;
  pos_cross_check: PosCrossCheckDriver[];
  deliveries: KoDeliveryItem[];
}

export interface KoKpiSummary {
  month: string;
  branch_name?: string;
  total_kpi_bonus: number;
  max_kpi_bonus?: number;
  discipline_ratio: number;
  on_time_slots: number;
  total_required_slots: number;
  working_days: number;
  component_a_bonus: number;
  max_component_a?: number;
  total_shortage_amount: number;
  closing_count: number;
  component_b_bonus: number;
  max_component_b?: number;
}

// ==========================================
// DRIVER — BULK DELIVERY & KPI PENGIRIMAN
// ==========================================

export type PaymentMethodType = 'cash' | 'transfer' | 'qris' | 'kasbon';

export interface PosOrderDeliveryItem {
  pos_transaction_id: number;
  invoice_number: string;
  customer_name: string;
  customer_address?: string | null;
  qty_20kg: number;
  qty_15kg: number;
  qty_10kg: number;
  qty_5kg: number;
  total_balls: number;
  total_weight_kg: number;
  payment_method: PaymentMethodType | string;
  total_amount: number;
  cash_collected: number;
  transaction_time: string;
}

export interface DriverPosOrdersResponse {
  pos_available: boolean;
  pos_error?: string;
  date: string;
  is_confirmed: boolean;
  confirmed_balls: number;
  total_orders: number;
  total_balls: number;
  qty_20kg: number;
  qty_15kg: number;
  qty_10kg: number;
  qty_5kg: number;
  total_weight_kg: number;
  total_cash_expected: number;
  orders: PosOrderDeliveryItem[];
  daily_ball_target: number;
  shift_type: string;
  target_achievement_pct: number;
  checkout_eligibility?: CheckoutEligibility | null;
}

export interface DriverDeliveryItemInput {
  customer_name: string;
  qty_20kg: number;
  qty_15kg: number;
  qty_10kg: number;
  qty_5kg: number;
  payment_method: PaymentMethodType;
  cash_collected: number;
}

export interface DriverDeliveryPayload {
  input_mode: 'magic_paste' | 'manual';
  vehicle_id?: number | null;
  delivery_date?: string;
  raw_wa_text?: string | null;
  proof_photo?: string | null;
  items: DriverDeliveryItemInput[];
}

export interface DriverDeliveryTodayData {
  date?: string;
  shift_type?: 'full_shift' | 'helper' | string;
  daily_ball_target: number;
  approved_balls_today: number;
  pending_balls_today: number;
  target_achievement_pct: number;
  deliveries: KoDeliveryItem[];
}

export interface DriverDeliveryHistoryData {
  month?: string;
  summary?: {
    total_trips?: number;
    total_balls?: number;
    total_weight_kg?: number;
    total_cash?: number;
    approved_count?: number;
    pending_count?: number;
    rejected_count?: number;
    target_balls?: number;
    achievement_pct?: number;
  };
  deliveries: KoDeliveryItem[] | { data: KoDeliveryItem[] } | any;
}

export interface DeliveryKpiSummary {
  total_trips: number;
  total_balls: number;
  target_balls_period: number;
  target_achievement_percent: number;
  days_hit_target: number;
}

// ==========================================
// BUSINESS CARD LEADS & KPI MINGGUAN DRIVER
// ==========================================

export interface BusinessCardPayload {
  customer_name: string;
  customer_phone: string;
  address?: string;
  notes?: string;
  photo: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

export interface BusinessCardKpiData {
  week_target: number;
  week_achieved: number;
  week_progress_percent: number;
  month_target: number;
  month_achieved: number;
  month_progress_percent: number;
  is_weekly_target_reached: boolean;
  is_monthly_target_reached: boolean;
  current_week_count?: number;
  monthly_count?: number;
}

export interface BusinessCardSubmission {
  id: number;
  user_id: number;
  branch_id?: number;
  customer_name: string;
  customer_phone: string;
  address?: string | null;
  notes?: string | null;
  photo_path?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  submission_date: string;
  created_at: string;
  status?: 'valid' | 'flagged_duplicate' | 'rejected' | string;
}
