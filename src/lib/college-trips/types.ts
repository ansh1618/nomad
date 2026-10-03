export interface StudentOfferSettings {
  id?: string;
  enabled: boolean;
  discount_percentage: number;
  maximum_discount_percentage: number;
  allow_coupon_stacking: boolean;
  verification_required: boolean;
  verification_validity_days: number;
  start_date?: string | null;
  end_date?: string | null;
  title: string;
  subheading?: string;
  description: string;
  terms: string;
  verification_requirements?: string;
  updated_at?: string;
}

export interface StudentOfferDestination {
  id: string;
  destination_id: string;
  is_eligible: boolean;
  display_order: number;
  custom_title?: string | null;
  custom_description?: string | null;
  custom_thumbnail_url?: string | null;
  // Joined fields
  destination?: {
    id: string;
    name: string;
    slug: string;
    hero_image?: string | null;
    description?: string | null;
  };
}

export interface StudentOfferPackage {
  id: string;
  package_id: string;
  is_eligible: boolean;
  override_global_discount: boolean;
  custom_discount_percentage?: number | null;
  is_active: boolean;
  display_order: number;
  // Joined fields
  package?: {
    id: string;
    name: string;
    slug: string;
    starting_price: number;
    destination_id: string;
    hero_banner?: string | null;
    destinations?: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

export type StudentVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED' | 'REVOKED';

export interface StudentVerification {
  id: string;
  user_id?: string | null;
  full_name: string;
  college_name: string;
  college_email?: string | null;
  email: string;
  phone?: string | null;
  student_id_number: string;
  course_program: string;
  graduation_year: number;
  status: StudentVerificationStatus;
  rejection_reason?: string | null;
  validity_days: number;
  verified_at?: string | null;
  expires_at?: string | null;
  reviewed_by?: string | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at?: string;
  documents?: StudentVerificationDocument[];
}

export interface StudentVerificationDocument {
  id: string;
  verification_id: string;
  document_type: 'ID_CARD' | 'ENROLLMENT_DOC' | 'COLLEGE_EMAIL_PROOF' | 'OTHER';
  file_path: string;
  file_name: string;
  file_size?: number | null;
  mime_type?: string | null;
  uploaded_at: string;
  signed_url?: string | null; // Ephemeral signed URL generated only for admin review
}

export interface StudentVerificationAuditLog {
  id: string;
  verification_id: string;
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'RESUBMISSION_REQUESTED' | 'REVOKED' | 'EXPIRED';
  performed_by?: string | null;
  performer_name?: string | null;
  details?: Record<string, any> | null;
  created_at: string;
}

export type CollegeTripQueryStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'QUOTED'
  | 'CONVERTED'
  | 'CLOSED'
  | 'LOST';

export interface CollegeTripQuery {
  id: string;
  student_name: string;
  college_name: string;
  email: string;
  phone: string;
  destination: string;
  preferred_travel_dates: string;
  number_of_students: number;
  year_semester: string;
  additional_requirements?: string | null;
  faculty_coordinator_name?: string | null;
  faculty_coordinator_contact?: string | null;
  group_type?: string | null;
  status: CollegeTripQueryStatus;
  assigned_to?: string | null;
  quotation_amount?: number | null;
  quotation_notes?: string | null;
  internal_notes?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CollegeTripsAnalytics {
  totalVerifications: number;
  verifiedCount: number;
  pendingCount: number;
  rejectedCount: number;
  approvalRate: number; // percentage 0-100
  totalQueries: number;
  convertedQueries: number;
  queryConversionRate: number; // percentage 0-100
  studentBookingsCount: number;
  studentBookingsRevenue: number;
  totalDiscountGiven: number;
  topDestinations: Array<{ name: string; count: number; bookings: number }>;
}
