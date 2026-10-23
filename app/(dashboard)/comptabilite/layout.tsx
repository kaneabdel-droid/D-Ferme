import Link from 'next/link'
import { BookOpen, FileText, Scale, BarChart3, FileSpreadsheet, Crown } from 'lucide-react'
import { getTenantContext } from '@/utils/supabase/tenant'

export default async function ComptabiliteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const tenant = await getTenantContext()
  const isPremium = tenant?.subscriptionTier === 'premium'

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
                Comptabilité & Trésorerie d'Exploitation
              </h1>
              <p className="text-sm text-foreground-muted">
                SYSCOHADA Révisé agricole : Livre-journal, balance générale, compte de résultat et bilan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isPremium ? (
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-bold flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" /> Forfait Prémium Actif
              </span>
            ) : (
              <Link
                href="/abonnement"
                className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold flex items-center gap-1.5 hover:bg-primary/20 transition-colors"
              >
                <Crown className="w-3.5 h-3.5" /> Débloquer Bilan & Résultat (Prémium)
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
          <span>Journaux de Saisie</span>
        </Link>

        <Link
          href="/comptabilite/bilan"
          className="bg-surface text-foreground-muted hover:text-foreground rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border border-surface-border transition-colors hover:border-primary/40 group"
        >
          <FileSpreadsheet className="w-4 h-4 text-amber-500" />
          <span>Bilan Comptable</span>
          <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-0.5" />
        </Link>

        <Link
          href="/comptabilite/resultat"
          className="bg-surface text-foreground-muted hover:text-foreground rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border border-surface-border transition-colors hover:border-primary/40 group"
        >
          <BarChart3 className="w-4 h-4 text-emerald-500" />
          <span>Compte de Résultat</span>
          <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-0.5" />
        </Link>

        <Link
          href="/comptabilite/balance"
          className="bg-surface text-foreground-muted hover:text-foreground rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border border-surface-border transition-colors hover:border-primary/40 group"
        >
          <Scale className="w-4 h-4 text-secondary" />
          <span>Grand Livre & Balance</span>
          <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-0.5" />
        </Link>

        <Link
          href="/comptabilite/plan-comptable"
          className="bg-surface text-foreground-muted hover:text-foreground rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border border-surface-border transition-colors hover:border-primary/40"
        >
          <BookOpen className="w-4 h-4 text-primary" />
          <span>Plan Comptable SYSCOHADA</span>
        </Link>
      </nav>

      {children}
    </div>
  )
}
