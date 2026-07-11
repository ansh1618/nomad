/**
 * use-booking-flow.tsx
 *
 * Global state management for the 4-step booking flow.
 * Uses React Context so state persists when navigating between steps.
 *
 * Steps:
 *  1 → Select departure date
 *  2 → Personal details + file uploads
 *  3 → Solo or Group/Couple traveler type
 *  4 → Room sharing, coupon, payment schedule, terms
 */

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RoomSharing = "Double" | "Triple" | "Quad";
export type PaymentSchedule = "Full Payment" | "Book Slot";
export type Gender = "Male" | "Female" | "Other" | "Prefer not to say";
export type HeardFrom =
  | "Instagram"
  | "YouTube"
  | "Google"
  | "Friend"
  | "WhatsApp"
  | "Other";

export interface BookingState {
  // ── Meta ──────────────────────────────────────────────────
  currentStep: 1 | 2 | 3 | 4;
  tripId: string | null;
  tripTitle: string | null;

  // ── Step 1: Date ──────────────────────────────────────────
  tripDateId: string | null;         // UUID from trip_dates table
  departureDate: string | null;      // ISO date string
  isCustomDate: boolean;

  // ── Step 2: Personal Info ──────────────────────────────────
  fullName: string;
  email: string;
  phone: string;
  whatsappSame: boolean;
  whatsappNumber: string;
  address: string;
  age: string;
  gender: Gender | "";
  guardianNumber: string;

  // File upload state (actual File objects for upload, URLs after upload)
  aadharFile: File | null;
  profileFile: File | null;
  aadharUrl: string | null;          // Supabase Storage signed URL
  profileUrl: string | null;

  // Marketing
  referredBy: string;                // Team member name
  heardFrom: HeardFrom | "";

  // ── Step 3: Traveler Type ──────────────────────────────────
  isSolo: boolean;

  // ── Step 4: Pricing & Payment ──────────────────────────────
  roomSharing: RoomSharing;
  couponCode: string;
  appliedCouponId: string | null;
  discountAmount: number;

  baseAmount: number;                // From trip pricing
  totalPayable: number;              // After discount

  paymentSchedule: PaymentSchedule;
  depositAmount: number;             // For "Book Slot" mode
  balanceDue: number;

  specialRequests: string;
  termsAccepted: boolean;

  // ── Result ────────────────────────────────────────────────
  bookingRef: string | null;         // NM-2026-0001 (after submission)
  isSubmitting: boolean;
  error: string | null;
}

const initialState: BookingState = {
  currentStep: 1,
  tripId: null,
  tripTitle: null,

  tripDateId: null,
  departureDate: null,
  isCustomDate: false,

  fullName: "",
  email: "",
  phone: "",
  whatsappSame: true,
  whatsappNumber: "",
  address: "",
  age: "",
  gender: "",
  guardianNumber: "",
  aadharFile: null,
  profileFile: null,
  aadharUrl: null,
  profileUrl: null,
  referredBy: "",
  heardFrom: "",

  isSolo: false,

  roomSharing: "Triple",
  couponCode: "",
  appliedCouponId: null,
  discountAmount: 0,
  baseAmount: 0,
  totalPayable: 0,
  paymentSchedule: "Full Payment",
  depositAmount: 0,
  balanceDue: 0,
  specialRequests: "",
  termsAccepted: false,

  bookingRef: null,
  isSubmitting: false,
  error: null,
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type BookingAction =
  | { type: "SET_TRIP"; tripId: string; tripTitle: string; baseAmount: number }
  | { type: "SET_STEP"; step: 1 | 2 | 3 | 4 }
  | { type: "SET_DATE"; tripDateId: string | null; departureDate: string; isCustomDate: boolean }
  | { type: "SET_PERSONAL"; payload: Partial<Pick<BookingState,
      "fullName" | "email" | "phone" | "whatsappSame" | "whatsappNumber"
      | "address" | "age" | "gender" | "guardianNumber"
      | "referredBy" | "heardFrom"
    >> }
  | { type: "SET_AADHAR_FILE"; file: File | null }
  | { type: "SET_PROFILE_FILE"; file: File | null }
  | { type: "SET_UPLOAD_URLS"; aadharUrl: string | null; profileUrl: string | null }
  | { type: "SET_SOLO"; isSolo: boolean }
  | { type: "SET_ROOM_SHARING"; roomSharing: RoomSharing }
  | { type: "SET_COUPON"; couponCode: string; couponId: string | null; discountAmount: number }
  | { type: "CLEAR_COUPON" }
  | { type: "SET_PAYMENT_SCHEDULE"; schedule: PaymentSchedule; depositAmount: number }
  | { type: "SET_SPECIAL_REQUESTS"; text: string }
  | { type: "SET_TERMS"; accepted: boolean }
  | { type: "SET_SUBMITTING"; isSubmitting: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_BOOKING_REF"; ref: string }
  | { type: "RESET" };

function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case "SET_TRIP":
      return {
        ...state,
        tripId: action.tripId,
        tripTitle: action.tripTitle,
        baseAmount: action.baseAmount,
        totalPayable: action.baseAmount,
      };

    case "SET_STEP":
      return { ...state, currentStep: action.step };

    case "SET_DATE":
      return {
        ...state,
        tripDateId: action.tripDateId,
        departureDate: action.departureDate,
        isCustomDate: action.isCustomDate,
      };

    case "SET_PERSONAL":
      return { ...state, ...action.payload };

    case "SET_AADHAR_FILE":
      return { ...state, aadharFile: action.file };

    case "SET_PROFILE_FILE":
      return { ...state, profileFile: action.file };

    case "SET_UPLOAD_URLS":
      return {
        ...state,
        aadharUrl: action.aadharUrl,
        profileUrl: action.profileUrl,
      };

    case "SET_SOLO":
      return { ...state, isSolo: action.isSolo };

    case "SET_ROOM_SHARING": {
      // Recalculate total after discount
      const newTotal = Math.max(0, state.baseAmount - state.discountAmount);
      return {
        ...state,
        roomSharing: action.roomSharing,
        totalPayable: newTotal,
        balanceDue: newTotal - state.depositAmount,
      };
    }

    case "SET_COUPON": {
      const newTotal = Math.max(0, state.baseAmount - action.discountAmount);
      return {
        ...state,
        couponCode: action.couponCode,
        appliedCouponId: action.couponId,
        discountAmount: action.discountAmount,
        totalPayable: newTotal,
        balanceDue: newTotal - state.depositAmount,
      };
    }

    case "CLEAR_COUPON": {
      return {
        ...state,
        couponCode: "",
        appliedCouponId: null,
        discountAmount: 0,
        totalPayable: state.baseAmount,
        balanceDue: state.baseAmount - state.depositAmount,
      };
    }

    case "SET_PAYMENT_SCHEDULE": {
      const isDeposit = action.schedule === "Book Slot";
      return {
        ...state,
        paymentSchedule: action.schedule,
        depositAmount: isDeposit ? action.depositAmount : state.totalPayable,
        balanceDue: isDeposit ? state.totalPayable - action.depositAmount : 0,
      };
    }

    case "SET_SPECIAL_REQUESTS":
      return { ...state, specialRequests: action.text };

    case "SET_TERMS":
      return { ...state, termsAccepted: action.accepted };

    case "SET_SUBMITTING":
      return { ...state, isSubmitting: action.isSubmitting, error: null };

    case "SET_ERROR":
      return { ...state, error: action.error, isSubmitting: false };

    case "SET_BOOKING_REF":
      return { ...state, bookingRef: action.ref, isSubmitting: false };

    case "RESET":
      return { ...initialState };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface BookingContextValue {
  state: BookingState;
  setTrip: (tripId: string, tripTitle: string, baseAmount: number) => void;
  goToStep: (step: 1 | 2 | 3 | 4) => void;
  nextStep: () => void;
  prevStep: () => void;
  setDate: (tripDateId: string | null, departureDate: string, isCustomDate?: boolean) => void;
  setPersonal: (payload: Parameters<typeof bookingReducer>[1] extends { type: "SET_PERSONAL"; payload: infer P } ? P : never) => void;
  setAadharFile: (file: File | null) => void;
  setProfileFile: (file: File | null) => void;
  setUploadUrls: (aadharUrl: string | null, profileUrl: string | null) => void;
  setSolo: (isSolo: boolean) => void;
  setRoomSharing: (type: RoomSharing) => void;
  setCoupon: (code: string, id: string | null, discount: number) => void;
  clearCoupon: () => void;
  setPaymentSchedule: (schedule: PaymentSchedule, depositAmount: number) => void;
  setSpecialRequests: (text: string) => void;
  setTerms: (accepted: boolean) => void;
  setSubmitting: (v: boolean) => void;
  setError: (msg: string | null) => void;
  setBookingRef: (ref: string) => void;
  reset: () => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function BookingFlowProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bookingReducer, initialState);

  const setTrip = useCallback(
    (tripId: string, tripTitle: string, baseAmount: number) =>
      dispatch({ type: "SET_TRIP", tripId, tripTitle, baseAmount }),
    []
  );

  const goToStep = useCallback(
    (step: 1 | 2 | 3 | 4) => dispatch({ type: "SET_STEP", step }),
    []
  );

  const nextStep = useCallback(() => {
    const next = Math.min(4, state.currentStep + 1) as 1 | 2 | 3 | 4;
    dispatch({ type: "SET_STEP", step: next });
  }, [state.currentStep]);

  const prevStep = useCallback(() => {
    const prev = Math.max(1, state.currentStep - 1) as 1 | 2 | 3 | 4;
    dispatch({ type: "SET_STEP", step: prev });
  }, [state.currentStep]);

  const setDate = useCallback(
    (tripDateId: string | null, departureDate: string, isCustomDate = false) =>
      dispatch({ type: "SET_DATE", tripDateId, departureDate, isCustomDate }),
    []
  );

  const setPersonal = useCallback(
    (payload: any) => dispatch({ type: "SET_PERSONAL", payload }),
    []
  );

  const setAadharFile = useCallback(
    (file: File | null) => dispatch({ type: "SET_AADHAR_FILE", file }),
    []
  );

  const setProfileFile = useCallback(
    (file: File | null) => dispatch({ type: "SET_PROFILE_FILE", file }),
    []
  );

  const setUploadUrls = useCallback(
    (aadharUrl: string | null, profileUrl: string | null) =>
      dispatch({ type: "SET_UPLOAD_URLS", aadharUrl, profileUrl }),
    []
  );

  const setSolo = useCallback(
    (isSolo: boolean) => dispatch({ type: "SET_SOLO", isSolo }),
    []
  );

  const setRoomSharing = useCallback(
    (roomSharing: RoomSharing) => dispatch({ type: "SET_ROOM_SHARING", roomSharing }),
    []
  );

  const setCoupon = useCallback(
    (couponCode: string, couponId: string | null, discountAmount: number) =>
      dispatch({ type: "SET_COUPON", couponCode, couponId, discountAmount }),
    []
  );

  const clearCoupon = useCallback(() => dispatch({ type: "CLEAR_COUPON" }), []);

  const setPaymentSchedule = useCallback(
    (schedule: PaymentSchedule, depositAmount: number) =>
      dispatch({ type: "SET_PAYMENT_SCHEDULE", schedule, depositAmount }),
    []
  );

  const setSpecialRequests = useCallback(
    (text: string) => dispatch({ type: "SET_SPECIAL_REQUESTS", text }),
    []
  );

  const setTerms = useCallback(
    (accepted: boolean) => dispatch({ type: "SET_TERMS", accepted }),
    []
  );

  const setSubmitting = useCallback(
    (isSubmitting: boolean) => dispatch({ type: "SET_SUBMITTING", isSubmitting }),
    []
  );

  const setError = useCallback(
    (error: string | null) => dispatch({ type: "SET_ERROR", error }),
    []
  );

  const setBookingRef = useCallback(
    (ref: string) => dispatch({ type: "SET_BOOKING_REF", ref }),
    []
  );

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return (
    <BookingContext.Provider
      value={{
        state,
        setTrip,
        goToStep,
        nextStep,
        prevStep,
        setDate,
        setPersonal,
        setAadharFile,
        setProfileFile,
        setUploadUrls,
        setSolo,
        setRoomSharing,
        setCoupon,
        clearCoupon,
        setPaymentSchedule,
        setSpecialRequests,
        setTerms,
        setSubmitting,
        setError,
        setBookingRef,
        reset,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBookingFlow(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) {
    throw new Error("useBookingFlow must be used inside <BookingFlowProvider>");
  }
  return ctx;
}
