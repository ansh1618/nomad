import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  LayoutTemplate,
  Sliders,
  BarChart,
  CircleHelp,
  Menu as MenuIcon,
  Compass,
  Megaphone,
  Contact,
  Search,
  Paintbrush,
  FileText,
  ArrowRight,
  Globe,
  Settings
} from 'lucide-react'

export const Route = createFileRoute('/admin/website')({
  component: WebsiteBuilderHub,
})

const CMS_MODULES = [
  {
    title: 'Homepage Layout',
    description: 'Toggle visibility and drag-reorder home sections.',
    icon: LayoutTemplate,
    href: '/admin/website/homepage',
    color: 'text-indigo-600 bg-indigo-50',
  },
  {
    title: 'Hero & Slider Settings',
    description: 'Configure homepage background video, banner image, or slides.',
    icon: Sliders,
    href: '/admin/website/hero',
    color: 'text-rose-600 bg-rose-50',
  },
  {
    title: 'Travel Statistics',
    description: 'Edit live numbers like happy travelers, average ratings, etc.',
    icon: BarChart,
    href: '/admin/website/stats',
    color: 'text-emerald-600 bg-emerald-50',
  },
  {
    title: 'Announcement Bar',
    description: 'Set custom messages, colors, links & alerts at the top header.',
    icon: Megaphone,
    href: '/admin/website/announcement',
    color: 'text-amber-600 bg-amber-50',
  },
  {
    title: 'Global Navigation Builder',
    description: 'Manage main header navbar menus, links & ordering.',
    icon: MenuIcon,
    href: '/admin/website/navigation',
    color: 'text-blue-600 bg-blue-50',
  },
  {
    title: 'Footer Custom Columns',
    description: 'Design footer link headers, columns, social icons & copy.',
    icon: Compass,
    href: '/admin/website/footer',
    color: 'text-teal-600 bg-teal-50',
  },
  {
    title: 'Frequently Asked Questions',
    description: 'Manage Q&A lists across pages & destinations.',
    icon: CircleHelp,
    href: '/admin/website/faqs',
    color: 'text-violet-600 bg-violet-50',
  },
  {
    title: 'Contact & Map Details',
    description: 'Configure phone, official emails, social links & Google map iframe.',
    icon: Contact,
    href: '/admin/website/contact',
    color: 'text-pink-600 bg-pink-50',
  },
  {
    title: 'SEO Metadata Manager',
    description: 'Edit titles, meta keywords & OpenGraph social share cards per page.',
    icon: Search,
    href: '/admin/website/seo',
    color: 'text-cyan-600 bg-cyan-50',
  },
  {
    title: 'Theme & Custom Styles',
    description: 'Select brand accent colors, buttons styling, borders and typography.',
    icon: Paintbrush,
    href: '/admin/website/theme',
    color: 'text-orange-600 bg-orange-50',
  },
  {
    title: 'Company Policy Pages',
    description: 'Edit Markdown copy for About Us, Refund Policies, and terms.',
    icon: FileText,
    href: '/admin/website/pages',
    color: 'text-slate-600 bg-slate-50',
  },
  {
    title: 'Special Offers Editor',
    description: 'Edit countdown deal cards, offer titles, discounts and links.',
    icon: Globe,
    href: '/admin/website/special_offers',
    color: 'text-red-600 bg-red-50',
  },
  {
    title: 'Nomadik Experience Steps',
    description: 'Edit the 6-step experience timeline shown on the homepage.',
    icon: Settings,
    href: '/admin/website/experience_steps',
    color: 'text-purple-600 bg-purple-50',
  },
  {
    title: 'Our Promise Steps',
    description: 'Edit the 4-step "Book → Plan → Travel → Memories" section.',
    icon: LayoutTemplate,
    href: '/admin/website/our_promise',
    color: 'text-green-600 bg-green-50',
  },
  {
    title: 'Destinations Section Text',
    description: 'Edit the heading, badge, and description of the destinations grid.',
    icon: Compass,
    href: '/admin/website/popular_destinations',
    color: 'text-sky-600 bg-sky-50',
  },
  {
    title: 'Featured Packages Text',
    description: 'Edit the heading, badge, and description of the signature journeys grid.',
    icon: BarChart,
    href: '/admin/website/featured_packages',
    color: 'text-fuchsia-600 bg-fuchsia-50',
  },
  {
    title: 'Manifesto Section',
    description: 'Edit the "We Don\'t Believe in Selling Trips" quote, title and CTA button.',
    icon: FileText,
    href: '/admin/website/manifesto',
    color: 'text-rose-600 bg-rose-50',
  },
]

function WebsiteBuilderHub() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold font-poppins flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            Website CMS Builder
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure visual assets, announcements, colors, FAQ builders, navigation links and full-page SEO.
          </p>
        </div>
      </motion.div>

      {/* Grid of Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CMS_MODULES.map((module, i) => {
          const Icon = module.icon
          return (
            <motion.div
              key={module.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="hover:shadow-md transition-shadow duration-300 h-full flex flex-col justify-between">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl ${module.color} flex-shrink-0`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-base font-semibold font-poppins">{module.title}</CardTitle>
                      <CardDescription className="text-xs leading-relaxed">{module.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button asChild variant="ghost" size="sm" className="w-full justify-between hover:bg-muted font-poppins font-medium text-xs text-primary group pt-2 border-t">
                    <Link to={module.href as any}>
                      Open Editor
                      <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
