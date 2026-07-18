import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function TravellerDetailsStep({ data, updateData, onNext }: any) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Ensure at least one traveller exists
  const [travellers, setTravellers] = useState(data.travellers.length > 0 ? data.travellers : [{
    id: 't-1', isPrimary: true, fullName: '', gender: '', dob: '', phone: '', email: '', 
    aadhaarNumber: '', passportNumber: '', foodPreference: '', medicalConditions: '', 
    emergencyContactName: '', emergencyContactPhone: '', pickupPoint: ''
  }]);

  const updateTraveller = (id: string, field: string, value: string) => {
    setTravellers((prev: any[]) => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
    // Clear error for this field
    setErrors(prev => {
      const copy = { ...prev };
      delete copy[`${id}-${field}`];
      return copy;
    });
  };

  const addTraveller = () => {
    setTravellers((prev: any[]) => [...prev, {
      id: `t-${Date.now()}`, isPrimary: false, fullName: '', gender: '', dob: '', phone: '', email: '', 
      aadhaarNumber: '', passportNumber: '', foodPreference: '', medicalConditions: '', 
      emergencyContactName: '', emergencyContactPhone: '', pickupPoint: ''
    }]);
  };

  const removeTraveller = (id: string) => {
    if (travellers.length > 1) {
      setTravellers((prev: any[]) => prev.filter(t => t.id !== id));
    }
  };

  const handleNext = () => {
    const newErrors: Record<string, string> = {};
    let hasError = false;

    travellers.forEach((t: any) => {
      if (!t.fullName?.trim()) {
        newErrors[`${t.id}-fullName`] = "Full name is required";
        hasError = true;
      }
      if (!t.gender) {
        newErrors[`${t.id}-gender`] = "Gender is required";
        hasError = true;
      }
      if (!t.dob) {
        newErrors[`${t.id}-dob`] = "Date of birth is required";
        hasError = true;
      }
      if (t.isPrimary) {
        if (!t.phone?.trim()) {
          newErrors[`${t.id}-phone`] = "Phone number is required";
          hasError = true;
        }
        if (!t.email?.trim() || !/\S+@\S+\.\S+/.test(t.email)) {
          newErrors[`${t.id}-email`] = "Valid email is required";
          hasError = true;
        }
        if (!t.emergencyContactName?.trim()) {
          newErrors[`${t.id}-emergencyContactName`] = "Emergency contact name is required";
          hasError = true;
        }
        if (!t.emergencyContactPhone?.trim()) {
          newErrors[`${t.id}-emergencyContactPhone`] = "Emergency contact phone is required";
          hasError = true;
        }
      }
      
      const aadhaarClean = (t.aadhaarNumber || "").replace(/\s/g, "");
      if (!aadhaarClean) {
        newErrors[`${t.id}-aadhaarNumber`] = "Aadhaar Number is required";
        hasError = true;
      } else if (!/^\d{12}$/.test(aadhaarClean)) {
        newErrors[`${t.id}-aadhaarNumber`] = "Aadhaar must be a 12-digit number";
        hasError = true;
      }
    });

    if (hasError) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields, including a valid 12-digit Aadhaar Number.");
      return;
    }

    setErrors({});
    updateData((prev: any) => ({ ...prev, travellers }));
    onNext();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold text-primary">Traveller Details</h2>
        <p className="text-sm text-muted-foreground mt-1">Please provide accurate details for all explorers as per official ID.</p>
      </div>
      
      <div className="space-y-6">
        {travellers.map((t: any, index: number) => (
          <div key={t.id} className="p-6 border border-border rounded-2xl bg-white shadow-soft space-y-5 relative">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-poppins font-bold text-secondary">
                {t.isPrimary ? 'Primary Explorer' : `Co-Explorer ${index}`}
              </h3>
              {!t.isPrimary && (
                <button onClick={() => removeTraveller(t.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase text-muted-foreground">Full Name (As per ID) *</label>
                <Input value={t.fullName} onChange={e => updateTraveller(t.id, 'fullName', e.target.value)} placeholder="John Doe" />
                {errors[`${t.id}-fullName`] && <p className="text-[10px] text-red-500 mt-0.5">{errors[`${t.id}-fullName`]}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase text-muted-foreground">Gender *</label>
                  <Select value={t.gender} onValueChange={val => updateTraveller(t.id, 'gender', val)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors[`${t.id}-gender`] && <p className="text-[10px] text-red-500 mt-0.5">{errors[`${t.id}-gender`]}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase text-muted-foreground">Date of Birth *</label>
                  <Input type="date" value={t.dob} onChange={e => updateTraveller(t.id, 'dob', e.target.value)} />
                  {errors[`${t.id}-dob`] && <p className="text-[10px] text-red-500 mt-0.5">{errors[`${t.id}-dob`]}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase text-muted-foreground">Phone Number {t.isPrimary && "*"}</label>
                <Input value={t.phone} onChange={e => updateTraveller(t.id, 'phone', e.target.value)} placeholder="+91 9876543210" />
                {errors[`${t.id}-phone`] && <p className="text-[10px] text-red-500 mt-0.5">{errors[`${t.id}-phone`]}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase text-muted-foreground">Email Address {t.isPrimary && "*"}</label>
                <Input type="email" value={t.email} onChange={e => updateTraveller(t.id, 'email', e.target.value)} placeholder="john@example.com" />
                {errors[`${t.id}-email`] && <p className="text-[10px] text-red-500 mt-0.5">{errors[`${t.id}-email`]}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase text-[#E53E3E]">Aadhaar Number *</label>
                <Input value={t.aadhaarNumber} onChange={e => updateTraveller(t.id, 'aadhaarNumber', e.target.value)} placeholder="1234 5678 9012" />
                {errors[`${t.id}-aadhaarNumber`] && <p className="text-[10px] text-red-500 mt-0.5">{errors[`${t.id}-aadhaarNumber`]}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase text-muted-foreground">Passport (Optional)</label>
                <Input value={t.passportNumber} onChange={e => updateTraveller(t.id, 'passportNumber', e.target.value)} placeholder="A1234567" />
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase text-muted-foreground">Food Preference</label>
                <Select value={t.foodPreference} onValueChange={val => updateTraveller(t.id, 'foodPreference', val)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="veg">Vegetarian</SelectItem>
                    <SelectItem value="non-veg">Non-Vegetarian</SelectItem>
                    <SelectItem value="vegan">Vegan</SelectItem>
                    <SelectItem value="jain">Jain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase text-muted-foreground">Medical Conditions (If any)</label>
                <Input value={t.medicalConditions} onChange={e => updateTraveller(t.id, 'medicalConditions', e.target.value)} placeholder="e.g. Asthma, allergies" />
              </div>
            </div>

            {t.isPrimary && (
              <div className="border-t border-border pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase text-[#E53E3E]">Emergency Contact Name *</label>
                  <Input value={t.emergencyContactName} onChange={e => updateTraveller(t.id, 'emergencyContactName', e.target.value)} placeholder="Jane Doe" />
                  {errors[`${t.id}-emergencyContactName`] && <p className="text-[10px] text-red-500 mt-0.5">{errors[`${t.id}-emergencyContactName`]}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase text-[#E53E3E]">Emergency Contact Phone *</label>
                  <Input value={t.emergencyContactPhone} onChange={e => updateTraveller(t.id, 'emergencyContactPhone', e.target.value)} placeholder="+91 9876543210" />
                  {errors[`${t.id}-emergencyContactPhone`] && <p className="text-[10px] text-red-500 mt-0.5">{errors[`${t.id}-emergencyContactPhone`]}</p>}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-2">
        <Button variant="outline" onClick={addTraveller} className="text-xs font-poppins gap-2">
          <UserPlus className="h-4 w-4" /> Add Co-Explorer
        </Button>
        <Button onClick={handleNext} className="bg-primary text-white hover:bg-primary/90 px-8">
          Proceed to Accommodation
        </Button>
      </div>
    </div>
  );
}
