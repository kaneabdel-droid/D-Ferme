import Link from 'next/link'
import { BookOpen, FileText, Scale, BarChart3, FileSpreadsheet, Crown, Calculator } from 'lucide-react'
import { getTenantContext } from '@/utils/supabase/tenant'
import { getDictionary, getLocale } from '@/dictionaries'

export default async function ComptabiliteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const tenant = await getTenantContext()
  const isPremium = tenant?.subscriptionTier === 'premium'
  const locale = await getLocale()
  const dict = await getDictionary(locale)
  const c = dict.comptabilite || {}
  const tabs = c.tabs || {}

  return (
    <div className="space-y-6">
      <div className="border-b border-surface-border pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-heading text-foreground">
                {c.title || "Comptabilité & Trésorerie d'Exploitation"}
              </h1>
              <p className="text-sm text-foreground-muted">
                {c.subtitle || 'SYSCOHADA Révisé agricole : Livre-journal, balance générale, compte de résultat et bilan.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isPremium ? (
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-bold flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" /> {c.premium_active || 'Forfait Prémium Actif'}
              </span>
            ) : (
              <Link
                href="/abonnement"
                className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold flex items-center gap-1.5 hover:bg-primary/20 transition-colors"
              >
                <Crown className="w-3.5 h-3.5" /> {c.unlock_premium || 'Débloquer Bilan & Résultat (Prémium)'}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <nav className="flex flex-wrap gap-2 border-b border-surface-border pb-4" aria-label="Tabs Comptabilité">
        <Link
          href="/comptabilite"
          className="bg-surface text-foreground-muted hover:text-foreground rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border border-surface-border transition-colors hover:border-primary/40"
        >
          <FileText className="w-4 h-4 text-primary" />
          <span>{tabs.journaux || 'Journaux de Saisie'}</span>
        </Link>

        <Link
          href="/comptabilite/budget"
          className="bg-surface text-foreground-muted hover:text-foreground rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border border-surface-border transition-colors hover:border-primary/40 group"
        >
          <Calculator className="w-4 h-4 text-emerald-600" />
          <span>{tabs.budget || 'Suivi Budgétaire'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
            {dict.sidebar?.medium_badge || 'Médium'}
          </span>
        </Link>

        <Link
          href="/comptabilite/bilan"
          className="bg-surface text-foreground-muted hover:text-foreground rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border border-surface-border transition-colors hover:border-primary/40 group"
        >
          <FileSpreadsheet className="w-4 h-4 text-amber-500" />
          <span>{tabs.bilan || 'Bilan Comptable'}</span>
          <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-0.5" />
        </Link>

        <Link
          href="/comptabilite/resultat"
          className="bg-surface text-foreground-muted hover:text-foreground rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border border-surface-border transition-colors hover:border-primary/40 group"
        >
          <BarChart3 className="w-4 h-4 text-emerald-500" />
          <span>{tabs.resultat || 'Compte de Résultat'}</span>
          <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-0.5" />
        </Link>

        <Link
          href="/comptabilite/balance"
          className="bg-surface text-foreground-muted hover:text-foreground rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border border-surface-border transition-colors hover:border-primary/40 group"
        >
          <Scale className="w-4 h-4 text-secondary" />
          <span>{tabs.balance || 'Grand Livre & Balance'}</span>
          <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-0.5" />
        </Link>

        <Link
          href="/comptabilite/plan-comptable"
          className="bg-surface text-foreground-muted hover:text-foreground rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border border-surface-border transition-colors hover:border-primary/40"
        >
          <BookOpen className="w-4 h-4 text-primary" />
          <span>{tabs.plan || 'Plan Comptable SYSCOHADA'}</span>
        </Link>
      </nav>

      {children}
    </div>
  )
}
