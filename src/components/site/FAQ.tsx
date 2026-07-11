import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Reveal } from './Reveal'
import { ChevronDown } from 'lucide-react'
import { getFaqs } from '@/lib/queries/cms'
import type { Faq } from '@/lib/queries/cms'

function FaqAccordionItem({ item, isOpen, onToggle }: { item: Faq; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className={`rounded-2xl border transition-colors duration-300 ${isOpen ? 'border-gold/40 bg-gold/5' : 'border-border bg-white'}`}>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 p-5 text-left"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-semibold text-primary font-sans pr-4">{item.question}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180 text-gold' : ''}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-60 pb-5 px-5' : 'max-h-0'}`}
      >
        <p className="text-xs text-muted-foreground leading-relaxed font-sans">{item.answer}</p>
      </div>
    </div>
  )
}

function FaqSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
        <div className="h-5 w-5 bg-muted rounded" />
      </div>
    </div>
  )
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ['faqs', 'homepage'],
    queryFn: () => getFaqs('homepage'),
    staleTime: 1000,
  })

  return (
    <section id="faq" className="py-24">
      <div className="mx-auto max-w-3xl px-5">
        <Reveal className="text-center pb-12">
          <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-gold">
            GOT QUESTIONS?
          </span>
          <h2 className="mt-3 font-display text-4xl font-bold text-primary sm:text-5xl">
            Frequently Asked
          </h2>
          <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
            Everything you need to know before hitting the road with us.
          </p>
        </Reveal>

        <div className="space-y-3">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <FaqSkeleton key={i} />)
            : faqs.map((faq, i) => (
                <Reveal key={faq.id} delay={Math.min(i, 3)}>
                  <FaqAccordionItem
                    item={faq}
                    isOpen={openIndex === i}
                    onToggle={() => setOpenIndex(openIndex === i ? null : i)}
                  />
                </Reveal>
              ))}
        </div>
      </div>
    </section>
  )
}
