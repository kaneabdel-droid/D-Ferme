'use client'

import Link from 'next/link'
import { Sparkles, ArrowRight, CheckCircle2, Calculator, Target, AlertTriangle, TrendingUp, ShieldAlert } from 'lucide-react'

export default function MediumBudgetLockView({
  titre = 'Suivi Budgétaire (Prévisions & Réalisations)',
  description = 'Planifiez vos charges, estimez vos recettes et suivez en temps réel les écarts d’exploitation et le taux de consommation de votre budget. Cette fonctionnalité est accessible à partir du forfait Médium.'
}: {
  titre?: string
  description?: string
}) {
  return (
    <div className="bg-surface rounded-3xl border border-primary/20 p-8 sm:p-12 shadow-sm text-center max-w-3xl mx-auto my-6 relative overflow-hidden">
      {/* Halo décoratif */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 mb-6">
          <Calculator className="w-9 h-9" />
        </div>

        <span className="px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Disponible dès la formule Médium
        </span>

        <h2 className="text-2xl sm:text-3xl font-bold font-heading text-foreground max-w-xl">
          {titre}
        </h2>

        <p className="text-sm text-foreground-muted max-w-lg mt-2 mb-8 leading-relaxed">
          {description}
        </p>

        {/* Aperçu des 3 atouts du suivi budgétaire */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left mb-8">
          <div className="p-4 rounded-2xl bg-background border border-surface-border">
            <div className="p-2 rounded-xl bg-primary/10 text-primary w-fit mb-3">
              <Target className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-foreground">Prévisions par Poste</h4>
            <p className="text-xs text-foreground-muted mt-1">
              Budgétez vos intrants, provendes, semences, vétérinaires, salaires et ventes prévisionnelles.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-background border border-surface-border">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 w-fit mb-3">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-foreground">Rapprochement Réalisé</h4>
            <p className="text-xs text-foreground-muted mt-1">
              Agrégation directe des écritures comptables et opérations de caisse pour mesurer le réalisé en temps réel.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-background border border-surface-border">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 w-fit mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-foreground">Écarts & Alertes</h4>
            <p className="text-xs text-foreground-muted mt-1">
              Taux de consommation budgétaire et alertes de dépassement de coûts pour préserver votre trésorerie.
            </p>
          </div>
        </div>

        {/* Bouton d'upgrade */}
        <Link
          href="/abonnement"
          className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-md hover:bg-primary-hover transition-all"
        >
          <span>Mettre à niveau vers le forfait Médium</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-[11px] text-foreground-muted mt-2">
          À partir de 10.000 FCFA / mois • Activation immédiate
        </p>
      </div>
    </div>
  )
}
