import { createFileRoute } from '@tanstack/react-router';
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Upload, Search, FileText, Settings, Archive, RefreshCw, BarChart3, Users, Clock, 
  ArrowUpRight, Lock, Unlock, Eye, FileDown, CheckCircle2, ShieldAlert, AlertCircle, Copy, Printer,
  Loader2
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { getJourneys } from '@/lib/queries-client';
import {
  getAllPackageDocumentsFn,
  createOrUpdateDocumentFn,
  archiveDocumentFn,
  restoreDocumentFn,
  getAdminPdfAnalyticsFn,
  getItineraryLeadsFn,
  uploadDocumentFileFn
} from '@/lib/itinerary-pdf-fns';

export const Route = createFileRoute('/admin/itinerary-pdfs')({
  component: AdminPremiumDocumentsPage,
});

type DocType = 'ITINERARY' | 'PACKING' | 'GUIDE' | 'TERMS' | 'OTHER' | 'VOUCHER' | 'INVOICE';

function AdminPremiumDocumentsPage() {
  const qc = useQueryClient();
  const { admin } = useAdminAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'library' | 'analytics' | 'leads'>('library');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);

  // Form states
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [documentType, setDocumentType] = useState<DocType>('ITINERARY');
  const [title, setTitle] = useState('');
  const [allowDownload, setAllowDownload] = useState(true);
  const [allowPrint, setAllowPrint] = useState(true);
  const [allowCopy, setAllowCopy] = useState(true);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Queries
  const { data: packages = [], isLoading: loadingPackages } = useQuery({
    queryKey: ['admin_packages_list'],
    queryFn: async () => {
      const data = await getJourneys();
      return data || [];
    }
  });

  const { data: documents = [], isLoading: loadingDocs } = useQuery({
    queryKey: ['admin_documents'],
    queryFn: () => getAllPackageDocumentsFn()
  });

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['admin_pdf_analytics'],
    queryFn: () => getAdminPdfAnalyticsFn(),
    enabled: activeTab === 'analytics'
  });

  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ['admin_pdf_leads'],
    queryFn: () => getItineraryLeadsFn(),
    enabled: activeTab === 'leads'
  });

  // Mutations
  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveDocumentFn({ data: id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_documents'] });
      qc.invalidateQueries({ queryKey: ['admin_pdf_analytics'] });
      toast.success('Document archived successfully');
    },
    onError: (err: Error) => toast.error(err.message)
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreDocumentFn({ data: id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_documents'] });
      qc.invalidateQueries({ queryKey: ['admin_pdf_analytics'] });
      toast.success('Document restored successfully');
    },
    onError: (err: Error) => toast.error(err.message)
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (payload: any) => createOrUpdateDocumentFn(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_documents'] });
      toast.success('Document settings updated');
    },
    onError: (err: Error) => toast.error(err.message)
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are supported');
        return;
      }
      if (file.size > 30 * 1024 * 1024) {
        toast.error('File size cannot exceed 30 MB');
        return;
      }
      setSelectedFile(file);
      if (!title) {
        // Auto prefill title from filename
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        setTitle(nameWithoutExt.split('-').join(' ').split('_').join(' '));
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackageId || !title || !selectedFile) {
      toast.error('Please fill in all fields and select a PDF file.');
      return;
    }

    setUploading(true);
    try {
      // Read file as base64
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = async () => {
        const base64String = (reader.result as string).split(',')[1];
        
        await uploadDocumentFileFn({
          data: {
            packageId: selectedPackageId,
            documentType,
            title,
            fileName: selectedFile.name,
            fileBase64: base64String,
            fileSize: selectedFile.size,
            allowDownload,
            allowPrint,
            allowCopy,
            watermarkEnabled,
            uploadedBy: admin?.id
          }
        });

        toast.success('Premium Document uploaded successfully!');
        qc.invalidateQueries({ queryKey: ['admin_documents'] });
        
        // Reset states
        setSelectedPackageId('');
        setTitle('');
        setSelectedFile(null);
        setUploadOpen(false);
      };
      reader.onerror = () => {
        toast.error('Failed to read file');
      };
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Filter logic
  const filteredDocs = documents.filter((doc: any) => {
    const pkgName = doc.journeys?.name || '';
    const docTitle = doc.title || '';
    const searchLower = searchTerm.toLowerCase();
    return pkgName.toLowerCase().includes(searchLower) || docTitle.toLowerCase().includes(searchLower);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-primary flex items-center gap-2">
            <FileText className="h-6 w-6 text-accent" /> Premium Document Manager
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure private PDFs (Itineraries, Packing checklists, Hotel vouchers, Vouchers) with advanced restrictions.
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)} className="gap-2 self-stretch sm:self-auto font-poppins font-semibold shadow-md">
          <Upload className="h-4 w-4" /> Upload Document
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="library" className="flex gap-1.5 font-poppins font-semibold"><FileText className="h-4 w-4" /> Library</TabsTrigger>
          <TabsTrigger value="analytics" className="flex gap-1.5 font-poppins font-semibold"><BarChart3 className="h-4 w-4" /> Analytics</TabsTrigger>
          <TabsTrigger value="leads" className="flex gap-1.5 font-poppins font-semibold"><Users className="h-4 w-4" /> Leads</TabsTrigger>
        </TabsList>

        {/* LIBRARY TAB */}
        <TabsContent value="library" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search packages or documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
          </div>

          <Card className="rounded-2xl border-border shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              {loadingDocs || loadingPackages ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground font-poppins">
                  <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  No premium documents found. Click "Upload Document" to configure one.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Package Name</TableHead>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Specs</TableHead>
                      <TableHead>Settings</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocs.map((doc: any) => (
                      <TableRow key={doc.id} className={!doc.is_active ? 'opacity-60 bg-muted/10' : ''}>
                        <TableCell className="font-semibold text-primary">{doc.journeys?.name}</TableCell>
                        <TableCell>
                          <span className="text-[10px] uppercase font-poppins font-bold bg-secondary/10 text-secondary px-2.5 py-1 rounded-full border border-secondary/20">
                            {doc.document_type}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{doc.title}</TableCell>
                        <TableCell className="text-xs text-muted-foreground space-y-0.5">
                          <div>Size: {Math.round(doc.size / 1024)} KB</div>
                          <div>Ver: v{doc.version}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded ${doc.allow_download ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                              {doc.allow_download ? <FileDown className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                              Download
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded ${doc.allow_print ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                              <Printer className="h-3 w-3" /> Print: {doc.allow_print ? 'ON' : 'OFF'}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded ${doc.allow_copy ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                              <Copy className="h-3 w-3" /> Copy: {doc.allow_copy ? 'ON' : 'OFF'}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded ${doc.watermark_enabled ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-500'}`}>
                              Watermark: {doc.watermark_enabled ? 'ON' : 'OFF'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {doc.is_active ? (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full font-bold">
                              <CheckCircle2 className="h-3 w-3" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-yellow-50 text-yellow-700 px-2.5 py-0.5 rounded-full font-bold">
                              <Archive className="h-3 w-3" /> Archived
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            {/* Toggle PDF settings */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                updateSettingsMutation.mutate({
                                  package_id: doc.package_id,
                                  document_type: doc.document_type,
                                  title: doc.title,
                                  file_url: doc.file_url,
                                  allow_download: !doc.allow_download,
                                  version: doc.version,
                                  is_active: doc.is_active
                                });
                              }}
                              title={doc.allow_download ? 'Disable Downloads' : 'Enable Downloads'}
                              className="h-8 w-8 text-primary"
                            >
                              {doc.allow_download ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                            </Button>
                            
                            <a href={`/account/itinerary/${doc.journeys?.slug}?type=${doc.document_type}`} target="_blank" rel="noreferrer">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Preview PDF inside App">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </a>

                            {doc.is_active ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => archiveMutation.mutate(doc.id)}
                                title="Archive Document"
                                disabled={archiveMutation.isPending}
                                className="h-8 w-8 text-yellow-600 hover:text-yellow-700"
                              >
                                <Archive className="h-3.5 w-3.5" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => restoreMutation.mutate(doc.id)}
                                title="Restore Document"
                                disabled={restoreMutation.isPending}
                                className="h-8 w-8 text-green-600 hover:text-green-700"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANALYTICS TAB */}
        <TabsContent value="analytics" className="space-y-6">
          {loadingAnalytics ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : (
            <>
              {/* Aggregated stats cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="rounded-2xl shadow-sm border-border">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-poppins font-bold uppercase tracking-wider">Total Document Views</p>
                      <h3 className="text-2xl font-bold text-primary mt-1">{analytics?.totalViews}</h3>
                    </div>
                    <div className="p-3 rounded-2xl bg-secondary/10 text-secondary">
                      <Eye className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-sm border-border">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-poppins font-bold uppercase tracking-wider">Unique Readers</p>
                      <h3 className="text-2xl font-bold text-primary mt-1">{analytics?.uniqueUsers}</h3>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                      <Users className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-sm border-border">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-poppins font-bold uppercase tracking-wider">Total PDF Downloads</p>
                      <h3 className="text-2xl font-bold text-primary mt-1">{analytics?.totalDownloads}</h3>
                    </div>
                    <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
                      <FileDown className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-sm border-border">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-poppins font-bold uppercase tracking-wider">Average Reading Time</p>
                      <h3 className="text-2xl font-bold text-primary mt-1">{Math.round((analytics?.avgReadingTime ?? 0) / 60)}m { (analytics?.avgReadingTime ?? 0) % 60 }s</h3>
                    </div>
                    <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                      <Clock className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Extra summary cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Document Performance Table */}
                <Card className="rounded-2xl shadow-sm border-border lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base font-bold font-poppins">Document Analytics</CardTitle>
                    <CardDescription className="text-xs">Individual reader performance, page views and bounce rates.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document / Package</TableHead>
                          <TableHead>Views</TableHead>
                          <TableHead>Downloads</TableHead>
                          <TableHead>Unique Users</TableHead>
                          <TableHead>Avg Time</TableHead>
                          <TableHead>Bounce Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics?.allDocuments.map((doc: any) => (
                          <TableRow key={doc.id}>
                            <TableCell>
                              <div className="font-semibold text-primary">{doc.title}</div>
                              <div className="text-[10px] text-muted-foreground uppercase font-bold mt-0.5">{doc.packageName} · {doc.type}</div>
                            </TableCell>
                            <TableCell>{doc.views}</TableCell>
                            <TableCell>{doc.downloads}</TableCell>
                            <TableCell>{doc.uniqueUsersCount}</TableCell>
                            <TableCell>{Math.round(doc.avgReadingTime / 60)}m {doc.avgReadingTime % 60}s</TableCell>
                            <TableCell>
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${doc.bounceRate > 60 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                                {doc.bounceRate}%
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Top Documents List */}
                <Card className="rounded-2xl shadow-sm border-border">
                  <CardHeader>
                    <CardTitle className="text-base font-bold font-poppins">Most Active Itineraries</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analytics?.topDocuments.map((doc: any, i: number) => (
                      <div key={doc.id} className="flex justify-between items-center pb-3 border-b last:border-0 last:pb-0">
                        <div className="flex gap-2.5 items-center min-w-0">
                          <span className="h-6 w-6 rounded-full bg-accent/15 text-accent flex items-center justify-center font-bold text-xs">{i+1}</span>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-primary truncate">{doc.title}</h4>
                            <p className="text-[10px] text-muted-foreground truncate">{doc.packageName}</p>
                          </div>
                        </div>
                        <span className="text-xs font-poppins font-bold text-primary flex items-center gap-1">
                          {doc.views} views <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* LEADS TAB */}
        <TabsContent value="leads" className="space-y-4">
          <Card className="rounded-2xl border-border shadow-sm">
            <CardHeader className="flex flex-row justify-between items-center flex-wrap gap-2">
              <div>
                <CardTitle className="text-base font-bold font-poppins">Document Unlock Leads</CardTitle>
                <CardDescription className="text-xs">User emails and phones collected prior to sign-in from the PDF modal.</CardDescription>
              </div>
              <div className="bg-secondary/10 text-secondary border border-secondary/20 px-3 py-1.5 rounded-full text-xs font-poppins font-bold">
                Total Captured: {leads.length}
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {loadingLeads ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              ) : leads.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground font-poppins">
                  No captured leads found.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Email Address</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Interested Package</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Captured At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead: any) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-semibold text-primary">{lead.email}</TableCell>
                        <TableCell className="font-mono text-xs">{lead.phone || '-'}</TableCell>
                        <TableCell>{lead.journeys?.name}</TableCell>
                        <TableCell>{lead.city || '-'}</TableCell>
                        <TableCell>
                          <span className="text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded">
                            {lead.source}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(lead.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* UPLOAD DOCUMENT DIALOG */}
      <Dialog open={uploadOpen} onOpenChange={(v) => { if (!uploading) setUploadOpen(v); }}>
        <DialogContent className="max-w-md bg-background border border-border p-6 rounded-2xl shadow-elegant">
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-bold tracking-wide text-primary">Upload Premium Document</DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs mt-1">
                Upload a PDF under Udaipur, Mount Abu, Manali packages to offer premium, locked details.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Select Package *</Label>
                <Select value={selectedPackageId} onValueChange={setSelectedPackageId} required>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select a package" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {packages.map((pkg: any) => (
                      <SelectItem key={pkg.id} value={pkg.id}>{pkg.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Document Type *</Label>
                  <Select value={documentType} onValueChange={(v: DocType) => setDocumentType(v)} required>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ITINERARY">Main Itinerary</SelectItem>
                      <SelectItem value="PACKING">Packing Checklist</SelectItem>
                      <SelectItem value="GUIDE">Travel Guide</SelectItem>
                      <SelectItem value="TERMS">Terms & Policies</SelectItem>
                      <SelectItem value="OTHER">Other PDF</SelectItem>
                      <SelectItem value="VOUCHER">Trip Voucher</SelectItem>
                      <SelectItem value="INVOICE">Invoice Sample</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Document Title *</Label>
                  <Input
                    placeholder="e.g. Premium Travel Guide"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="h-10"
                  />
                </div>
              </div>

              {/* PDF Settings switches */}
              <div className="space-y-3 p-3 bg-muted/20 border border-border/60 rounded-xl">
                <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Restrictions & Security</Label>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-primary">Allow Download File</span>
                  <Switch checked={allowDownload} onCheckedChange={setAllowDownload} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-primary">Allow Printing</span>
                  <Switch checked={allowPrint} onCheckedChange={setAllowPrint} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-primary">Allow Text Copy/Selection</span>
                  <Switch checked={allowCopy} onCheckedChange={setAllowCopy} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-primary">Enable User-Specific Watermark</span>
                  <Switch checked={watermarkEnabled} onCheckedChange={setWatermarkEnabled} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Select PDF File (Max 30MB) *</Label>
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  required
                  ref={fileInputRef}
                  className="h-10 cursor-pointer pt-1.5 bg-muted/10 border"
                />
                {selectedFile && (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                    Verified: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB PDF file loaded
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="mt-4 pt-4 border-t gap-2">
              <Button type="button" variant="outline" onClick={() => setUploadOpen(false)} disabled={uploading}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading} className="gap-2 min-w-32">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? 'Uploading...' : 'Upload PDF'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
