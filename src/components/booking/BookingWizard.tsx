import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  X,
  ShieldCheck,
  Calendar,
  Clock,
  Compass,
  MapPin,
  Users,
  ChevronDown,
  Building,
  CircleHelp,
  FileText,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { TravellerDetailsStep } from "./TravellerDetailsStep";

import { AccommodationSelectionStep } from "./AccommodationSelectionStep";
import { AddonsAndCouponsStep } from "./AddonsAndCouponsStep";
import { ReviewSummaryStep } from "./ReviewSummaryStep";
import { PaymentStep } from "./PaymentStep";
import { SuccessConfirmationStep } from "./SuccessConfirmationStep";
import { resolveBookingPricing } from "@/lib/pricing-fns";

// Context or simple state for the wizard
export type BookingState = {
  departureId: string | null;
  travellers: any[];
  selectedSeats: string[];
  selectedRooms: string[];
  selectedRoomObj: any | null;
  addons: any[];
  coupon: any | null;
};

const STEPS = [
  "Traveller Details",
  "Accommodation",
  "Add-ons",
  "Review",
  "Payment",
  "Confirmation"
];

export function BookingWizard({ 
  journey, 
  departures: rawDepartures, 
  onBack,
  isSidebar = false
}: { 
  journey: any; 
  departures: any[]; 
  onBack?: () => void;
  isSidebar?: boolean;
}) {
  const departures = (rawDepartures || []).map((d: any) => ({
    id: d.id,
    date: d.date ?? d.departure_date,
    returnDate: d.returnDate ?? d.return_date ?? d.departure_date,
    basePrice: Number(d.basePrice ?? d.dynamic_price ?? d.base_price ?? 0),
    availableSeats: d.availableSeats ?? d.available_seats ?? 20
  }));

  const [currentStep, setCurrentStep] = useState(0);
  const [activeSummaryTab, setActiveSummaryTab] = useState<"billing" | "itinerary" | "inclusions" | "info">("billing");
  const [bookingData, setBookingData] = useState<BookingState>({
    departureId: departures[0]?.id || null,
    travellers: [],
    selectedSeats: [],
    selectedRooms: [],
    selectedRoomObj: null,
    addons: [],
    coupon: null,
  });

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    if (typeof window !== "undefined") {
      const card = document.getElementById("booking-sidebar-card");
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    if (typeof window !== "undefined") {
      const card = document.getElementById("booking-sidebar-card");
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const selectedDeparture = departures.find(d => d.id === bookingData.departureId);

  const pricing = resolveBookingPricing({
    journey,
    departure: selectedDeparture,
    room: bookingData.selectedRoomObj,
    travellers: bookingData.travellers,
    addons: bookingData.addons,
    coupon: bookingData.coupon,
  });

  if (isSidebar) {
    return (
      <div id="booking-sidebar-card" className="space-y-4 font-sans text-xs pb-24 sm:pb-10">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            {onBack && (
              <button 
                onClick={onBack} 
                className="p-1 hover:bg-muted rounded-full transition cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            <div>
              <h2 className="text-sm font-display font-bold text-primary">Secure Your Seat</h2>
              <p className="text-[10px] text-muted-foreground">{journey.name}</p>
            </div>
          </div>
        </div>

        {/* Text-based Compact Stepper */}
        {currentStep < 5 && (
          <div className="bg-muted/40 px-3 py-2 rounded-xl border border-border flex items-center justify-between text-[10px] font-poppins font-bold">
            <span className="text-muted-foreground uppercase tracking-wider">Step {currentStep + 1} of {STEPS.length - 1}</span>
            <span className="text-accent uppercase tracking-wider">{STEPS[currentStep]}</span>
          </div>
        )}

        {/* Departure Date Selection */}
        {currentStep === 0 && (
          <div className="space-y-2 bg-muted/20 p-3 rounded-2xl border border-border">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-accent" />
              <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-primary block">
                Choose Departure Date
              </label>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <select
                  value={bookingData.departureId || ""}
                  onChange={(e) => {
                    const depId = e.target.value;
                    const dep = departures.find(d => d.id === depId);
                    setBookingData(prev => ({
                      ...prev,
                      departureId: depId || null,
                    }));
                  }}
                  className="w-full h-9 px-3 pr-8 border border-border rounded-xl bg-white text-[11px] font-semibold font-poppins text-foreground focus:outline-none appearance-none cursor-pointer"
                >
                  {departures.length === 0 ? (
                    <option value="">No departures available</option>
                  ) : (
                    departures.map((dep) => {
                      const start = new Date(dep.date);
                      const formattedDate = start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                      return (
                        <option key={dep.id} value={dep.id}>
                          {formattedDate} — ₹{dep.basePrice.toLocaleString('en-IN')}
                        </option>
                      );
                    })
                  )}
                </select>
                <ChevronDown className="absolute right-2.5 top-3 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>
              {selectedDeparture?.availableSeats && (
                <div className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 py-1.5 px-3 rounded-lg text-center font-poppins">
                  🟢 {selectedDeparture.availableSeats} seats remaining in this batch
                </div>
              )}
            </div>
          </div>
        )}

        {/* Current Step Component */}
        <div className="bg-white rounded-2xl border border-border p-3 sm:p-4 min-h-[300px]">
          {currentStep === 0 && <TravellerDetailsStep data={bookingData} updateData={setBookingData} onNext={nextStep} isSidebar={isSidebar} pricing={pricing} departures={departures} />}
          {currentStep === 1 && <AccommodationSelectionStep data={bookingData} updateData={setBookingData} onNext={nextStep} onPrev={prevStep} journey={journey} isSidebar={isSidebar} pricing={pricing} />}
          {currentStep === 2 && <AddonsAndCouponsStep data={bookingData} updateData={setBookingData} onNext={nextStep} onPrev={prevStep} isSidebar={isSidebar} pricing={pricing} />}
          {currentStep === 3 && <ReviewSummaryStep data={bookingData} updateData={setBookingData} onNext={nextStep} onPrev={prevStep} journey={journey} isSidebar={isSidebar} pricing={pricing} />}
          {currentStep === 4 && <PaymentStep data={bookingData} updateData={setBookingData} onNext={nextStep} onPrev={prevStep} journey={journey} isSidebar={isSidebar} pricing={pricing} />}
          {currentStep === 5 && <SuccessConfirmationStep data={bookingData} journey={journey} isSidebar={isSidebar} pricing={pricing} />}
        </div>

        {/* Sidebar Mini Summary Accordion (only visible before completion) */}
        {currentStep < 5 && (
          <div className="bg-muted/10 border border-border rounded-2xl p-3 space-y-2 font-sans">
            <div className="flex justify-between items-center text-xs font-bold text-primary">
              <span>Total Billable</span>
              <span className="text-sm text-accent">₹{pricing.total.toLocaleString('en-IN')}</span>
            </div>
            {bookingData.travellers.length > 0 && (
              <div className="text-[10px] text-muted-foreground flex justify-between font-medium">
                <span>{bookingData.travellers.length} Explorer{bookingData.travellers.length > 1 ? 's' : ''} x ₹{pricing.effectiveBasePrice.toLocaleString('en-IN')}</span>
                {pricing.roomModifier > 0 && <span>+ Room Extra</span>}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-5 pt-8 pb-32 sm:pb-16 grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
      
      {/* LEFT CONTENT: Stepper & Form */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-4">
            {onBack ? (
              <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm hover:bg-muted transition cursor-pointer">
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              </button>
            ) : (
              <Link to="/journeys/$journeySlug" params={{ journeySlug: journey.slug }} className="p-2 bg-white rounded-full shadow-sm hover:bg-muted transition">
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              </Link>
            )}
            <div>
              <h1 className="text-2xl font-display font-bold text-primary">Secure Your Journey</h1>
              <p className="text-sm text-muted-foreground">{journey.name} • {journey.duration}</p>
            </div>
          </div>
        </div>

        {/* Departure Date Selection Dropdown */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-border space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-accent" />
            <label className="text-xs font-poppins font-bold uppercase tracking-wider text-primary block">
              Choose Departure Date Batch
            </label>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <select
                value={bookingData.departureId || ""}
                onChange={(e) => {
                  const depId = e.target.value;
                  setBookingData(prev => ({
                    ...prev,
                    departureId: depId || null,
                  }));
                }}
                className="w-full h-11 px-4 pr-10 border border-border rounded-xl bg-white text-xs font-semibold font-poppins text-foreground focus:outline-none appearance-none cursor-pointer"
              >
                {departures.length === 0 ? (
                  <option value="">No departures available</option>
                ) : (
                  departures.map((dep) => {
                    const start = new Date(dep.date);
                    const formattedDate = start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                    return (
                      <option key={dep.id} value={dep.id}>
                        Batch: {formattedDate} — ₹{dep.basePrice.toLocaleString('en-IN')} ({dep.availableSeats} spots remain)
                      </option>
                    );
                  })
                )}
              </select>
              <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            {selectedDeparture?.availableSeats && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-4 py-2.5 rounded-xl shrink-0 w-full sm:w-auto text-center font-poppins">
                {selectedDeparture.availableSeats} seats remaining
              </span>
            )}
          </div>
        </div>

        {/* Stepper progress */}
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
          {currentStep === 0 && <TravellerDetailsStep data={bookingData} updateData={setBookingData} onNext={nextStep} isSidebar={isSidebar} pricing={pricing} departures={departures} />}
          {currentStep === 1 && <AccommodationSelectionStep data={bookingData} updateData={setBookingData} onNext={nextStep} onPrev={prevStep} journey={journey} isSidebar={isSidebar} pricing={pricing} />}
          {currentStep === 2 && <AddonsAndCouponsStep data={bookingData} updateData={setBookingData} onNext={nextStep} onPrev={prevStep} isSidebar={isSidebar} pricing={pricing} />}
          {currentStep === 3 && <ReviewSummaryStep data={bookingData} updateData={setBookingData} onNext={nextStep} onPrev={prevStep} journey={journey} isSidebar={isSidebar} pricing={pricing} />}
          {currentStep === 4 && <PaymentStep data={bookingData} updateData={setBookingData} onNext={nextStep} onPrev={prevStep} journey={journey} isSidebar={isSidebar} pricing={pricing} />}
          {currentStep === 5 && <SuccessConfirmationStep data={bookingData} journey={journey} isSidebar={isSidebar} pricing={pricing} />}
        </div>
      </div>

      {/* RIGHT CONTENT: Sticky Premium Summary & Information Panel */}
      <div className="lg:col-span-4 space-y-6">
        <div className="sticky top-24 bg-white border border-border rounded-3xl shadow-elegant overflow-hidden flex flex-col">
          
          {/* Header image / banner */}
          <div className="h-32 relative bg-primary overflow-hidden">
            {journey.image ? (
              <img src={journey.image} alt={journey.name} className="w-full h-full object-cover opacity-60" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/40">
                <Compass className="h-8 w-8" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-4 left-4 text-white">
              <span className="text-[9px] uppercase tracking-wider bg-gold text-gold-foreground font-poppins font-bold px-2 py-0.5 rounded">
                {journey.duration}
              </span>
              <h3 className="text-lg font-display font-bold mt-1 text-white leading-tight">{journey.name}</h3>
            </div>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="grid grid-cols-4 border-b border-border bg-muted/20 text-xs font-semibold text-center font-poppins">
            <button
              onClick={() => setActiveSummaryTab("billing")}
              className={`py-3 border-b-2 transition-colors ${activeSummaryTab === "billing" ? "border-accent text-accent font-bold bg-white" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              Billing
            </button>
            <button
              onClick={() => setActiveSummaryTab("itinerary")}
              className={`py-3 border-b-2 transition-colors ${activeSummaryTab === "itinerary" ? "border-accent text-accent font-bold bg-white" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              Itinerary
            </button>
            <button
              onClick={() => setActiveSummaryTab("inclusions")}
              className={`py-3 border-b-2 transition-colors ${activeSummaryTab === "inclusions" ? "border-accent text-accent font-bold bg-white" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              Inclusions
            </button>
            <button
              onClick={() => setActiveSummaryTab("info")}
              className={`py-3 border-b-2 transition-colors ${activeSummaryTab === "info" ? "border-accent text-accent font-bold bg-white" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              Info
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="p-5 flex-1 max-h-[50vh] overflow-y-auto min-h-[250px]">
            
            {/* BILLING LEDGER TAB */}
            {activeSummaryTab === "billing" && (
              <div className="space-y-4 font-sans text-xs">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Selected Date Batch</span>
                    <span className="font-semibold text-right text-foreground">
                      {selectedDeparture ? new Date(selectedDeparture.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : "Not selected"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Base Price per Explorer</span>
                    <span className="font-semibold text-foreground">₹{pricing.effectiveBasePrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">No. of Travellers</span>
                    <span className="font-bold text-primary">{Math.max(bookingData.travellers.length, 1)}</span>
                  </div>
                  {bookingData.selectedSeats.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-medium">Reserved Seats</span>
                      <span className="font-mono font-bold text-accent bg-accent/5 px-2 py-0.5 rounded border border-accent/15">
                        {bookingData.selectedSeats.join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between items-end">
                    <span className="text-xs text-muted-foreground font-semibold">Total Amount Due</span>
                    <span className="text-2xl font-display font-bold text-primary">
                      ₹{pricing.total.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <span className="text-[9px] text-muted-foreground block text-right mt-1 font-poppins">Includes all taxes and fees</span>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">Secure Payment Processing via Cashfree & Google Pay</span>
                </div>
              </div>
            )}

            {/* ITINERARY TAB */}
            {activeSummaryTab === "itinerary" && (
              <div className="space-y-4 font-sans text-xs">
                {journey.dayByDay && journey.dayByDay.length > 0 ? (
                  <div className="space-y-3.5 pl-3 border-l-2 border-dashed border-border">
                    {journey.dayByDay.map((day: any, dIdx: number) => (
                      <div key={dIdx} className="relative">
                        <span className="absolute -left-[19px] top-0.5 w-3.5 h-3.5 bg-accent text-[8px] text-white font-bold rounded-full flex items-center justify-center shadow">
                          {dIdx + 1}
                        </span>
                        <h4 className="font-semibold text-foreground">{day.title}</h4>
                        {day.description && <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">{day.description}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic text-center py-6">Itinerary details loading...</p>
                )}
              </div>
            )}

            {/* INCLUSIONS & EXCLUSIONS TAB */}
            {activeSummaryTab === "inclusions" && (
              <div className="space-y-4 font-sans text-xs">
                {/* Inclusions */}
                {journey.inclusions && journey.inclusions.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-bold text-[10px] uppercase text-emerald-700 tracking-wider">What's Included</p>
                    <ul className="space-y-1.5 pl-1.5">
                      {journey.inclusions.map((inc: string, idx: number) => (
                        <li key={idx} className="flex gap-1.5 items-start text-[11px] text-muted-foreground">
                          <Check className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Exclusions */}
                {journey.exclusions && journey.exclusions.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <p className="font-bold text-[10px] uppercase text-red-700 tracking-wider">What's Not Included</p>
                    <ul className="space-y-1.5 pl-1.5">
                      {journey.exclusions.map((exc: string, idx: number) => (
                        <li key={idx} className="flex gap-1.5 items-start text-[11px] text-muted-foreground">
                          <X className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
                          <span>{exc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* INFO & QUICK FACTS TAB */}
            {activeSummaryTab === "info" && (
              <div className="space-y-4 font-sans text-xs">
                {journey.accommodation && ((journey.accommodation as any).id || (journey.accommodation as any).name) ? (
                  (() => {
                    const rawStay = journey.accommodation as any;
                    const stay = {
                      hotel_name: rawStay.name,
                      hotel_category: rawStay.star_rating ? `${rawStay.star_rating} Star` : null,
                      location: rawStay.city ? `${rawStay.city}${rawStay.state ? `, ${rawStay.state}` : ''}` : (rawStay.address || rawStay.location),
                      google_maps: rawStay.website,
                      check_in: rawStay.check_in_time || '12:00 PM',
                      check_out: rawStay.check_out_time || '11:00 AM',
                      cover_image: rawStay.cover_image || (rawStay.gallery as any[])?.[0]?.url || (rawStay.gallery as any[])?.[0] || '',
                      gallery: (rawStay.gallery as any[])?.map((img: any) => typeof img === 'string' ? img : img.url).filter(Boolean) || [],
                      room_types: rawStay.hotel_rooms?.map((r: any) => r.room_type || r.sharing_type).filter(Boolean) || rawStay.room_types || [],
                      amenities: rawStay.amenities || []
                    };
                    return (
                      <div className="space-y-4 border-t pt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Stay Configured</span>
                          {stay.google_maps && (
                            <a
                              href={stay.google_maps}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-1"
                            >
                              <MapPin className="h-3 w-3 text-accent" /> View Map
                            </a>
                          )}
                        </div>

                        {/* Stay Card */}
                        <div className="border rounded-2xl overflow-hidden bg-white shadow-soft">
                          {stay.cover_image && (
                            <div className="relative aspect-[16/9] w-full">
                              <img
                                src={stay.cover_image}
                                alt={stay.hotel_name}
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                <Check className="h-3 w-3" /> Verified Stay
                              </div>
                            </div>
                          )}

                          <div className="p-3.5 space-y-3">
                            <div>
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-xs text-primary leading-tight font-display">{stay.hotel_name}</h4>
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{stay.location}</p>
                              {stay.hotel_category && (
                                <div className="flex items-center gap-1 mt-1 text-amber-500 font-bold text-[9px]">
                                  <Star className="h-3 w-3 fill-current" />
                                  <span>{stay.hotel_category} Stay</span>
                                </div>
                              )}
                            </div>

                            {/* Check In / Out */}
                            {(stay.check_in || stay.check_out) && (
                              <div className="flex gap-2 text-[9px] font-semibold border-t border-b py-2">
                                {stay.check_in && (
                                  <span className="bg-muted px-2 py-1 rounded text-primary">
                                    IN: {stay.check_in}
                                  </span>
                                )}
                                {stay.check_out && (
                                  <span className="bg-muted px-2 py-1 rounded text-primary">
                                    OUT: {stay.check_out}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Room sharing options */}
                            {stay.room_types && stay.room_types.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Sharing configurations</span>
                                <div className="flex flex-wrap gap-1">
                                  {stay.room_types.map((type: string, idx: number) => (
                                    <span key={idx} className="bg-indigo-50 text-indigo-700 text-[9px] font-semibold px-2 py-0.5 rounded-full border border-indigo-100">
                                      {type}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Amenities */}
                            {stay.amenities && stay.amenities.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Amenities Included</span>
                                <div className="flex flex-wrap gap-1">
                                  {stay.amenities.map((amenity: string, idx: number) => (
                                    <span key={idx} className="bg-emerald-50 text-emerald-700 text-[9px] font-semibold px-2 py-0.5 rounded-md border border-emerald-100">
                                      ✓ {amenity}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Gallery grid (up to 4 thumbnails) */}
                            {stay.gallery && stay.gallery.length > 0 && (
                              <div className="space-y-1 pt-1 border-t">
                                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Property & Room Gallery</span>
                                <div className="grid grid-cols-4 gap-1">
                                  {stay.gallery.slice(0, 4).map((url: string, idx: number) => (
                                    <div key={idx} className="aspect-square rounded-md overflow-hidden border bg-muted">
                                      <img src={url} alt="" className="w-full h-full object-cover" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div className="p-2 border rounded-xl bg-muted/20">
                      <span className="text-[9px] text-muted-foreground block uppercase font-bold">Transport</span>
                      <span className="font-semibold flex items-center gap-1 mt-0.5 text-foreground">
                        <Clock className="w-3.5 h-3.5 text-accent shrink-0" />
                        {journey.transport || "AC Vehicle"}
                      </span>
                    </div>
                    <div className="p-2 border rounded-xl bg-muted/20">
                      <span className="text-[9px] text-muted-foreground block uppercase font-bold">Stay / Hotel</span>
                      <span className="font-semibold flex items-center gap-1 mt-0.5 text-foreground">
                        <Building className="w-3.5 h-3.5 text-accent shrink-0" />
                        {journey.stayInfo ? journey.stayInfo.split(" ").slice(0, 3).join(" ") : "Boutique Stays"}
                      </span>
                    </div>
                    {journey.pickupPoint && (
                      <div className="p-2 border rounded-xl bg-muted/20 col-span-2">
                        <span className="text-[9px] text-muted-foreground block uppercase font-bold">Pickup point</span>
                        <span className="font-semibold flex items-center gap-1 mt-0.5 text-foreground">
                          <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                          {journey.pickupPoint}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-3 border rounded-xl bg-amber-50/50 border-amber-100 flex gap-2 items-start text-[10px] text-muted-foreground">
                  <CircleHelp className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-primary">Need immediate booking help?</p>
                    <p className="mt-0.5">Please WhatsApp support at <strong>+91 9999999999</strong> for fast confirmations.</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

    </div>
  );
}

