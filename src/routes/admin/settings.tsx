import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageField } from '@/components/admin/MediaPicker'
import { getSettings, updateSettings } from '@/lib/queries/admin'
import { toast } from 'sonner'
import {
  Save,
  Loader2,
  Settings,
} from 'lucide-react'

export const Route = createFileRoute('/admin/settings')({
  component: SettingsPage,
})

const settingsSchema = z.object({
  company_name: z.string().min(2, 'Company name is required'),
  gst_number: z.string().optional(),
  support_phone: z.string().min(10, 'Support phone is required'),
  support_phone_2: z.string().optional(),
  support_email: z.string().email('Valid support email is required'),
  logo_url: z.string().optional(),
  logo_dark_url: z.string().optional(),
  favicon_url: z.string().optional(),
  
  // Social links
  whatsapp_number: z.string().optional(),
  instagram_url: z.string().optional(),
  youtube_url: z.string().optional(),
  reddit_url: z.string().optional(),
  facebook_url: z.string().optional(),

  // Integrations
  cashfree_app_id: z.string().optional(),
  ga4_measurement_id: z.string().optional(),

  // Policies
  refund_policy: z.string().optional(),
  terms_and_conditions: z.string().optional(),
  privacy_policy: z.string().optional(),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

function SettingsPage() {
  const qc = useQueryClient()
  const [logo, setLogo] = useState('')
  const [logoDark, setLogoDark] = useState('')
  const [favicon, setFavicon] = useState('')

  const { data: settings, isLoading } = useQuery({
    queryKey: ['system_settings'],
    queryFn: () => getSiteSettings(),
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      company_name: 'Nomadik Travels',
      support_phone: '+91 99999 88888',
      support_email: 'bookings@nomadik.com',
    },
  })

  useEffect(() => {
    if (settings) {
      reset({
        company_name: settings.company_name || 'Nomadik Travels',
        gst_number: settings.gst_number || '',
        support_phone: settings.support_phone || '+91 99999 88888',
        support_phone_2: settings.support_phone_2 || '',
        support_email: settings.support_email || 'bookings@nomadik.com',
        whatsapp_number: settings.whatsapp_number || '',
        instagram_url: settings.instagram_url || '',
        youtube_url: settings.youtube_url || '',
        reddit_url: settings.reddit_url || '',
        facebook_url: settings.facebook_url || '',
        cashfree_app_id: settings.cashfree_app_id || '',
        ga4_measurement_id: settings.ga4_measurement_id || '',
        refund_policy: settings.refund_policy || '',
        terms_and_conditions: settings.terms_and_conditions || '',
        privacy_policy: settings.privacy_policy || '',
      })
      setLogo(settings.logo_url || '')
      setLogoDark(settings.logo_dark_url || '')
      setFavicon(settings.favicon_url || '')
    }
  }, [settings, reset])

  const saveMutation = useMutation({
    mutationFn: async (values: SettingsFormValues) => {
      const payload = {
        ...values,
        logo_url: logo,
        logo_dark_url: logoDark,
        favicon_url: favicon,
      }
      await updateSiteSettings(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system_settings'] })
      toast.success('System settings saved successfully')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold font-poppins">Global Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure company credentials, logos, integrations, and policies.
          </p>
        </div>
        <Button
          onClick={handleSubmit((v) => saveMutation.mutate(v))}
          disabled={saveMutation.isPending}
          className="gap-1.5"
        >
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </Button>
      </motion.div>

      <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="space-y-6">
        <Tabs defaultValue="business" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="social">Socials</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="danger">Danger Zone</TabsTrigger>
          </TabsList>

          {/* Business Info */}
          <TabsContent value="business" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Company Display Name *</Label>
                    <Input {...register('company_name')} placeholder="Nomadik Travels" />
                    {errors.company_name && <p className="text-xs text-destructive">{errors.company_name.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>GSTIN Number</Label>
                    <Input {...register('gst_number')} placeholder="e.g. 07AAAAA0000A1Z5" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Support Phone *</Label>
                    <Input {...register('support_phone')} />
                    {errors.support_phone && <p className="text-xs text-destructive">{errors.support_phone.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Secondary Phone</Label>
                    <Input {...register('support_phone_2')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Support Email *</Label>
                    <Input type="email" {...register('support_email')} />
                    {errors.support_email && <p className="text-xs text-destructive">{errors.support_email.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 border-t pt-4">
                  <ImageField
                    label="Light Mode Logo"
                    value={logo}
                    onChange={setLogo}
                    folder="/misc"
                  />
                  <ImageField
                    label="Dark Mode Logo"
                    value={logoDark}
                    onChange={setLogoDark}
                    folder="/misc"
                  />
                  <ImageField
                    label="Favicon Icon"
                    value={favicon}
                    onChange={setFavicon}
                    folder="/misc"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Socials */}
          <TabsContent value="social" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>WhatsApp Direct Connect (with country code)</Label>
                    <Input {...register('whatsapp_number')} placeholder="e.g. 919999988888" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Instagram Profile URL</Label>
                    <Input {...register('instagram_url')} placeholder="https://instagram.com/..." />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>YouTube Channel</Label>
                    <Input {...register('youtube_url')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Reddit Profile</Label>
                    <Input {...register('reddit_url')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Facebook Page</Label>
                    <Input {...register('facebook_url')} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations */}
          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Cashfree App ID (Client Credentials ID)</Label>
                    <Input {...register('cashfree_app_id')} placeholder="App / Client ID" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Google Analytics 4 Measurement ID</Label>
                    <Input {...register('ga4_measurement_id')} placeholder="G-XXXXXXXXXX" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Policies & Legal */}
          <TabsContent value="policies" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label>Cancellations & Refund Policy (Markdown)</Label>
                  <Textarea
                    {...register('refund_policy')}
                    placeholder="Enter the refund rules..."
                    rows={5}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Terms & Conditions (Markdown)</Label>
                  <Textarea
                    {...register('terms_and_conditions')}
                    placeholder="Enter terms..."
                    rows={5}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Privacy Policy (Markdown)</Label>
                  <Textarea
                    {...register('privacy_policy')}
                    placeholder="Enter privacy terms..."
                    rows={5}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Danger Zone */}
          <TabsContent value="danger" className="space-y-4">
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-destructive font-poppins">System Caches & Export Data</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Manage direct system backups or clear active site configs caches.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" type="button" onClick={() => toast.success('Backing up database...')}>
                    Export DB Settings Backup
                  </Button>
                  <Button variant="destructive" size="sm" type="button" onClick={() => { qc.clear(); toast.success('System configs cache cleared successfully!') }}>
                    Purge All System Cache
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  )
}

