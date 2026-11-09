export type UnitType = 'Flat' | 'Shop';
export type PaymentMethod = 'UPI' | 'Cash';
export type PaymentStatus = 'Pending' | 'Verified';
export type IssueCategory = 'Plumbing' | 'Electrical' | 'Structural' | 'Shutter' | 'Leaks' | 'Other';
export type IssuePriority = 'Low' | 'High' | 'Urgent';
export type IssueStatus = 'Pending' | 'In Progress' | 'Resolved';

export interface Property {
  id: string;
  unit_code: string;
  unit_type: UnitType;
  rent_amount: number;
  due_day: number;
  security_deposit?: number;
  building_name?: string;
  floor_number?: string;
  electricity_meter_no?: string;
  is_occupied?: boolean;
  tenant_name?: string;
  tenant_phone?: string;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Tenant {
  id: string;
  property_id: string;
  name: string;
  phone: string;
  email?: string;
  id_proof_type?: string;
  id_proof_number?: string;
  lease_start_date?: string;
  lease_end_date?: string;
  emergency_contact?: string;
  is_active?: boolean;
  unit_code?: string;
  unit_type?: UnitType;
  rent_amount?: number;
  due_day?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Payment {
  id: string;
  property_id: string;
  tenant_id: string;
  amount: number;
  date: string;
  month: string;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  reference_id?: string;
  notes?: string;
  confirmed_by?: 'Landlord' | 'Father' | string;
  confirmed_at?: string;
  receipt_number?: string;
  created_at?: string;
  updated_at?: string;
  // joined fields
  unit_code?: string;
  unit_type?: UnitType;
  tenant_name?: string;
  tenant_phone?: string;
}

export interface Issue {
  id: string;
  property_id: string;
  tenant_id: string;
  category: IssueCategory;
  priority: IssuePriority;
  title: string;
  description: string;
  status: IssueStatus;
  assigned_contractor?: string;
  estimated_cost?: number;
  resolution_notes?: string;
  resolved_at?: string;
  created_at?: string;
  updated_at?: string;
  // joined fields
  unit_code?: string;
  unit_type?: UnitType;
  tenant_name?: string;
  tenant_phone?: string;
}

export interface DueReminder {
  tenant_id: string;
  tenant_name: string;
  tenant_phone: string;
  tenant_email?: string;
  property_id: string;
  unit_code: string;
  unit_type: UnitType;
  rent_amount: number;
  due_day: number;
  dueDateFormatted: string;
  daysRemaining: number;
  urgency: 'due_in_3_days' | 'due_today' | 'overdue' | 'upcoming';
  whatsappUrl: string;
  smsUrl: string;
  messageText: string;
}

export interface OverviewStats {
  monthlyRevenue: number;
  pendingDues: number;
  totalActiveUnits: number;
  flatsCount: number;
  shopsCount: number;
  unresolvedTickets: number;
  currentMonthName: string;
}
