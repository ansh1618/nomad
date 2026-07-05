import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Send,
  MessageSquare,
  Mail,
  Smartphone,
  Info,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/admin/notifications")({
  component: AdminNotifications,
});

function AdminNotifications() {
  const [channel, setChannel] = useState("WHATSAPP");
  const [audience, setAudience] = useState("ALL_CUSTOMERS");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      // Send logic simulation.
      // Call Supabase edges functions or notify engine.
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success("Broadcast dispatched successfully");
      setSubject("");
      setMessage("");
    } catch (err: any) {
      toast.error(err.message || "Failed to dispatch notification");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-foreground">Notification Broadcast Center</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Dispatch transactional updates or promotion runs across Email, WhatsApp, and SMS channels.
        </p>
      </div>

      <form onSubmit={handleSend} className="bg-white border border-border p-6 rounded-xl space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Communication Channel</Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WHATSAPP">WhatsApp CRM Template</SelectItem>
                <SelectItem value="EMAIL">System Email Alert</SelectItem>
                <SelectItem value="SMS">Transactional SMS Push</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Target Audience</Label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL_CUSTOMERS">All registered explorers</SelectItem>
                <SelectItem value="ACTIVE_BOOKINGS">Explorers on upcoming trips</SelectItem>
                <SelectItem value="LEADS">New Inquiry leads</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {channel === "EMAIL" && (
          <div className="space-y-1.5">
            <Label htmlFor="sub">Email Subject Line</Label>
            <Input id="sub" value={subject} onChange={e => setSubject(e.target.value)} required placeholder="e.g. Important trip instructions for Manali" />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="msg">Message / Body Content</Label>
          <Textarea id="msg" value={message} onChange={e => setMessage(e.target.value)} required rows={6} placeholder="Type broadcast message..." />
          <p className="text-[10px] text-muted-foreground italic flex items-center gap-1"><Info className="h-3.5 w-3.5 text-blue-500" /> Keep templates simple to ensure quick delivery approvals.</p>
        </div>

        <div className="flex justify-end pt-4 border-t border-border mt-6">
          <Button type="submit" disabled={sending} className="bg-primary hover:bg-primary/90 px-8 gap-2">
            {sending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Dispatching...</>
            ) : (
              <><Send className="h-4 w-4" /> Send Broadcast</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
