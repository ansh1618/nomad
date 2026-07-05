import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  FileText,
  Edit2,
  Trash2,
  Calendar,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/admin/blog")({
  component: AdminBlog,
});

function AdminBlog() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBlogs(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load blogs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post? This action is permanent.")) return;

    try {
      const { error } = await supabase.from("blogs").delete().eq("id", id);
      if (error) throw error;
      toast.success("Blog post deleted successfully");
      fetchBlogs();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete blog post");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-foreground">Blog CMS</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create, schedule, edit, and publish SEO travel articles and tips.
          </p>
        </div>
        <Link to="/admin/blog/$id" params={{ id: "new" }}>
          <Button className="gap-1.5 bg-primary">
            <Plus className="h-4 w-4" /> Add Blog Post
          </Button>
        </Link>
      </div>

      {/* Blogs Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading articles...</p>
          </div>
        ) : blogs.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            No blog posts written yet. Write your first post above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Title</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Published At</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Created At</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blogs.map((b) => (
                  <tr key={b.id} className="border-b border-border/50 hover:bg-muted/10 transition">
                    <td className="py-3 px-4 font-semibold">{b.title}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        b.is_published ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {b.is_published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      {b.published_at ? new Date(b.published_at).toLocaleDateString('en-IN') : '-'}
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(b.created_at).toLocaleDateString('en-IN')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <Link to="/admin/blog/$id" params={{ id: b.id }}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(b.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
