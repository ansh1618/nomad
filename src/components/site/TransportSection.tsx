"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bus,
  ShieldCheck,
  Zap,
  Music,
  Wind,
  Luggage,
  Award,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  CheckCircle2,
  Armchair,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface TransportSpec {
  name?: string;
  capacity?: string;
  vehicleType?: string;
  isAc?: boolean;
  pushbackSeats?: boolean;
  chargingPorts?: string;
  musicSystem?: string;
  luggageSpace?: string;
  driverExperience?: string;
  washroomStops?: string;
  images?: string[];
  features?: string[];
}

interface TransportSectionProps {
  transportData?: any;
  journeyName?: string;
  slug?: string;
}

export function TransportSection({
  transportData,
  journeyName = "Road Journey",
  slug = "",
}: TransportSectionProps) {
  // Parse transport data dynamically from database object or fallback
  const parsedTransport: TransportSpec = (() => {
    if (!transportData) return getFallbackTransport(slug);
    if (typeof transportData === "string") {
      try {
        const obj = JSON.parse(transportData);
        if (obj && typeof obj === "object") return normalizeTransportObj(obj, slug);
      } catch {
        return {
          ...getFallbackTransport(slug),
          name: transportData,
        };
      }
    }
    if (typeof transportData === "object") {
      return normalizeTransportObj(transportData, slug);
    }
    return getFallbackTransport(slug);
  })();

  const images =
    parsedTransport.images && parsedTransport.images.length > 0
      ? parsedTransport.images
      : getFallbackTransport(slug).images!;

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight")
        setLightboxIdx((prev) => (prev + 1) % images.length);
      if (e.key === "ArrowLeft")
        setLightboxIdx((prev) => (prev - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, images.length]);

  const openLightbox = (index: number) => {
    setLightboxIdx(index);
    setLightboxOpen(true);
  };

  return (
    <section id="transport" className="py-16 sm:py-24 bg-[#FAF9F5] border-t border-[#E4E2DA] relative overflow-hidden">
      {/* Background Decor Ambient Blur */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        {/* Section Heading & Subtitle */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#F59E0B]/10 border border-[#F59E0B]/30 px-3.5 py-1.5 rounded-full shadow-sm">
            <Bus className="h-4 w-4 text-[#D97706]" />
            <span className="text-xs font-poppins font-bold uppercase tracking-widest text-[#D97706]">
              YOUR RIDE · LUXURY TRANSPORT
            </span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-primary tracking-tight">
            Know Your Ride Before You Travel
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground font-poppins leading-relaxed">
            Clean, comfortable, and regularly serviced luxury vehicles driven by certified highway captains for your complete safety and high-comfort road trip experience.
          </p>
        </div>

        {/* Main Grid: Gallery on Left / Specifications on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* LEFT 7 COLS: HERO VEHICLE IMAGE & INTERIOR THUMBNAIL GALLERY */}
          <div className="lg:col-span-7 space-y-4">
            {/* Hero Image Container */}
            <motion.div
              whileHover={{ scale: 1.005 }}
              transition={{ duration: 0.2 }}
              className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-3xl overflow-hidden shadow-2xl border border-[#E4E2DA] bg-slate-900 group cursor-pointer"
              onClick={() => openLightbox(activeImageIdx)}
            >
              <img
                src={images[activeImageIdx]}
                alt={`${parsedTransport.name} Hero`}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Overlay Gradients */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

              {/* Vehicle Title Overlay Badge */}
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex items-end justify-between gap-4">
                <div className="space-y-1">
                  <Badge className="bg-[#F59E0B] text-slate-950 font-bold px-2.5 py-0.5 text-[11px] rounded-lg">
                    {parsedTransport.capacity || "Luxury Cruiser"}
                  </Badge>
                  <h3 className="font-display font-bold text-lg sm:text-2xl text-white drop-shadow-md">
                    {parsedTransport.name}
                  </h3>
                </div>

                <Button
                  size="icon"
                  className="bg-white/20 backdrop-blur-md hover:bg-white/40 text-white rounded-2xl shrink-0 h-10 w-10 border border-white/30"
                  title="View Fullscreen Gallery"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>

            {/* Thumbnail Gallery Header & Strip ("View Interior") */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-poppins font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#D97706]" /> VIEW INTERIOR & RIDE GALLERY
                </span>
                <span className="text-xs text-muted-foreground font-mono font-medium">
                  {images.length} Photos
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
                {images.map((imgUrl, idx) => {
                  const isActive = idx === activeImageIdx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIdx(idx)}
                      className={`relative aspect-[4/3] rounded-2xl overflow-hidden border-2 transition-all duration-200 group ${
                        isActive
                          ? "border-[#D97706] ring-2 ring-[#D97706]/30 scale-[1.02] shadow-md"
                          : "border-[#E4E2DA] opacity-70 hover:opacity-100 hover:border-slate-400"
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Interior thumbnail ${idx + 1}`}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      {isActive && (
                        <div className="absolute inset-0 bg-[#D97706]/10" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLS: TRANSPORT SPECIFICATIONS & FEATURES */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E4E2DA] shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-[#E4E2DA] pb-4">
                <div>
                  <h4 className="font-display font-bold text-xl text-primary">
                    Vehicle Specifications
                  </h4>
                  <p className="text-xs text-muted-foreground font-poppins mt-0.5">
                    Guaranteed high comfort standards for your trip
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-[#FAF9F5] border border-[#E4E2DA] flex items-center justify-center text-[#D97706]">
                  <Bus className="h-5 w-5" />
                </div>
              </div>

              {/* Specifications Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Vehicle Name & Capacity */}
                <div className="p-3.5 bg-[#FAF9F5] rounded-2xl border border-[#E4E2DA]/80 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <Bus className="h-4 w-4 text-[#D97706]" /> Seating Capacity
                  </div>
                  <p className="font-poppins font-bold text-sm text-primary">
                    {parsedTransport.capacity || "17-26 Seater Coach"}
                  </p>
                </div>

                {/* 2. AC Status */}
                <div className="p-3.5 bg-[#FAF9F5] rounded-2xl border border-[#E4E2DA]/80 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <Wind className="h-4 w-4 text-blue-500" /> Climate Control
                  </div>
                  <p className="font-poppins font-bold text-sm text-primary">
                    {parsedTransport.isAc !== false ? "100% Climate AC" : "Standard Vents"}
                  </p>
                </div>

                {/* 3. Pushback Seats */}
                <div className="p-3.5 bg-[#FAF9F5] rounded-2xl border border-[#E4E2DA]/80 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <Armchair className="h-4 w-4 text-emerald-600" /> Reclining Seats
                  </div>
                  <p className="font-poppins font-bold text-sm text-primary">
                    {parsedTransport.pushbackSeats !== false ? "160° Ergonomic Recliners" : "Standard Comfort Seats"}
                  </p>
                </div>

                {/* 4. Charging Ports */}
                <div className="p-3.5 bg-[#FAF9F5] rounded-2xl border border-[#E4E2DA]/80 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <Zap className="h-4 w-4 text-amber-500" /> Charging Ports
                  </div>
                  <p className="font-poppins font-bold text-sm text-primary truncate">
                    {parsedTransport.chargingPorts || "Individual USB / Socket Ports"}
                  </p>
                </div>

                {/* 5. Music & Audio */}
                <div className="p-3.5 bg-[#FAF9F5] rounded-2xl border border-[#E4E2DA]/80 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <Music className="h-4 w-4 text-purple-500" /> Music System
                  </div>
                  <p className="font-poppins font-bold text-sm text-primary truncate">
                    {parsedTransport.musicSystem || "JBL Sound & Ambient Lights"}
                  </p>
                </div>

                {/* 6. Luggage Space */}
                <div className="p-3.5 bg-[#FAF9F5] rounded-2xl border border-[#E4E2DA]/80 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <Luggage className="h-4 w-4 text-teal-600" /> Luggage Space
                  </div>
                  <p className="font-poppins font-bold text-sm text-primary truncate">
                    {parsedTransport.luggageSpace || "Under-deck & Overhead Racks"}
                  </p>
                </div>
              </div>

              {/* Driver & Safety Highlights */}
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 p-3.5 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl">
                  <Award className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-poppins font-bold text-xs text-emerald-950">
                      Highway Captain Safety Assurance
                    </h5>
                    <p className="text-[11px] text-emerald-800 font-poppins leading-relaxed mt-0.5">
                      {parsedTransport.driverExperience || "Driven by commercial captains with 10+ years highway experience and speed tracking."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-sky-50/70 border border-sky-200/60 rounded-2xl">
                  <Clock className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-poppins font-bold text-xs text-sky-950">
                      Restroom & Refreshment Stops
                    </h5>
                    <p className="text-[11px] text-sky-800 font-poppins leading-relaxed mt-0.5">
                      {parsedTransport.washroomStops || "Scheduled clean restroom breaks every 3-4 hours at verified highway food courts."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature Pill Badges */}
              <div className="pt-2 border-t border-[#E4E2DA] space-y-2">
                <span className="text-[10px] font-poppins font-bold uppercase tracking-widest text-muted-foreground block">
                  INCLUDED RIDE AMENITIES
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(parsedTransport.features || [
                    "Pushback Seats",
                    "Personal USB Charging",
                    "Climate AC Vents",
                    "JBL Sound System",
                    "Luggage Storage",
                    "Clean Restroom Breaks",
                    "Safety GPS Tracking",
                    "First Aid Kit"
                  ]).map((feat, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="bg-[#FAF9F5] border-[#E4E2DA] text-slate-800 font-poppins text-[11px] py-1 px-2.5 rounded-xl flex items-center gap-1"
                    >
                      <CheckCircle2 className="h-3 w-3 text-[#D97706]" /> {feat}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FULLSCREEN INTERACTIVE LIGHTBOX MODAL */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-8"
          >
            {/* Lightbox Header */}
            <div className="flex items-center justify-between text-white z-10">
              <div className="flex items-center gap-3">
                <Badge className="bg-[#F59E0B] text-slate-950 font-bold text-xs">
                  {parsedTransport.capacity || "Luxury Vehicle"}
                </Badge>
                <span className="font-display font-bold text-sm sm:text-base text-slate-200">
                  {parsedTransport.name} Interior Gallery
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-slate-400">
                  {lightboxIdx + 1} / {images.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLightboxOpen(false)}
                  className="text-slate-400 hover:text-white rounded-full bg-slate-800/60"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Lightbox Main Image Display */}
            <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
              <motion.img
                key={lightboxIdx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                src={images[lightboxIdx]}
                alt={`Transport gallery view ${lightboxIdx + 1}`}
                className="max-h-[80vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl border border-slate-800"
              />

              {/* Prev / Next Navigation Buttons */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setLightboxIdx((prev) => (prev - 1 + images.length) % images.length)
                }
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 text-white bg-slate-900/80 hover:bg-slate-800 rounded-full h-12 w-12 border border-slate-700 shadow-xl"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setLightboxIdx((prev) => (prev + 1) % images.length)
                }
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 text-white bg-slate-900/80 hover:bg-slate-800 rounded-full h-12 w-12 border border-slate-700 shadow-xl"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>

            {/* Lightbox Footer Thumbnail Bar */}
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 z-10">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIdx(i)}
                  className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                    i === lightboxIdx
                      ? "border-[#F59E0B] scale-110"
                      : "border-slate-800 opacity-50 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}// Fallbacks per destination slug
function getFallbackTransport(slug: string): TransportSpec {
  const s = slug.toLowerCase();
  const REAL_VEHICLE_IMAGES = [
    "/images/transport/force-traveller-front.jpg",
    "/images/transport/force-traveller-side.jpg",
    "/images/transport/force-traveller-interior-seats.jpg",
    "/images/transport/force-traveller-interior-cabin.jpg",
  ];

  if (s.includes("jibhi") || s.includes("tirthan") || s.includes("chopta") || s.includes("spiti")) {
    return {
      name: "Force Traveller 17 Seater (Mountain Edition)",
      capacity: "12-18 Explorers",
      vehicleType: "Super Deluxe AC Mountain Cruiser",
      isAc: true,
      pushbackSeats: true,
      chargingPorts: "Personal USB & AC Socket Ports on Every Row",
      musicSystem: "JBL Surround Audio & LED Ambient Cabin Lighting",
      luggageSpace: "Under-deck & Overhead Luggage Storage Bays",
      driverExperience: "Hill-Certified Captains with 12+ Yrs Mountain Exp",
      washroomStops: "Scheduled Clean Restroom Breaks Every 3-4 Hours",
      images: REAL_VEHICLE_IMAGES,
      features: [
        "Pushback Recliners",
        "Personal USB Ports",
        "Climate AC Vents",
        "JBL Sound System",
        "Luggage Storage",
        "Hill-Certified Captain",
        "Clean Restroom Breaks",
        "First Aid Kit",
      ],
    };
  }

  if (s.includes("manali") || s.includes("shimla")) {
    return {
      name: "Luxury AC Force Traveller (Mountain Cruiser)",
      capacity: "12-18 Explorers",
      vehicleType: "Super Deluxe AC Coach",
      isAc: true,
      pushbackSeats: true,
      chargingPorts: "Individual Mobile Charging Sockets",
      musicSystem: "JBL Surround Sound & LED Ambient Lighting",
      luggageSpace: "Under-deck & Overhead Luggage Bays",
      driverExperience: "Certified Highway Captains (12+ Yrs Mountain Exp)",
      washroomStops: "Scheduled Clean Restroom Breaks Every 3-4 Hours",
      images: REAL_VEHICLE_IMAGES,
      features: [
        "Pushback Seats",
        "Personal USB Charging",
        "Climate AC Vents",
        "JBL Sound System",
        "Ambient LED Cabin Lights",
        "Under-deck Luggage",
        "Verified Restroom Stops",
      ],
    };
  }

  // Default General
  return {
    name: "Luxury AC Force Traveller",
    capacity: "12-18 Explorers",
    vehicleType: "Deluxe Highway Cruiser",
    isAc: true,
    pushbackSeats: true,
    chargingPorts: "Personal USB & Charging Sockets",
    musicSystem: "JBL Sound System & Ambient Lighting",
    luggageSpace: "Overhead & Under-deck Luggage Bays",
    driverExperience: "Certified Highway Captains (10+ Yrs Highway Exp)",
    washroomStops: "Scheduled Clean Restroom Stops every 3-4 Hours",
    images: REAL_VEHICLE_IMAGES,
    features: [
      "Pushback Seats",
      "Personal USB Charging",
      "Climate AC Vents",
      "JBL Sound System",
      "Luggage Racks",
      "GPS Speed Governor",
      "Clean Restroom Breaks",
      "First Aid Kit",
    ],
  };
}

function normalizeTransportObj(obj: any, slug: string): TransportSpec {
  const fallback = getFallbackTransport(slug);
  return {
    name: obj.name || obj.vehicle_name || fallback.name,
    capacity: obj.capacity || obj.vehicle_type || obj.seat_capacity ? `${obj.seat_capacity || ''} Seater` : fallback.capacity,
    vehicleType: obj.vehicleType || obj.vehicle_type || fallback.vehicleType,
    isAc: obj.isAc ?? obj.ac ?? fallback.isAc,
    pushbackSeats: obj.pushbackSeats ?? obj.pushback_seats ?? fallback.pushbackSeats,
    chargingPorts: obj.chargingPorts || obj.charging_ports || fallback.chargingPorts,
    musicSystem: obj.musicSystem || obj.music_system || fallback.musicSystem,
    luggageSpace: obj.luggageSpace || obj.luggage_space || fallback.luggageSpace,
    driverExperience: obj.driverExperience || obj.driver_experience || fallback.driverExperience,
    washroomStops: obj.washroomStops || obj.washroom_stops || fallback.washroomStops,
    images: Array.isArray(obj.images) && obj.images.length > 0 ? obj.images : (Array.isArray(obj.gallery) && obj.gallery.length > 0 ? obj.gallery : fallback.images),
    features: Array.isArray(obj.features) && obj.features.length > 0 ? obj.features : fallback.features,
  };
}
