import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Settings, Landmark, ShieldCheck, Save } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Business settings states
  const [companyName, setCompanyName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  // Policies states
  const [refundPolicy, setRefundPolicy] = useState("");
  const [terms, setTerms] = useState("");

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("*");

      if (error) throw error;
      if (data) {
        // Map settings based on keys
        data.forEach(item => {
          if (item.key === "company_name") setCompanyName(item.value?.text || "");
          if (item.key === "gst_number") setGstNumber(item.value?.text || "");
          if (item.key === "address") setAddress(item.value?.text || "");
          if (item.key === "phone") setPhone(item.value?.text || "");
          if (item.key === "email") setEmail(item.value?.text || "");
          if (item.key === "logo_url") setLogoUrl(item.value?.text || "");
          if (item.key === "refund_policy") setRefundPolicy(item.value?.text || "");
          if (item.key === "terms_and_conditions") setTerms(item.value?.text || "");
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const keysToUpsert = [
      { category: "business", key: "company_name", value: { text: companyName } },
      { category: "business", key: "gst_number", value: { text: gstNumber } },
      { category: "business", key: "address", value: { text: address } },
      { category: "business", key: "phone", value: { text: phone } },
      { category: "business", key: "email", value: { text: email } },
      { category: "business", key: "logo_url", value: { text: logoUrl } },
      { category: "policies", key: "refund_policy", value: { text: refundPolicy } },
      { category: "policies", key: "terms_and_conditions", value: { text: terms } },
    ];

    try {
      // Upsert sequentially in mock context
      for (const item of keysToUpsert) {
        const { error } = await supabase
          .from("settings")
          .upsert([item], { onConflict: "key" });
        if (error) throw error;
      }
      toast.success("System configurations saved successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading configurations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-foreground">Global settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure business metadata, invoices details, terms, and cancellations rules.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Tabs defaultValue="business" className="w-full">
          <TabsList className="bg-muted border border-border w-full justify-start overflow-x-auto rounded-xl">
            <TabsTrigger value="business">Business Info</TabsTrigger>
            <TabsTrigger value="policies">Policies & Legal</TabsTrigger>
          </TabsList>

          <TabsContent value="business" className="bg-white p-6 rounded-xl border border-border mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="cname">Company Registered Name</Label>
                <Input id="cname" value={companyName} onChange={e => setCompanyName(e.target.value)} required placeholder="Nomadik Travels Pvt Ltd" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="gst">GSTIN Number (for invoices)</Label>
                <Input id="gst" value={gstNumber} onChange={e => setGstNumber(e.target.value)} placeholder="07AAAAA0000A1Z5" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="tel">Support Phone</Label>
                <Input id="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+91 9876543210" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="mail">Official Email Address</Label>
                <Input id="mail" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="bookings@nomadik.co.in" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="logo">Logo URL</Label>
                <Input id="logo" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="addr">Registered Address</Label>
              <Textarea id="addr" rows={3} value={address} onChange={e => setAddress(e.target.value)} placeholder="Corporate office address..." />
            </div>
          </TabsContent>

          {/* Legal and Policies */}
          <TabsContent value="policies" className="bg-white p-6 rounded-xl border border-border mt-4 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="refund">Cancellations & Refund Policies (Markdown)</Label>
              <Textarea id="refund" rows={6} value={refundPolicy} onChange={e => setRefundPolicy(e.target.value)} placeholder="Markdown syntax support..." />
            </div>
            <div className="space-y-1 pt-3">
              <Label htmlFor="terms">Terms & Conditions (Markdown)</Label>
              <Textarea id="terms" rows={6} value={terms} onChange={e => setTerms(e.target.value)} placeholder="Markdown syntax support..." />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 px-8 gap-2">
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4" /> Save Configurations</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
