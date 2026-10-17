import { createClient } from '@/utils/supabase/server'
import { getTenantContext } from '@/utils/supabase/tenant'
import { DollarSign, TrendingUp, TrendingDown, Scale, PiggyBank, Sparkles } from 'lucide-react'
import CreerOperationModal from './CreerOperationModal'
import { DEMO_FINANCES, DEMO_BANDES, DEMO_ANIMAUX } from '@/lib/demo-data'

import { getLocale, getDictionary } from '@/dictionaries'

export default async function FinancesPage() {
  const tenant = await getTenantContext()
  const supabase = await createClient()
  const locale = await getLocale()
  const dict = await getDictionary(locale)
  const tFinances = dict.elevage?.finances_page || {}

  const [
    { data: operations },
    { data: bandes },
    { data: animaux }
  ] = await Promise.all([
    supabase
      .from('finances_elevage')
      .select('*, bandes(code_bande), animaux(numero_boucle)')
      .order('date_operation', { ascending: false }),
    supabase.from('bandes').select('id, code_bande, statut').order('created_at', { ascending: false }),
    supabase.from('animaux').select('id, numero_boucle, etat_sante').order('created_at', { ascending: false })
  ])

  const isDemo = !operations || operations.length === 0
  const displayOperations = isDemo ? (DEMO_FINANCES as any[]) : operations
  const displayBandes = (bandes && bandes.length > 0) ? bandes : DEMO_BANDES
  const displayAnimaux = (animaux && animaux.length > 0) ? animaux : DEMO_ANIMAUX

  // Calculs totaux
  let totalRevenus = 0
  let totalDepenses = 0

  displayOperations?.forEach((op) => {
    const isVente = op.type_operation.startsWith('vente') || op.type_operation === 'autre_produit'
    const montant = Number(op.montant_total) || 0
    if (isVente) {
      totalRevenus += montant
    } else {
      totalDepenses += montant
    }
  })

  const margeBrute = totalRevenus - totalDepenses

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">
            {tFinances.title || 'Finances, Ventes & Rentabilité'}
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            {tFinances.subtitle || "Suivi des encaissements de ventes, dépenses en intrants et calcul de la marge d'exploitation."}
          </p>
        </div>
        <CreerOperationModal
          bandes={displayBandes}
          animaux={displayAnimaux}
        />
      </div>

      {isDemo && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>Données de démonstration : ventes réelles (œufs, lait, Ladoum) et dépenses d'intrants.</span>
        </div>
      )}

      {/* Cartes KPI Financières */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl bg-surface border border-surface-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-success/10 text-success">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
              Total Ventes & Produits
            </p>
          </div>
          <p className="text-3xl font-bold font-heading text-success mt-1">
            {totalRevenus.toLocaleString('fr-FR')} {tenant?.devise || 'FCFA'}
          </p>
          <p className="text-xs text-foreground-muted mt-2">Ventes d'animaux, œufs et lait</p>
        </div>

        <div className="rounded-2xl bg-surface border border-surface-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-danger/10 text-danger">
              <TrendingDown className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
              Total Dépenses & Charges
            </p>
          </div>
          <p className="text-3xl font-bold font-heading text-danger mt-1">
            {totalDepenses.toLocaleString('fr-FR')} {tenant?.devise || 'FCFA'}
          </p>
          <p className="text-xs text-foreground-muted mt-2">Aliments, vaccins et achats</p>
        </div>

        <div className="rounded-2xl bg-surface border border-surface-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <PiggyBank className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
              Marge Nette de Production
            </p>
          </div>
          <p className={`text-3xl font-bold font-heading mt-1 ${margeBrute >= 0 ? 'text-primary' : 'text-danger'}`}>
            {margeBrute.toLocaleString('fr-FR')} {tenant?.devise || 'FCFA'}
          </p>
          <p className="text-xs text-foreground-muted mt-2">
            Rentabilité globale de l'exploitation
          </p>
        </div>
      </div>

      {/* Tableau chronologique des opérations */}
      <div className="rounded-2xl bg-surface border border-surface-border overflow-hidden shadow-sm">
        <div className="p-5 border-b border-surface-border flex items-center justify-between">
          <h3 className="font-bold font-heading text-foreground">Journal des Opérations</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-background border-b border-surface-border text-xs uppercase text-foreground-muted">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Lot / Boucle</th>
                <th className="py-3 px-4">Tiers</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Paiement</th>
                <th className="py-3 px-4 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {operations && operations.length > 0 ? (
                operations.map((op) => {
                  const isVente = op.type_operation.startsWith('vente') || op.type_operation === 'autre_produit'

                  return (
                    <tr key={op.id} className="hover:bg-black/5">
                      <td className="py-3 px-4 font-medium">{op.date_operation}</td>
                      <td className="py-3 px-4 capitalize font-semibold">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs ${
                          isVente ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                        }`}>
                          {op.type_operation.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-foreground">
                        {op.bandes?.code_bande || op.animaux?.numero_boucle || '-'}
                      </td>
                      <td className="py-3 px-4 text-xs text-foreground-muted">{op.tiers_nom || '-'}</td>
                      <td className="py-3 px-4 text-xs text-foreground">{op.description || '-'}</td>
                      <td className="py-3 px-4 text-xs uppercase text-foreground-muted">{op.moyen_paiement}</td>
                      <td className={`py-3 px-4 text-right font-bold ${isVente ? 'text-success' : 'text-danger'}`}>
                        {isVente ? '+' : '-'}{Number(op.montant_total).toLocaleString('fr-FR')} {tenant?.devise || 'FCFA'}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-foreground-muted">
                    Aucune transaction financière enregistrée pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
