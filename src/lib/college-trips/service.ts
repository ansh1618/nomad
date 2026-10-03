import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type {
  StudentOfferSettings,
  StudentOfferDestination,
  StudentOfferPackage,
  StudentVerification,
  StudentVerificationDocument,
  StudentVerificationStatus,
  CollegeTripQuery,
  CollegeTripQueryStatus,
  CollegeTripsAnalytics,
} from './types';

// Default configuration if DB is empty or fallback is active
export const DEFAULT_STUDENT_SETTINGS: StudentOfferSettings = {
  enabled: true,
  discount_percentage: 25,
  maximum_discount_percentage: 25,
  allow_coupon_stacking: false,
  verification_required: true,
  verification_validity_days: 365,
  title: 'COLLEGE TRIPS',
  subheading: 'Special prices for college students. Travel more. Pay less.',
  description:
    'Exclusive student offers on selected trips. Verified college students can unlock prices up to 25% below the regular trip price.',
  terms:
    'Student pricing is available only to verified college students. Verification may be required before booking. Student pricing applies only to eligible packages and travel dates. Student offers cannot be combined with other promotions unless explicitly allowed.',
  verification_requirements:
    'Upload a valid College ID Card or current enrollment document issued by an accredited institution.',
};

// ============================================================================
// 1. PROGRAM SETTINGS
// ============================================================================

export async function getStudentOfferSettings(): Promise<StudentOfferSettings> {
  try {
    // 1. Try dedicated table first
    const { data, error } = await supabase
      .from('student_offer_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        enabled: data.enabled ?? true,
        discount_percentage: Number(data.discount_percentage ?? 25),
        maximum_discount_percentage: Number(data.maximum_discount_percentage ?? 25),
        allow_coupon_stacking: data.allow_coupon_stacking ?? false,
        verification_required: data.verification_required ?? true,
        verification_validity_days: Number(data.verification_validity_days ?? 365),
        start_date: data.start_date,
        end_date: data.end_date,
        title: data.title || DEFAULT_STUDENT_SETTINGS.title,
        subheading: data.subheading || DEFAULT_STUDENT_SETTINGS.subheading,
        description: data.description || DEFAULT_STUDENT_SETTINGS.description,
        terms: data.terms || DEFAULT_STUDENT_SETTINGS.terms,
        verification_requirements:
          data.verification_requirements || DEFAULT_STUDENT_SETTINGS.verification_requirements,
        updated_at: data.updated_at,
      };
    }

    // 2. Fallback to site_settings table
    const { data: ssData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'student_offer_settings')
      .maybeSingle();

    if (ssData?.value) {
      try {
        const parsed = JSON.parse(ssData.value);
        return { ...DEFAULT_STUDENT_SETTINGS, ...parsed };
      } catch {}
    }
  } catch (err) {
    console.warn('[CollegeTrips] getStudentOfferSettings error, using defaults:', err);
  }

  return DEFAULT_STUDENT_SETTINGS;
}

export async function updateStudentOfferSettings(
  settings: Partial<StudentOfferSettings>
): Promise<StudentOfferSettings> {
  const current = await getStudentOfferSettings();
  const updated: StudentOfferSettings = {
    ...current,
    ...settings,
    updated_at: new Date().toISOString(),
  };

  try {
    // 1. Try dedicated table
    const { error: tableErr } = await supabaseAdmin
      .from('student_offer_settings')
      .upsert({
        id: current.id || '00000000-0000-0000-0000-000000000001',
        enabled: updated.enabled,
        discount_percentage: updated.discount_percentage,
        maximum_discount_percentage: updated.maximum_discount_percentage,
        allow_coupon_stacking: updated.allow_coupon_stacking,
        verification_required: updated.verification_required,
        verification_validity_days: updated.verification_validity_days,
        start_date: updated.start_date || null,
        end_date: updated.end_date || null,
        title: updated.title,
        subheading: updated.subheading,
        description: updated.description,
        terms: updated.terms,
        verification_requirements: updated.verification_requirements,
        updated_at: updated.updated_at,
      });

    if (tableErr) {
      console.warn('[CollegeTrips] Fallback saving settings to site_settings:', tableErr.message);
    }
  } catch (err) {
    console.warn('[CollegeTrips] Updating student_offer_settings table failed:', err);
  }

  // Also always persist to site_settings key for redundancy
  try {
    await supabaseAdmin
      .from('site_settings')
      .upsert({
        key: 'student_offer_settings',
        value: JSON.stringify(updated),
        description: 'Global configuration for College Student Travel Program',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });
  } catch (err) {
    console.error('[CollegeTrips] Error writing to site_settings:', err);
  }

  return updated;
}

// ============================================================================
// 2. ELIGIBLE DESTINATIONS
// ============================================================================

export async function getEligibleDestinations(): Promise<StudentOfferDestination[]> {
  try {
    // 1. Try dedicated table join
    const { data, error } = await supabase
      .from('student_offer_destinations')
      .select('*, destination:destinations(id, name, slug, hero_image, description)')
      .order('display_order', { ascending: true });

    if (!error && data && data.length > 0) {
      return data;
    }

    // 2. Fallback to site_settings
    const { data: ssData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'student_offer_destinations')
      .maybeSingle();

    if (ssData?.value) {
      const parsed = JSON.parse(ssData.value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[CollegeTrips] Error fetching eligible destinations:', err);
  }

  // 3. Fallback: dynamically load initial 3 destinations (Manali, Chopta, Jibhi) from destinations table
  try {
    const { data: dests } = await supabase
      .from('destinations')
      .select('id, name, slug, hero_image, description')
      .in('slug', ['manali', 'chopta', 'jibhi']);

    if (dests && dests.length > 0) {
      return dests.map((d, idx) => ({
        id: `dest-${d.id}`,
        destination_id: d.id,
        is_eligible: true,
        display_order: idx + 1,
        destination: d,
      }));
    }
  } catch {}

  return [];
}

export async function updateEligibleDestinations(
  destinationsList: StudentOfferDestination[]
): Promise<void> {
  // Try table upsert
  try {
    for (const d of destinationsList) {
      await supabaseAdmin.from('student_offer_destinations').upsert({
        destination_id: d.destination_id,
        is_eligible: d.is_eligible,
        display_order: d.display_order,
        custom_title: d.custom_title || null,
        custom_description: d.custom_description || null,
        custom_thumbnail_url: d.custom_thumbnail_url || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'destination_id' });
    }
  } catch (err) {
    console.warn('[CollegeTrips] table upsert for destinations warning:', err);
  }

  // Always mirror to site_settings for failover safety
  try {
    await supabaseAdmin
      .from('site_settings')
      .upsert({
        key: 'student_offer_destinations',
        value: JSON.stringify(destinationsList),
        description: 'Eligible destinations for College Student Program',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });
  } catch (err) {
    console.error('[CollegeTrips] Error writing destinations to site_settings:', err);
  }
}

// ============================================================================
// 3. ELIGIBLE PACKAGES
// ============================================================================

export async function getEligiblePackages(): Promise<StudentOfferPackage[]> {
  try {
    // 1. Try dedicated table join
    const { data, error } = await supabase
      .from('student_offer_packages')
      .select('*, package:journeys(id, name, slug, starting_price, destination_id, hero_banner, destinations(id, name, slug))')
      .order('display_order', { ascending: true });

    if (!error && data && data.length > 0) {
      return data;
    }

    // 2. Fallback to site_settings
    const { data: ssData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'student_offer_packages')
      .maybeSingle();

    if (ssData?.value) {
      const parsed = JSON.parse(ssData.value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[CollegeTrips] Error fetching eligible packages:', err);
  }

  // 3. Fallback: discover packages for initial destinations
  try {
    const { data: pkgs } = await supabase
      .from('journeys')
      .select('id, name, slug, starting_price, destination_id, hero_banner, destinations(id, name, slug)')
      .in('slug', ['manali-weekend', 'chopta-tungnath-trek', 'jibhi-retreat', 'manali-quick'])
      .eq('is_published', true);

    if (pkgs && pkgs.length > 0) {
      return pkgs.map((p, idx) => ({
        id: `pkg-${p.id}`,
        package_id: p.id,
        is_eligible: true,
        override_global_discount: false,
        custom_discount_percentage: null,
        is_active: true,
        display_order: idx + 1,
        package: p as any,
      }));
    }
  } catch {}

  return [];
}

export async function updateEligiblePackages(
  packagesList: StudentOfferPackage[]
): Promise<void> {
  try {
    for (const p of packagesList) {
      await supabaseAdmin.from('student_offer_packages').upsert({
        package_id: p.package_id,
        is_eligible: p.is_eligible,
        override_global_discount: p.override_global_discount,
        custom_discount_percentage: p.custom_discount_percentage ?? null,
        is_active: p.is_active,
        display_order: p.display_order,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'package_id' });
    }
  } catch (err) {
    console.warn('[CollegeTrips] table upsert for packages warning:', err);
  }

  // Always mirror to site_settings
  try {
    await supabaseAdmin
      .from('site_settings')
      .upsert({
        key: 'student_offer_packages',
        value: JSON.stringify(packagesList),
        description: 'Eligible packages for College Student Program',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });
  } catch (err) {
    console.error('[CollegeTrips] Error writing packages to site_settings:', err);
  }
}

// ============================================================================
// 4. STUDENT VERIFICATION WORKFLOW
// ============================================================================

export async function getUserStudentVerification(
  userId?: string | null,
  email?: string | null
): Promise<StudentVerification | null> {
  if (!userId && !email) return null;

  try {
    // 1. Try student_verifications table
    let query = supabaseAdmin.from('student_verifications').select('*');
    if (userId) {
      query = query.or(`user_id.eq.${userId},email.eq.${email || ''}`);
    } else if (email) {
      query = query.eq('email', email);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      // Check if verified status has expired
      let status: StudentVerificationStatus = data.status;
      if (status === 'VERIFIED' && data.expires_at) {
        if (new Date(data.expires_at) < new Date()) {
          status = 'EXPIRED';
        }
      }

      // Fetch docs
      const { data: docs } = await supabaseAdmin
        .from('student_verification_documents')
        .select('*')
        .eq('verification_id', data.id);

      return {
        ...data,
        status,
        documents: docs || [],
      };
    }

    // 2. Fallback to site_settings store
    const { data: ssData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'college_verifications')
      .maybeSingle();

    if (ssData?.value) {
      const verifications: StudentVerification[] = JSON.parse(ssData.value);
      const matched = verifications.find(
        (v) => (userId && v.user_id === userId) || (email && v.email.toLowerCase() === email.toLowerCase())
      );
      if (matched) {
        if (matched.status === 'VERIFIED' && matched.expires_at && new Date(matched.expires_at) < new Date()) {
          return { ...matched, status: 'EXPIRED' };
        }
        return matched;
      }
    }
  } catch (err) {
    console.warn('[CollegeTrips] Error getting student verification:', err);
  }

  return null;
}

export async function submitStudentVerification(payload: {
  userId?: string | null;
  fullName: string;
  collegeName: string;
  collegeEmail?: string | null;
  email: string;
  phone?: string | null;
  studentIdNumber: string;
  courseProgram: string;
  graduationYear: number;
  documents: Array<{
    documentType: 'ID_CARD' | 'ENROLLMENT_DOC' | 'COLLEGE_EMAIL_PROOF' | 'OTHER';
    filePath: string;
    fileName: string;
    fileSize?: number;
    mimeType?: string;
  }>;
}): Promise<{ success: boolean; verificationId: string; message: string }> {
  const verificationId = `verif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const verificationRecord: StudentVerification = {
    id: verificationId,
    user_id: payload.userId || null,
    full_name: payload.fullName.trim(),
    college_name: payload.collegeName.trim(),
    college_email: payload.collegeEmail?.trim() || null,
    email: payload.email.trim().toLowerCase(),
    phone: payload.phone?.trim() || null,
    student_id_number: payload.studentIdNumber.trim(),
    course_program: payload.courseProgram.trim(),
    graduation_year: Number(payload.graduationYear),
    status: 'PENDING',
    validity_days: 365,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    documents: payload.documents.map((d, idx) => ({
      id: `doc-${verificationId}-${idx}`,
      verification_id: verificationId,
      document_type: d.documentType,
      file_path: d.filePath,
      file_name: d.fileName,
      file_size: d.fileSize || null,
      mime_type: d.mimeType || null,
      uploaded_at: new Date().toISOString(),
    })),
  };

  try {
    // 1. Try insert into table
    const { data: inserted, error: insErr } = await supabaseAdmin
      .from('student_verifications')
      .insert({
        user_id: payload.userId || null,
        full_name: verificationRecord.full_name,
        college_name: verificationRecord.college_name,
        college_email: verificationRecord.college_email,
        email: verificationRecord.email,
        phone: verificationRecord.phone,
        student_id_number: verificationRecord.student_id_number,
        course_program: verificationRecord.course_program,
        graduation_year: verificationRecord.graduation_year,
        status: 'PENDING',
        validity_days: 365,
        created_at: verificationRecord.created_at,
        updated_at: verificationRecord.updated_at,
      })
      .select('id')
      .single();

    if (!insErr && inserted?.id) {
      const realId = inserted.id;
      // Insert docs
      if (payload.documents.length > 0) {
        await supabaseAdmin.from('student_verification_documents').insert(
          payload.documents.map((d) => ({
            verification_id: realId,
            document_type: d.documentType,
            file_path: d.filePath,
            file_name: d.fileName,
            file_size: d.fileSize || null,
            mime_type: d.mimeType || null,
          }))
        );
      }

      // Insert audit log
      await supabaseAdmin.from('student_verification_audit_logs').insert({
        verification_id: realId,
        action: 'SUBMITTED',
        performed_by: payload.userId || null,
        performer_name: payload.fullName,
        details: { email: payload.email, college: payload.collegeName },
      });

      return {
        success: true,
        verificationId: realId,
        message: 'Your student verification is under review.',
      };
    }
  } catch (err) {
    console.warn('[CollegeTrips] Table insert error, writing to fallback site_settings:', err);
  }

  // 2. Fallback site_settings persistence
  try {
    const { data: ssData } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'college_verifications')
      .maybeSingle();

    let list: StudentVerification[] = [];
    if (ssData?.value) {
      try {
        list = JSON.parse(ssData.value);
      } catch {}
    }

    // Replace previous verification for this email/user if exists or prepend
    list = list.filter((v) => v.email.toLowerCase() !== payload.email.toLowerCase());
    list.unshift(verificationRecord);

    await supabaseAdmin
      .from('site_settings')
      .upsert({
        key: 'college_verifications',
        value: JSON.stringify(list),
        description: 'Student verifications store',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    return {
      success: true,
      verificationId: verificationRecord.id,
      message: 'Your student verification is under review.',
    };
  } catch (err: any) {
    console.error('[CollegeTrips] Error saving student verification:', err);
    throw new Error(err.message || 'Failed to submit verification');
  }
}

export async function getAllStudentVerifications(): Promise<StudentVerification[]> {
  try {
    // 1. Try table
    const { data, error } = await supabaseAdmin
      .from('student_verifications')
      .select('*, documents:student_verification_documents(*)')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data;
    }

    // 2. Fallback
    const { data: ssData } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'college_verifications')
      .maybeSingle();

    if (ssData?.value) {
      const parsed = JSON.parse(ssData.value);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('[CollegeTrips] Error fetching all verifications:', err);
  }

  return [];
}

export async function reviewStudentVerification(params: {
  verificationId: string;
  action: 'APPROVE' | 'REJECT' | 'REQUEST_RESUBMISSION' | 'REVOKE';
  validityDays?: number;
  rejectionReason?: string;
  reviewerId?: string;
  reviewerName?: string;
}): Promise<void> {
  const { verificationId, action, validityDays = 365, rejectionReason, reviewerId, reviewerName } = params;

  let newStatus: StudentVerificationStatus = 'PENDING';
  let expiresAt: string | null = null;
  let verifiedAt: string | null = null;

  if (action === 'APPROVE') {
    newStatus = 'VERIFIED';
    verifiedAt = new Date().toISOString();
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + validityDays);
    expiresAt = expiry.toISOString();
  } else if (action === 'REJECT') {
    newStatus = 'REJECTED';
  } else if (action === 'REQUEST_RESUBMISSION') {
    newStatus = 'REJECTED';
  } else if (action === 'REVOKE') {
    newStatus = 'REVOKED';
  }

  // 1. Try table update
  try {
    const { error: updErr } = await supabaseAdmin
      .from('student_verifications')
      .update({
        status: newStatus,
        validity_days: validityDays,
        verified_at: verifiedAt,
        expires_at: expiresAt,
        rejection_reason: rejectionReason || null,
        reviewed_by: reviewerId || null,
        reviewed_by_name: reviewerName || 'Admin Reviewer',
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', verificationId);

    if (!updErr) {
      await supabaseAdmin.from('student_verification_audit_logs').insert({
        verification_id: verificationId,
        action: action === 'APPROVE' ? 'APPROVED' : action === 'REVOKE' ? 'REVOKED' : 'REJECTED',
        performed_by: reviewerId || null,
        performer_name: reviewerName || 'Admin Reviewer',
        details: { action, validityDays, rejectionReason },
      });
    }
  } catch (err) {
    console.warn('[CollegeTrips] review table update warning:', err);
  }

  // 2. Also update fallback site_settings
  try {
    const { data: ssData } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'college_verifications')
      .maybeSingle();

    if (ssData?.value) {
      const list: StudentVerification[] = JSON.parse(ssData.value);
      const idx = list.findIndex((v) => v.id === verificationId);
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          status: newStatus,
          validity_days: validityDays,
          verified_at: verifiedAt,
          expires_at: expiresAt,
          rejection_reason: rejectionReason || null,
          reviewed_by: reviewerId || null,
          reviewed_by_name: reviewerName || 'Admin Reviewer',
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await supabaseAdmin
          .from('site_settings')
          .upsert({
            key: 'college_verifications',
            value: JSON.stringify(list),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'key' });
      }
    }
  } catch (err) {
    console.error('[CollegeTrips] Error updating fallback verification:', err);
  }
}

// Generate ephemeral signed URL for admin review of sensitive proof
export async function getStudentDocumentSignedUrl(filePath: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from('student_documents')
      .createSignedUrl(filePath, 3600); // 1 hour access

    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }
  } catch (err) {
    console.warn('[CollegeTrips] Signed URL error for', filePath, err);
  }
  return null;
}

// ============================================================================
// 5. COLLEGE TRIP QUERIES / LEADS
// ============================================================================

export async function submitCollegeTripQuery(
  data: Omit<CollegeTripQuery, 'id' | 'status' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; id: string; message: string }> {
  const queryId = `lead-${Date.now()}`;
  const now = new Date().toISOString();

  const record: CollegeTripQuery = {
    ...data,
    id: queryId,
    status: 'NEW',
    created_at: now,
    updated_at: now,
  };

  // 1. Try table insert
  try {
    const { data: insData, error: insErr } = await supabaseAdmin
      .from('college_trip_queries')
      .insert({
        student_name: data.student_name,
        college_name: data.college_name,
        email: data.email,
        phone: data.phone,
        destination: data.destination,
        preferred_travel_dates: data.preferred_travel_dates,
        number_of_students: Number(data.number_of_students),
        year_semester: data.year_semester,
        additional_requirements: data.additional_requirements || null,
        faculty_coordinator_name: data.faculty_coordinator_name || null,
        faculty_coordinator_contact: data.faculty_coordinator_contact || null,
        group_type: data.group_type || null,
        status: 'NEW',
        created_at: now,
        updated_at: now,
      })
      .select('id')
      .single();

    if (!insErr && insData?.id) {
      return {
        success: true,
        id: insData.id,
        message: 'Your college trip request has been received. Our team will contact you shortly.',
      };
    }
  } catch (err) {
    console.warn('[CollegeTrips] Table insert error for query, fallback to inquiries/site_settings:', err);
  }

  // 2. Also mirror into existing inquiries table with source = "COLLEGE_QUERY"
  try {
    await supabaseAdmin.from('inquiries').insert({
      full_name: data.student_name,
      email: data.email,
      phone: data.phone,
      destination: data.destination,
      journey: `College Group (${data.college_name})`,
      travel_date: data.preferred_travel_dates,
      travellers: Number(data.number_of_students),
      message: `[College Trip Query]\nCollege: ${data.college_name}\nYear: ${data.year_semester}\nFaculty: ${data.faculty_coordinator_name || 'N/A'}\nNotes: ${data.additional_requirements || 'None'}`,
      source: 'COLLEGE_QUERY',
      status: 'NEW',
    });
  } catch {}

  // 3. Fallback site_settings
  try {
    const { data: ssData } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'college_trip_queries')
      .maybeSingle();

    let list: CollegeTripQuery[] = [];
    if (ssData?.value) {
      try {
        list = JSON.parse(ssData.value);
      } catch {}
    }
    list.unshift(record);

    await supabaseAdmin
      .from('site_settings')
      .upsert({
        key: 'college_trip_queries',
        value: JSON.stringify(list),
        description: 'College Trip queries store',
        updated_at: now,
      }, { onConflict: 'key' });
  } catch (err) {
    console.error('[CollegeTrips] Fallback queries error:', err);
  }

  return {
    success: true,
    id: queryId,
    message: 'Your college trip request has been received. Our team will contact you shortly.',
  };
}

export async function getCollegeTripQueries(): Promise<CollegeTripQuery[]> {
  try {
    // 1. Try table
    const { data, error } = await supabaseAdmin
      .from('college_trip_queries')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data;
    }

    // 2. Fallback site_settings
    const { data: ssData } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'college_trip_queries')
      .maybeSingle();

    if (ssData?.value) {
      const parsed = JSON.parse(ssData.value);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }

    // 3. Also check inquiries table for source = "COLLEGE_QUERY"
    const { data: inqData } = await supabaseAdmin
      .from('inquiries')
      .select('*')
      .eq('source', 'COLLEGE_QUERY')
      .order('created_at', { ascending: false });

    if (inqData && inqData.length > 0) {
      return inqData.map((iq) => ({
        id: iq.id,
        student_name: iq.full_name || 'Student Explorer',
        college_name: iq.journey?.replace('College Group (', '').replace(')', '') || 'Campus',
        email: iq.email || '',
        phone: iq.phone || '',
        destination: iq.destination || 'Unspecified',
        preferred_travel_dates: iq.travel_date || 'Flexible',
        number_of_students: iq.travellers || 15,
        year_semester: 'Undergrad',
        additional_requirements: iq.message || '',
        status: (iq.status as CollegeTripQueryStatus) || 'NEW',
        internal_notes: iq.notes || null,
        created_at: iq.created_at,
        updated_at: iq.updated_at,
      }));
    }
  } catch (err) {
    console.warn('[CollegeTrips] Error fetching queries:', err);
  }

  return [];
}

export async function updateCollegeTripQuery(
  id: string,
  update: Partial<CollegeTripQuery>
): Promise<void> {
  const now = new Date().toISOString();

  try {
    await supabaseAdmin
      .from('college_trip_queries')
      .update({ ...update, updated_at: now })
      .eq('id', id);
  } catch {}

  // Fallback update in site_settings
  try {
    const { data: ssData } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'college_trip_queries')
      .maybeSingle();

    if (ssData?.value) {
      const list: CollegeTripQuery[] = JSON.parse(ssData.value);
      const idx = list.findIndex((q) => q.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...update, updated_at: now };
        await supabaseAdmin
          .from('site_settings')
          .upsert({
            key: 'college_trip_queries',
            value: JSON.stringify(list),
            updated_at: now,
          }, { onConflict: 'key' });
      }
    }
  } catch {}
}

// ============================================================================
// 6. REAL ANALYTICS
// ============================================================================

export async function getCollegeTripsAnalytics(): Promise<CollegeTripsAnalytics> {
  const [verifications, queries, settings] = await Promise.all([
    getAllStudentVerifications(),
    getCollegeTripQueries(),
    getStudentOfferSettings(),
  ]);

  const totalVerifs = verifications.length;
  const verifiedCount = verifications.filter((v) => v.status === 'VERIFIED').length;
  const pendingCount = verifications.filter((v) => v.status === 'PENDING').length;
  const rejectedCount = verifications.filter((v) => v.status === 'REJECTED').length;
  const approvalRate = totalVerifs > 0 ? Math.round((verifiedCount / totalVerifs) * 100) : 0;

  const totalQueries = queries.length;
  const convertedQueries = queries.filter((q) => q.status === 'CONVERTED').length;
  const conversionRate = totalQueries > 0 ? Math.round((convertedQueries / totalQueries) * 100) : 0;

  // Real bookings analytics: check redemptions table or bookings with student verification
  let studentBookingsCount = 0;
  let studentBookingsRevenue = 0;
  let totalDiscountGiven = 0;

  try {
    const { data: redemptions } = await supabaseAdmin
      .from('student_offer_redemptions')
      .select('*');

    if (redemptions && redemptions.length > 0) {
      studentBookingsCount = redemptions.length;
      studentBookingsRevenue = redemptions.reduce((acc, r) => acc + Number(r.student_price || 0), 0);
      totalDiscountGiven = redemptions.reduce((acc, r) => acc + Number(r.discount_amount || 0), 0);
    } else {
      // Check bookings with coupon_code = "STUDENT" or notes indicating student offer
      const { data: bookings } = await supabaseAdmin
        .from('bookings')
        .select('id, amount, total_amount, discount_amount, coupon_code, notes')
        .or('coupon_code.ilike.%STUDENT%,notes.ilike.%student%');

      if (bookings && bookings.length > 0) {
        studentBookingsCount = bookings.length;
        studentBookingsRevenue = bookings.reduce((acc, b) => acc + Number(b.total_amount || b.amount || 0), 0);
        totalDiscountGiven = bookings.reduce((acc, b) => acc + Number(b.discount_amount || 0), 0);
      }
    }
  } catch (err) {
    console.warn('[CollegeTrips] Redemptions query warning:', err);
  }

  // Top destination aggregation
  const destCounts: Record<string, { count: number; bookings: number }> = {};
  queries.forEach((q) => {
    const d = q.destination || 'Other';
    if (!destCounts[d]) destCounts[d] = { count: 0, bookings: 0 };
    destCounts[d].count += 1;
    if (q.status === 'CONVERTED') destCounts[d].bookings += 1;
  });

  const topDestinations = Object.entries(destCounts)
    .map(([name, data]) => ({ name, count: data.count, bookings: data.bookings }))
    .sort((a, b) => b.count - a.count);

  return {
    totalVerifications: totalVerifs,
    verifiedCount,
    pendingCount,
    rejectedCount,
    approvalRate,
    totalQueries,
    convertedQueries,
    queryConversionRate: conversionRate,
    studentBookingsCount,
    studentBookingsRevenue,
    totalDiscountGiven,
    topDestinations,
  };
}
