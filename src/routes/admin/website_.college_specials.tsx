import { useState, useEffect } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Save, GraduationCap, Eye, EyeOff } from 'lucide-react';
import { getCollegeSpecials, DEFAULT_COLLEGE_SPECIALS, CollegeSpecial } from '@/lib/queries/college-specials';
import { updateSiteSetting } from '@/lib/queries/cms';

export const Route = createFileRoute('/admin/website_/college_specials')({
  component: AdminCollegeSpecialsPage,
});

function AdminCollegeSpecialsPage() {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<CollegeSpecial[]>(DEFAULT_COLLEGE_SPECIALS);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: dbSpecials, isLoading } = useQuery({
    queryKey: ['college_specials_admin'],
    queryFn: getCollegeSpecials,
  });

  useEffect(() => {
    if (dbSpecials && dbSpecials.length > 0) {
      setItems(dbSpecials);
    }
  }, [dbSpecials]);

  const saveMutation = useMutation({
    mutationFn: async (updatedList: CollegeSpecial[]) => {
      await updateSiteSetting('college_specials', JSON.stringify(updatedList));
    },
    onSuccess: () => {
      toast.success('College Specials updated successfully');
      queryClient.invalidateQueries({ queryKey: ['college_specials'] });
      queryClient.invalidateQueries({ queryKey: ['college_specials_admin'] });
    },
    onError: (err: any) => {
      toast.error(`Failed to save: ${err.message}`);
    },
  });

  const handleToggleVisibility = (id: string) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, is_visible: !item.is_visible } : item
    );
    setItems(updated);
    saveMutation.mutate(updated);
  };

  const handleUpdateItem = (id: string, fields: Partial<CollegeSpecial>) => {
    const updated = items.map((item) => (item.id === id ? { ...item, ...fields } : item));
    setItems(updated);
  };

  const handleSave = () => {
    saveMutation.mutate(items);
  };

  const handleAddNew = () => {
    const newId = `college-${Date.now()}`;
    const newItem: CollegeSpecial = {
      id: newId,
      college_name: 'New College',
      short_name: 'COLLEGE',
      journey_slug: 'udaipur',
      page_href: '/destinations/udaipur',
      headline: 'GoNomadik × New College',
      trip_title: 'UDAIPUR 2026',
      subtitle: 'College Getaway',
      description: '2 Nights • 3 Days of adventure & fun memories with your college gang.',
      price: 6499,
      badge_text: 'SPECIAL COLLEGE TRIP',
      badge_accent: 'LIMITED SEATS',
      is_all_girls: false,
      coupon_code: null,
      coupon_discount_text: null,
      chips: ['Udaipur 2026', 'College Special', '2 Nights / 3 Days'],
      cta_text: 'Explore Trip →',
      accent_gradient: 'from-[#102A43] via-[#1A365D] to-[#0F2942]',
      is_visible: true,
      display_order: items.length + 1,
    };
    const updated = [...items, newItem];
    setItems(updated);
    setEditingId(newId);
  };

  const handleDelete = (id: string) => {
    if (items.length <= 1) {
      toast.error('At least one college special must remain');
      return;
    }
    const updated = items.filter((item) => item.id !== id);
    setItems(updated);
    saveMutation.mutate(updated);
  };

  return (
    <div className="space-y-6 font-poppins pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/website"
            className="p-2 rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-display flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-blue-600" />
              College Specials Manager
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage campus trip collaborations displayed on the homepage (Miranda House, BPIT & future colleges).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleAddNew} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add College Special
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2 bg-primary">
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {items.map((item) => {
          const isEditing = editingId === item.id;
          return (
            <Card key={item.id} className="border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 font-bold text-xs uppercase">
                    {item.short_name}
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">
                      {item.headline || `GoNomadik × ${item.college_name}`}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {item.trip_title} — {item.subtitle} | Starting ₹{item.price}
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`vis-${item.id}`} className="text-xs text-muted-foreground">
                      {item.is_visible ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          <Eye className="h-3.5 w-3.5" /> Visible
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-400">
                          <EyeOff className="h-3.5 w-3.5" /> Hidden
                        </span>
                      )}
                    </Label>
                    <Switch
                      id={`vis-${item.id}`}
                      checked={item.is_visible}
                      onCheckedChange={() => handleToggleVisibility(item.id)}
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingId(isEditing ? null : item.id)}
                  >
                    {isEditing ? 'Close Edit' : 'Edit Details'}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              {isEditing && (
                <CardContent className="pt-4 border-t border-border space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">College Name</Label>
                      <Input
                        value={item.college_name}
                        onChange={(e) => handleUpdateItem(item.id, { college_name: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">Short Code (e.g. BPIT)</Label>
                      <Input
                        value={item.short_name}
                        onChange={(e) => handleUpdateItem(item.id, { short_name: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">Price (₹)</Label>
                      <Input
                        type="number"
                        value={item.price}
                        onChange={(e) => handleUpdateItem(item.id, { price: Number(e.target.value) })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">Card Headline</Label>
                      <Input
                        value={item.headline}
                        onChange={(e) => handleUpdateItem(item.id, { headline: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">Subtitle Line</Label>
                      <Input
                        value={item.subtitle}
                        onChange={(e) => handleUpdateItem(item.id, { subtitle: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Description</Label>
                    <Textarea
                      rows={2}
                      value={item.description}
                      onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">CTA Text</Label>
                      <Input
                        value={item.cta_text}
                        onChange={(e) => handleUpdateItem(item.id, { cta_text: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">Target Route Href</Label>
                      <Input
                        value={item.page_href}
                        onChange={(e) => handleUpdateItem(item.id, { page_href: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">Coupon Code (Optional)</Label>
                      <Input
                        value={item.coupon_code || ''}
                        onChange={(e) => handleUpdateItem(item.id, { coupon_code: e.target.value || null })}
                        placeholder="e.g. STUTI500"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
