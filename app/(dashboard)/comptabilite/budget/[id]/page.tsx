import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTenantContext } from '@/utils/supabase/tenant'
import { getBudgetComplet } from '../actions'
import MediumBudgetLockView from '@/components/comptabilite/MediumBudgetLockView'
import AjouterLigneBudgetModal from '../AjouterLigneBudgetModal'
import { ActionSupprimerLigne, ActionStatutBudget } from './BudgetClientActions'
import {
  ArrowLeft,
  Calculator,
  Target,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Layers,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react'

export default async function BudgetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const tenant = await getTenantContext()

  // 1. Contrôle du niveau d'abonnement : accessible à partir du niveau MÉDIUM
  const isAccessible = tenant && (tenant.subscriptionTier === 'medium' || tenant.subscriptionTier === 'premium' || tenant.role === 'admin')

  if (!isAccessible) {
    return <MediumBudgetLockView />
  }

  const { id } = await params
  const { budget, error } = await getBudgetComplet(id)

  if (!budget || error) {
    notFound()
  }

  const devise = tenant?.devise || 'FCFA'
  const formatCFA = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(val) + ` ${devise}`

  const charges = budget.lignes.filter((l) => l.type_flux === 'charge')
  const produits = budget.lignes.filter((l) => l.type_flux === 'produit')
  const investissements = budget.lignes.filter((l) => l.type_flux === 'investissement')

  // Détection des postes en dépassement
  const chargesDepassees = charges.filter((c) => c.statut_alerte === 'depassement')

  return (
    <div className="space-y-6">
      {/* Barre de retour & actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/comptabilite/budget"
            className="p-2 rounded-xl bg-surface border border-surface-border text-foreground-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Exercice {budget.exercice} • {budget.periode_type}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                budget.statut === 'en_cours'
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  : 'bg-black/5 text-foreground-muted'
              }`}>
                {budget.statut === 'en_cours' ? 'Actif' : budget.statut}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-foreground">
              {budget.titre}
            </h1>
            <p className="text-xs text-foreground-muted mt-0.5">
              Période du {new Date(budget.date_debut).toLocaleDateString('fr-FR')} au {new Date(budget.date_fin).toLocaleDateString('fr-FR')} • Atelier : <span className="font-semibold capitalize">{budget.atelier}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AjouterLigneBudgetModal budgetId={budget.id} />
          <ActionStatutBudget budgetId={budget.id} statutActuel={budget.statut} />
        </div>
      </div>

      {/* En-tête spécial impression (Print Only) */}
      <div className="hidden print:block border-b-2 border-black pb-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">{tenant.entrepriseNom}</h1>
            <p className="text-sm">Rapport de Suivi Budgétaire & Analyse des Écarts</p>
          </div>
          <div className="text-right text-xs">
            <p className="font-bold">{budget.titre}</p>
            <p>Exercice {budget.exercice} ({budget.date_debut} au {budget.date_fin})</p>
          </div>
        </div>
      </div>

      {/* Bannière d'alerte dépassement */}
      {chargesDepassees.length > 0 && (
        <div className="p-4 rounded-2xl bg-danger/10 border border-danger/20 text-danger flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-sm">
              Alerte de Dépassement Budgétaire ({chargesDepassees.length} poste{chargesDepassees.length > 1 ? 's' : ''})
            </h4>
            <p className="text-danger/90 mt-0.5">
              Les dépenses suivantes ont excédé 100% de leur enveloppe allouée :{' '}
              <span className="font-semibold">
                {chargesDepassees.map((c) => `${c.libelle} (${c.taux_realisation}%)`).join(', ')}
              </span>.
            </p>
          </div>
        </div>
      )}

      {/* Cartes KPI Synthèse */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Charges */}
        <div className="bg-surface rounded-2xl p-4 border border-surface-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-muted font-bold uppercase tracking-wider">Charges d'Exploitation</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              budget.totaux.taux_charges > 100
                ? 'bg-danger/10 text-danger border border-danger/20'
                : budget.totaux.taux_charges >= 85
                ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
            }`}>
              {budget.totaux.taux_charges}% consommé
            </span>
          </div>
          <p className="text-2xl font-black text-foreground mt-2">
            {formatCFA(budget.totaux.charges_realisees)}
          </p>
          <div className="mt-2">
            <div className="w-full bg-black/5 dark:bg-white/5 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  budget.totaux.taux_charges > 100 ? 'bg-danger' : budget.totaux.taux_charges >= 85 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, budget.totaux.taux_charges)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-foreground-muted mt-1">
              <span>Budget prévu : {formatCFA(budget.totaux.charges_prevues)}</span>
              <span>
                {budget.totaux.charges_realisees > budget.totaux.charges_prevues
                  ? `+${formatCFA(budget.totaux.charges_realisees - budget.totaux.charges_prevues)}`
                  : `Reste : ${formatCFA(budget.totaux.charges_prevues - budget.totaux.charges_realisees)}`}
              </span>
            </div>
          </div>
        </div>

        {/* Produits */}
        <div className="bg-surface rounded-2xl p-4 border border-surface-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-muted font-bold uppercase tracking-wider">Produits & Ventes</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              budget.totaux.taux_produits >= 100
                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                : 'bg-primary/10 text-primary border border-primary/20'
            }`}>
              {budget.totaux.taux_produits}% atteint
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">
            {formatCFA(budget.totaux.produits_realises)}
          </p>
          <div className="mt-2">
            <div className="w-full bg-black/5 dark:bg-white/5 h-2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${Math.min(100, budget.totaux.taux_produits)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-foreground-muted mt-1">
              <span>Objectif : {formatCFA(budget.totaux.produits_prevus)}</span>
              <span>
                {budget.totaux.produits_realises >= budget.totaux.produits_prevus
                  ? 'Objectif dépassé'
                  : `Manque : ${formatCFA(budget.totaux.produits_prevus - budget.totaux.produits_realises)}`}
              </span>
            </div>
          </div>
        </div>

        {/* Marge */}
        <div className="bg-surface rounded-2xl p-4 border border-surface-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-muted font-bold uppercase tracking-wider">Marge d'Exploitation</span>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <p className={`text-2xl font-black mt-2 ${
            budget.totaux.marge_realisee >= 0 ? 'text-primary' : 'text-danger'
          }`}>
            {formatCFA(budget.totaux.marge_realisee)}
          </p>
          <div className="flex justify-between items-center text-[10px] text-foreground-muted mt-3 pt-2 border-t border-surface-border/60">
            <span>Marge prévue : {formatCFA(budget.totaux.marge_prevue)}</span>
            <span className={`font-bold ${budget.totaux.ecart_marge >= 0 ? 'text-emerald-600' : 'text-danger'}`}>
              {budget.totaux.ecart_marge >= 0 ? `+${formatCFA(budget.totaux.ecart_marge)}` : formatCFA(budget.totaux.ecart_marge)}
            </span>
          </div>
        </div>

        {/* Investissements */}
        <div className="bg-surface rounded-2xl p-4 border border-surface-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-muted font-bold uppercase tracking-wider">Investissements</span>
            <FileSpreadsheet className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-foreground mt-2">
            {formatCFA(budget.totaux.investissements_realises)}
          </p>
          <div className="flex justify-between items-center text-[10px] text-foreground-muted mt-3 pt-2 border-t border-surface-border/60">
            <span>Budget d'équipement prévu :</span>
            <span className="font-bold text-foreground">{formatCFA(budget.totaux.investissements_prevus)}</span>
          </div>
        </div>
      </div>

      {/* Section 1 : Charges d'Exploitation */}
      <div className="bg-surface border border-surface-border rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-surface-border flex items-center justify-between bg-background/50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-danger" />
            <h3 className="font-bold font-heading text-sm text-foreground">
              Charges & Dépenses d'Exploitation (Classe 6 SYSCOHADA)
            </h3>
            <span className="text-xs text-foreground-muted">({charges.length} poste{charges.length > 1 ? 's' : ''})</span>
          </div>
          <div className="text-xs font-bold text-foreground">
            Total : {formatCFA(budget.totaux.charges_realisees)} / {formatCFA(budget.totaux.charges_prevues)}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/5 dark:bg-white/5 border-b border-surface-border text-foreground-muted font-semibold uppercase text-[10px]">
              <tr>
                <th className="p-3">Poste Budgétaire</th>
                <th className="p-3">Compte</th>
                <th className="p-3 text-right">Budget Alloué</th>
                <th className="p-3 text-right">Réalisé Réel</th>
                <th className="p-3 text-right">Écart</th>
                <th className="p-3 text-center">Consommation</th>
                <th className="p-3 text-center">Statut</th>
                <th className="p-3 text-center w-12 print:hidden">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {charges.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-foreground-muted">
                    Aucune charge prévisionnelle renseignée. Cliquez sur "Ajouter une Ligne" ci-dessus.
                  </td>
                </tr>
              ) : (
                charges.map((l) => {
                  const estDepassement = l.statut_alerte === 'depassement'
                  const estVigilance = l.statut_alerte === 'vigilance'
                  return (
                    <tr key={l.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="p-3 font-semibold text-foreground">
                        <div>{l.libelle}</div>
                        {l.notes && <div className="text-[10px] text-foreground-muted font-normal">{l.notes}</div>}
                      </td>
                      <td className="p-3 text-foreground-muted font-mono text-[11px]">
                        {l.compte_syscohada || '-'}
                      </td>
                      <td className="p-3 text-right font-medium text-foreground">
                        {formatCFA(l.montant_prevu)}
                      </td>
                      <td className="p-3 text-right font-bold text-foreground">
                        {formatCFA(l.montant_realise)}
                      </td>
                      <td className={`p-3 text-right font-bold ${
                        l.ecart > 0 ? 'text-danger' : 'text-emerald-600'
                      }`}>
                        {l.ecart > 0 ? `+${formatCFA(l.ecart)}` : formatCFA(l.ecart)}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-16 bg-black/5 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                estDepassement ? 'bg-danger' : estVigilance ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, l.taux_realisation)}%` }}
                            />
                          </div>
                          <span className={`text-[11px] font-bold w-10 text-right ${
                            estDepassement ? 'text-danger' : estVigilance ? 'text-amber-600' : 'text-foreground'
                          }`}>
                            {l.taux_realisation}%
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          estDepassement
                            ? 'bg-danger/10 text-danger border border-danger/20'
                            : estVigilance
                            ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        }`}>
                          {estDepassement ? 'Dépassement' : estVigilance ? 'Vigilance' : 'Sous contrôle'}
                        </span>
                      </td>
                      <td className="p-3 text-center print:hidden">
                        <ActionSupprimerLigne ligneId={l.id} budgetId={budget.id} />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
            {charges.length > 0 && (
              <tfoot className="bg-black/5 dark:bg-white/5 font-bold border-t border-surface-border">
                <tr>
                  <td className="p-3" colSpan={2}>Total Charges d'Exploitation</td>
                  <td className="p-3 text-right">{formatCFA(budget.totaux.charges_prevues)}</td>
                  <td className="p-3 text-right">{formatCFA(budget.totaux.charges_realisees)}</td>
                  <td className={`p-3 text-right ${budget.totaux.charges_realisees > budget.totaux.charges_prevues ? 'text-danger' : 'text-emerald-600'}`}>
                    {budget.totaux.charges_realisees > budget.totaux.charges_prevues
                      ? `+${formatCFA(budget.totaux.charges_realisees - budget.totaux.charges_prevues)}`
                      : formatCFA(budget.totaux.charges_realisees - budget.totaux.charges_prevues)}
                  </td>
                  <td className="p-3 text-center">{budget.totaux.taux_charges}%</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Section 2 : Produits & Ventes */}
      <div className="bg-surface border border-surface-border rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-surface-border flex items-center justify-between bg-background/50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <h3 className="font-bold font-heading text-sm text-foreground">
              Produits & Recettes d'Exploitation (Classe 7 SYSCOHADA)
            </h3>
            <span className="text-xs text-foreground-muted">({produits.length} poste{produits.length > 1 ? 's' : ''})</span>
          </div>
          <div className="text-xs font-bold text-emerald-600">
            Total : {formatCFA(budget.totaux.produits_realises)} / {formatCFA(budget.totaux.produits_prevus)}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/5 dark:bg-white/5 border-b border-surface-border text-foreground-muted font-semibold uppercase text-[10px]">
              <tr>
                <th className="p-3">Poste de Recette</th>
                <th className="p-3">Compte</th>
                <th className="p-3 text-right">Objectif Prévu</th>
                <th className="p-3 text-right">Ventes Réalisées</th>
                <th className="p-3 text-right">Écart</th>
                <th className="p-3 text-center">Taux d'Atteinte</th>
                <th className="p-3 text-center">Statut</th>
                <th className="p-3 text-center w-12 print:hidden">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {produits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-foreground-muted">
                    Aucune prévision de produit ou de vente enregistrée.
                  </td>
                </tr>
              ) : (
                produits.map((l) => {
                  const estAtteint = l.taux_realisation >= 100
                  const estEnCours = l.taux_realisation >= 70
                  return (
                    <tr key={l.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="p-3 font-semibold text-foreground">
                        <div>{l.libelle}</div>
                        {l.notes && <div className="text-[10px] text-foreground-muted font-normal">{l.notes}</div>}
                      </td>
                      <td className="p-3 text-foreground-muted font-mono text-[11px]">
                        {l.compte_syscohada || '-'}
                      </td>
                      <td className="p-3 text-right font-medium text-foreground">
                        {formatCFA(l.montant_prevu)}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-600">
                        {formatCFA(l.montant_realise)}
                      </td>
                      <td className={`p-3 text-right font-bold ${
                        l.ecart >= 0 ? 'text-emerald-600' : 'text-foreground-muted'
                      }`}>
                        {l.ecart >= 0 ? `+${formatCFA(l.ecart)}` : formatCFA(l.ecart)}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-16 bg-black/5 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${Math.min(100, l.taux_realisation)}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold w-10 text-right text-emerald-600">
                            {l.taux_realisation}%
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          estAtteint
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : estEnCours
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}>
                          {estAtteint ? 'Objectif Atteint' : estEnCours ? 'En bonne voie' : 'En retard'}
                        </span>
                      </td>
                      <td className="p-3 text-center print:hidden">
                        <ActionSupprimerLigne ligneId={l.id} budgetId={budget.id} />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
            {produits.length > 0 && (
              <tfoot className="bg-black/5 dark:bg-white/5 font-bold border-t border-surface-border">
                <tr>
                  <td className="p-3" colSpan={2}>Total Produits & Ventes</td>
                  <td className="p-3 text-right">{formatCFA(budget.totaux.produits_prevus)}</td>
                  <td className="p-3 text-right text-emerald-600">{formatCFA(budget.totaux.produits_realises)}</td>
                  <td className={`p-3 text-right ${budget.totaux.produits_realises >= budget.totaux.produits_prevus ? 'text-emerald-600' : 'text-foreground-muted'}`}>
                    {budget.totaux.produits_realises >= budget.totaux.produits_prevus
                      ? `+${formatCFA(budget.totaux.produits_realises - budget.totaux.produits_prevus)}`
                      : formatCFA(budget.totaux.produits_realises - budget.totaux.produits_prevus)}
                  </td>
                  <td className="p-3 text-center">{budget.totaux.taux_produits}%</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Section 3 : Investissements (si renseignés) */}
      {investissements.length > 0 && (
        <div className="bg-surface border border-surface-border rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-surface-border flex items-center justify-between bg-background/50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-600" />
              <h3 className="font-bold font-heading text-sm text-foreground">
                Investissements & Matériels Agricoles (Classe 2 SYSCOHADA)
              </h3>
            </div>
            <div className="text-xs font-bold text-foreground">
              Total : {formatCFA(budget.totaux.investissements_realises)} / {formatCFA(budget.totaux.investissements_prevus)}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/5 dark:bg-white/5 border-b border-surface-border text-foreground-muted font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Investissement</th>
                  <th className="p-3">Compte</th>
                  <th className="p-3 text-right">Budget Alloué</th>
                  <th className="p-3 text-right">Décaissé Réel</th>
                  <th className="p-3 text-right">Écart</th>
                  <th className="p-3 text-center w-12 print:hidden">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {investissements.map((l) => (
                  <tr key={l.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="p-3 font-semibold text-foreground">
                      <div>{l.libelle}</div>
                      {l.notes && <div className="text-[10px] text-foreground-muted font-normal">{l.notes}</div>}
                    </td>
                    <td className="p-3 text-foreground-muted font-mono text-[11px]">
                      {l.compte_syscohada || '215'}
                    </td>
                    <td className="p-3 text-right font-medium text-foreground">
                      {formatCFA(l.montant_prevu)}
                    </td>
                    <td className="p-3 text-right font-bold text-foreground">
                      {formatCFA(l.montant_realise)}
                    </td>
                    <td className="p-3 text-right font-bold text-foreground-muted">
                      {formatCFA(l.ecart)}
                    </td>
                    <td className="p-3 text-center print:hidden">
                      <ActionSupprimerLigne ligneId={l.id} budgetId={budget.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
