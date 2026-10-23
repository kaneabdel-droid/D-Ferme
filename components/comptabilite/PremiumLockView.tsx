'use client'

import Link from 'next/link'
import { Crown, Sparkles, Scale, BarChart3, FileSpreadsheet, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function PremiumLockView({
  titre = 'États Financiers SYSCOHADA (Bilan, Résultat, Balance)',
  description = 'Le Bilan comptable, le Compte de Résultat et la Balance générale sont réservés aux exploitations abonnées à la formule Prémium Agro-Pastorale.'
}: {
  titre?: string
  description?: string
}) {
  return (
    <div className="bg-surface rounded-3xl border border-primary/20 p-8 sm:p-12 shadow-sm text-center max-w-3xl mx-auto my-6 relative overflow-hidden">
      {/* Halo décoratif */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 mb-6">
          <Crown className="w-9 h-9" />
        </div>

        <span className="px-3.5 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-bold uppercase tracking-wider mb-3">
          👑 Fonctionnalité Exclusive Prémium
        </span>

        <h2 className="text-2xl sm:text-3xl font-bold font-heading text-foreground max-w-xl">
          {titre}
        </h2>

        <p className="text-sm text-foreground-muted max-w-lg mt-2 mb-8 leading-relaxed">
          {description}
        </p>

        {/* Aperçu des 3 modules premium */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left mb-8">
          <div className="p-4 rounded-2xl bg-background border border-surface-border">
            <div className="p-2 rounded-xl bg-primary/10 text-primary w-fit mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-foreground">Bilan Comptable</h4>
            <p className="text-xs text-foreground-muted mt-1">
              Actif & Passif équilibrés : valorisation de vos terres, bâtiments, cheptel reproducteur et trésorerie.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-background border border-surface-border">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 w-fit mb-3">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-foreground">Compte de Résultat</h4>
            <p className="text-xs text-foreground-muted mt-1">
              Marge brute commerciale, détail des charges d'exploitation et calcul du bénéfice ou perte nette d'exercice.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-background border border-surface-border">
            <div className="p-2 rounded-xl bg-secondary/10 text-secondary w-fit mb-3">
              <Scale className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-foreground">Balance des Comptes</h4>
            <p className="text-xs text-foreground-muted mt-1">
              Grand Livre à 6 colonnes, vérification de l'équilibre débit/crédit et export pour expert-comptable.
            </p>
          </div>
        </div>

        {/* Avantages */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-foreground-muted mb-8">
          <span className="flex items-center gap-1.5 text-foreground">
            <CheckCircle2 className="w-4 h-4 text-success" /> Conforme SYSCOHADA Révisé
          </span>
          <span className="flex items-center gap-1.5 text-foreground">
            <CheckCircle2 className="w-4 h-4 text-success" /> Export PDF & Dossier Bancaire
          </span>
          <span className="flex items-center gap-1.5 text-foreground">
            <CheckCircle2 className="w-4 h-4 text-success" /> Données 100% synchronisées
          </span>
        </div>

        {/* Bouton d'action vers l'abonnement */}
        <Link
          href="/abonnement"
          className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-primary-hover text-white font-bold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all"
        >
          <Crown className="w-4 h-4" />
          <span>Passer à la Formule Prémium</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
