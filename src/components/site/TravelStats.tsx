import { useEffect, useState, useRef } from "react";
import { Reveal } from "./Reveal";
import { Users, Compass, Star, Award } from "lucide-react";

interface StatItemProps {
  icon: React.ReactNode;
  value: number;
  suffix: string;
  label: string;
}

function StatItem({ icon, value, suffix, label }: StatItemProps) {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let start = 0;
    const duration = 1500; // ms
    const increment = value / (duration / 16); // ~60fps
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isVisible, value]);

  return (
    <div ref={elementRef} className="bg-white border border-border p-6 rounded-3xl shadow-soft text-center space-y-3">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-gold-gradient text-gold-foreground shadow-gold">
        {icon}
      </div>
      <h3 className="font-display text-4xl font-bold text-primary flex items-center justify-center">
        {count.toLocaleString()}{suffix}
      </h3>
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-poppins font-semibold">
        {label}
      </p>
    </div>
  );
}

export function TravelStats() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatItem
          icon={<Users className="h-6 w-6" />}
          value={15000}
          suffix="+"
          label="Happy Explorers"
        />
        <StatItem
          icon={<Compass className="h-6 w-6" />}
          value={120}
          suffix="+"
          label="Road Trips"
        />
        <StatItem
          icon={<Star className="h-6 w-6" />}
          value={4} // Rendered as decimal below
          suffix=".9★"
          label="Average Rating"
        />
        <StatItem
          icon={<Award className="h-6 w-6" />}
          value={8}
          suffix="+"
          label="Years Experience"
        />
      </div>
    </section>
  );
}
