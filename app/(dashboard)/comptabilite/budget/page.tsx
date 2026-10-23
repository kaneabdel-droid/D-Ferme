import Link from 'next/link'
import { getTenantContext } from '@/utils/supabase/tenant'
import { getBudgets } from './actions'
import MediumBudgetLockView from '@/components/comptabilite/MediumBudgetLockView'
import NouveauBudgetModal from './NouveauBudgetModal'
import {
  Calculator,
  Target,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Archive,
} from 'lucide-react'

export default async function BudgetIndexPage({
  searchParams,
}: {
  searchParams?: Promise<{ exercice?: string }>
}) {
  const tenant = await getTenantContext()

  // 1. Contrôle du niveau d'abonnement : accessible à partir du niveau MÉDIUM
  const isAccessible = tenant && (tenant.subscriptionTier === 'medium' || tenant.subscriptionTier === 'premium' || tenant.role === 'admin')

  if (!isAccessible) {
    return <MediumBudgetLockView />
  }

  const params = await searchParams
  const exerciceFiltre = params?.exercice ? Number(params.exercice) : undefined
  const { budgets } = await getBudgets(exerciceFiltre)

  const formatCFA = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(val) + ` ${tenant.devise || 'FCFA'}`

  const anneeEnCours = new Date().getFullYear()
  const budgetsActifs = (budgets || []).filter((b) => b.statut === 'en_cours')

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold font-heading text-foreground">
                Suivi Budgétaire & Prévisions
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                Médium & Prémium
              </span>
            </div>
            <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
              Planifiez vos charges et recettes d’exploitation, suivez les réalisations réelles et analysez les écarts.
            </p>
          </div>
        </div>

        <NouveauBudgetModal />
      </div>

      {/* Cartes KPI Globales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface rounded-2xl p-4 border border-surface-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-muted font-bold uppercase tracking-wider">Budgets en Cours</span>
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-foreground mt-1">{budgetsActifs.length}</p>
          <span className="text-[11px] text-foreground-muted">{(budgets || []).length} budget(s) au total</span>
        </div>

        <div className="bg-surface rounded-2xl p-4 border border-surface-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-muted font-bold uppercase tracking-wider">Exercice Actif</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-1">{anneeEnCours}</p>
          <span className="text-[11px] text-foreground-muted">Année calendaire en cours</span>
        </div>

        <div className="bg-surface rounded-2xl p-4 border border-surface-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-muted font-bold uppercase tracking-wider">Mécanisme de Suivi</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-lg font-bold text-foreground mt-1">Temps Réel</p>
          <span className="text-[11px] text-foreground-muted">Écritures SYSCOHADA + Opérations directes</span>
        </div>

        <div className="bg-surface rounded-2xl p-4 border border-surface-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-muted font-bold uppercase tracking-wider">Gestion des Écarts</span>
            <AlertTriangle className="w-4 h-4 text-danger" />
          </div>
          <p className="text-lg font-bold text-danger mt-1">Alertes Actives</p>
          <span className="text-[11px] text-foreground-muted">Détection automatique des dépassements</span>
        </div>
      </div>

      {/* Liste des Budgets */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold font-heading text-sm text-foreground flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Plans Budgétaires de la Ferme
          </h3>
        </div>

        {(!budgets || budgets.length === 0) ? (
          <div className="bg-surface rounded-2xl border border-dashed border-surface-border p-12 text-center max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
              <Calculator className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-foreground text-sm">Aucun budget prévisionnel configuré</h4>
            <p className="text-xs text-foreground-muted mt-1 mb-5">
              Créez votre premier budget annuel ou par atelier pour encadrer vos dépenses et fixer vos objectifs de vente.
            </p>
            <NouveauBudgetModal />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((b) => {
              const estEnCours = b.statut === 'en_cours'
              return (
                <div
                  key={b.id}
                  className="bg-surface rounded-2xl border border-surface-border p-5 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          Exercice {b.exercice}
                        </span>
                        <h4 className="font-bold text-foreground text-base mt-1.5 group-hover:text-primary transition-colors">
                          {b.titre}
                        </h4>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        estEnCours
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-black/5 text-foreground-muted'
                      }`}>
                        {estEnCours ? 'En cours' : b.statut}
                      </span>
                    </div>

                    <p className="text-xs text-foreground-muted line-clamp-2">
                      {b.description || `Budget d'exploitation pour le cycle ${b.exercice}.`}
                    </p>

                    <div className="pt-2 border-t border-surface-border/60 text-xs text-foreground-muted space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Période :</span>
                        <span className="font-medium text-foreground">
                          {new Date(b.date_debut).toLocaleDateString('fr-FR')} au {new Date(b.date_fin).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Atelier :</span>
                        <span className="font-medium text-foreground capitalize">
                          {b.atelier === 'global' ? '🌾 Global Ferme' : b.atelier}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-surface-border flex items-center justify-between">
                    <span className="text-[11px] text-foreground-muted capitalize">
                      Type {b.periode_type}
                    </span>
                    <Link
                      href={`/comptabilite/budget/${b.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all"
                    >
                      <span>Tableau de Suivi</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
