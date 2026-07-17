import { useState } from "react";
import { format } from "date-fns";
import { MapPin, Wallet, CalendarIcon, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";
import { Route } from "@/routes/index";

const budgets = ["Under ₹10,000", "₹10,000 – ₹20,000", "₹20,000 – ₹40,000", "₹40,000+"];
const groupSizes = [
  "Solo (1 Explorer)",
  "Couple (2 Explorers)",
  "Small Group (3-5)",
  "Large Group (6+)"
];

interface FieldProps {
  icon: React.ReactNode;
  children: React.ReactNode;
}

function Field({ icon, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground">
        {icon}
      </div>
      {children}
    </div>
  );
}

export function SearchPackages() {
  const { destinations } = Route.useLoaderData();
  const navigate = useNavigate();
  const [date, setDate] = useState<Date>();
  const [selectedDest, setSelectedDest] = useState<string>("");
  const [selectedBudget, setSelectedBudget] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDest) {
      navigate({ to: `/destinations_/$slug`, params: { slug: selectedDest } as any });
    } else {
      navigate({ to: "/destinations" });
    }
  };

  return (
    <section className="relative z-20 mx-auto -mt-20 max-w-6xl px-5">
      <Reveal>
        <form
          onSubmit={handleSearchSubmit}
          className="glass grid grid-cols-1 gap-4 rounded-3xl p-6 shadow-elegant sm:grid-cols-2 lg:grid-cols-5 lg:items-end border border-border"
        >
          <Field icon={<><MapPin className="h-4 w-4 text-accent" /> Choose Destination</>}>
            <Select value={selectedDest} onValueChange={setSelectedDest}>
              <SelectTrigger className="h-12 bg-white border-border">
                <SelectValue placeholder="Where to next?" />
              </SelectTrigger>
              <SelectContent>
                {destinations.map((d) => (
                  <SelectItem key={d.slug} value={d.slug}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field icon={<><Wallet className="h-4 w-4 text-accent" /> Budget Range</>}>
            <Select value={selectedBudget} onValueChange={setSelectedBudget}>
              <SelectTrigger className="h-12 bg-white border-border">
                <SelectValue placeholder="Any budget" />
              </SelectTrigger>
              <SelectContent>
                {budgets.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field icon={<><CalendarIcon className="h-4 w-4 text-accent" /> Travel Date</>}>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-12 w-full justify-start bg-white border-border font-normal text-left",
                    !date && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-accent" />
                  {date ? format(date, "PP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className={cn("pointer-events-auto p-3")}
                />
              </PopoverContent>
            </Popover>
          </Field>

          <Field icon={<><Users className="h-4 w-4 text-accent" /> Who's Coming?</>}>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="h-12 bg-white border-border">
                <SelectValue placeholder="Group Size" />
              </SelectTrigger>
              <SelectContent>
                {groupSizes.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Button type="submit" variant="hero" size="lg" className="h-12 w-full shadow-gold uppercase tracking-wider text-xs">
            <Search className="h-4 w-4" /> Start Journey
          </Button>
        </form>
      </Reveal>
    </section>
  );
}
