import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Activity, User, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/admin/activity")({
  component: AdminActivityLog,
});

const ACTION_BADGES: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
  STATUS_CHANGE: "bg-yellow-100 text-yellow-700",
  LOGIN: "bg-purple-100 text-purple-700",
};

function AdminActivityLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-foreground flex items-center gap-2"><ShieldAlert className="h-6 w-6 text-accent" /> Security Activity & Audit Logs</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Audits log detailing every administrator action, price tweaks, seat overrides, and dashboard config modifications.
        </p>
      </div>

      {/* Logs stack */}
      <div className="bg-white rounded-xl border border-border p-6 space-y-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading security logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            No administrator activities recorded in the ledger.
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="p-4 border border-border rounded-lg bg-muted/15 flex items-start justify-between text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <Activity className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground leading-relaxed">{log.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1 font-bold text-primary">
                        <User className="h-3.5 w-3.5" /> {log.admin_email || "System"}
                      </span>
                      <span>• IP: {log.ip_address || "N/A"}</span>
                      <span>• {new Date(log.created_at).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                <Badge className={`${ACTION_BADGES[log.action] || "bg-gray-100 text-gray-700"} text-[10px] uppercase font-bold border-0 shrink-0`}>
                  {log.action}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
