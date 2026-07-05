import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

import { TravellerDetailsStep } from "./TravellerDetailsStep";
import { TransportSelectionStep } from "./TransportSelectionStep";
import { AccommodationSelectionStep } from "./AccommodationSelectionStep";
import { AddonsAndCouponsStep } from "./AddonsAndCouponsStep";
import { ReviewSummaryStep } from "./ReviewSummaryStep";
import { PaymentStep } from "./PaymentStep";
import { SuccessConfirmationStep } from "./SuccessConfirmationStep";

// Context or simple state for the wizard
export type BookingState = {
  departureId: string | null;
  travellers: any[];
  selectedSeats: string[];
  selectedRooms: string[];
  addons: string[];
  coupon: any | null;
  baseAmount: number;
  totalAmount: number;
};

const STEPS = [
  "Traveller Details",
  "Transport",
  "Accommodation",
  "Add-ons",
  "Review",
  "Payment",
  "Confirmation"
];

export function BookingWizard({ journey, departures }: { journey: any; departures: any[] }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [bookingData, setBookingData] = useState<BookingState>({
    departureId: departures[0]?.id || null,
    travellers: [],
    selectedSeats: [],
    selectedRooms: [],
    addons: [],
    coupon: null,
    baseAmount: departures[0]?.basePrice || 0,
    totalAmount: departures[0]?.basePrice || 0,
  });

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  return (
    <div className="max-w-7xl mx-auto px-5 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
      
      {/* LEFT CONTENT: Stepper & Form */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/journeys/$journeyId" params={{ journeyId: journey.slug }} className="p-2 bg-white rounded-full shadow-sm hover:bg-muted transition">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-primary">Secure Your Journey</h1>
            <p className="text-sm text-muted-foreground">{journey.name} • {journey.duration}</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-border flex justify-between items-center overflow-x-auto">
          {STEPS.map((step, index) => {
            const isActive = index === currentStep;
            const isPast = index < currentStep;
            return (
              <div key={step} className="flex items-center shrink-0">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors ${isActive ? "bg-accent text-white ring-4 ring-accent/20" : isPast ? "bg-secondary text-white" : "bg-muted text-muted-foreground"}`}>
                  {isPast ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span className={`ml-3 text-xs font-poppins font-semibold uppercase tracking-wider ${isActive ? "text-primary" : isPast ? "text-secondary" : "text-muted-foreground hidden sm:inline-block"}`}>
                  {step}
                </span>
                {index < STEPS.length - 1 && (
                  <div className={`w-8 sm:w-12 h-[2px] mx-2 sm:mx-4 ${isPast ? "bg-secondary" : "bg-muted"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Form Container */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-border min-h-[400px]">
          {currentStep === 0 && <TravellerDetailsStep data={bookingData} updateData={setBookingData} onNext={nextStep} />}
          {currentStep === 1 && <TransportSelectionStep data={bookingData} updateData={setBookingData} onNext={nextStep} onPrev={prevStep} />}
          {currentStep === 2 && <AccommodationSelectionStep data={bookingData} updateData={setBookingData} onNext={nextStep} onPrev={prevStep} />}
          {currentStep === 3 && <AddonsAndCouponsStep data={bookingData} updateData={setBookingData} onNext={nextStep} onPrev={prevStep} />}
          {currentStep === 4 && <ReviewSummaryStep data={bookingData} updateData={setBookingData} onNext={nextStep} onPrev={prevStep} journey={journey} />}
          {currentStep === 5 && <PaymentStep data={bookingData} updateData={setBookingData} onNext={nextStep} onPrev={prevStep} />}
          {currentStep === 6 && <SuccessConfirmationStep data={bookingData} journey={journey} />}
        </div>
      </div>

      {/* RIGHT CONTENT: Sticky Summary */}
      <div className="lg:col-span-4 space-y-6">
        <div className="sticky top-24 bg-primary text-white p-6 rounded-3xl shadow-elegant space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Booking Summary</span>
            <h3 className="text-xl font-display font-bold">{journey.name}</h3>
          </div>
          
          <div className="space-y-3 pt-4 border-t border-white/10 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-white/70">Travellers</span>
              <span className="font-semibold">{Math.max(bookingData.travellers.length, 1)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70">Departure</span>
              <span className="font-semibold">
                {departures.find(d => d.id === bookingData.departureId)?.date || "Not selected"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70">Seats</span>
              <span className="font-semibold">{bookingData.selectedSeats.length || "-"}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <div className="flex justify-between items-end">
              <span className="text-xs text-white/70">Total Amount</span>
              <span className="text-2xl font-display font-bold text-gold">
                ₹{bookingData.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-[10px] text-white/40 block text-right mt-1">Includes all taxes and fees</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/50 bg-white/5 p-3 rounded-xl">
            <ShieldCheck className="h-4 w-4 text-secondary" />
            <span>256-bit secure checkout by Razorpay</span>
          </div>
        </div>
      </div>

    </div>
  );
}
