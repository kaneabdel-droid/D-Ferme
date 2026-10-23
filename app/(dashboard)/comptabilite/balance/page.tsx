import { getBalance } from '../actions'
import { getTenantContext } from '@/utils/supabase/tenant'
import PremiumLockView from '@/components/comptabilite/PremiumLockView'
import PrintSectionButton from '@/components/PrintSectionButton'
import { Scale, CheckCircle2, AlertTriangle, ArrowDownRight, ArrowUpRight } from 'lucide-react'

export default async function BalancePage() {
  const tenant = await getTenantContext()
  const isPremium = tenant?.subscriptionTier === 'premium'

  if (!isPremium) {
    return (
      <PremiumLockView
        titre="Balance Générale des Comptes (Grand Livre)"
        description="La Balance Générale des comptes SYSCOHADA consolide l'ensemble des mouvements au débit et au crédit de toutes les écritures de votre ferme. Cette fonctionnalité de clôture et de vérification comptable est exclusive au forfait Prémium."
      />
    )
  }

  const { balance, totaux, error } = await getBalance()

  const formatCFA = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(val) + ' FCFA'

  const equilibreMouvements = totaux ? Math.abs(totaux.debit - totaux.credit) < 0.01 : true
  const equilibreSoldes = totaux ? Math.abs(totaux.soldeDebiteur - totaux.soldeCrediteur) < 0.01 : true
  const parfaitEquilibre = equilibreMouvements && equilibreSoldes

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-heading text-foreground">
              Balance Générale des Comptes
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[11px] font-bold border border-amber-500/20">
              SYSCOHADA Révisé
            </span>
          </div>
          <p className="text-xs text-foreground-muted mt-0.5">
            Tableau récapitulatif des flux cumulés et des soldes de clôture par compte d'exploitation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border ${
              parfaitEquilibre
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
            }`}
          >
            {parfaitEquilibre ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Balance Parfaitement Équilibrée</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Écart détecté dans les écritures</span>
              </>
            )}
          </div>
          <PrintSectionButton sectionId="balance-print" label="Imprimer la Balance" />
        </div>
      </div>

      {/* Résumé des totaux */}
      {totaux && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface rounded-2xl p-4 border border-surface-border shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground-muted font-bold uppercase tracking-wider">Total Débits</span>
              <ArrowDownRight className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-black text-foreground mt-1">{formatCFA(totaux.debit)}</p>
            <span className="text-[11px] text-foreground-muted">Mouvements débiteurs cumulés</span>
          </div>

          <div className="bg-surface rounded-2xl p-4 border border-surface-border shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground-muted font-bold uppercase tracking-wider">Total Crédits</span>
              <ArrowUpRight className="w-4 h-4 text-secondary" />
            </div>
            <p className="text-2xl font-black text-foreground mt-1">{formatCFA(totaux.credit)}</p>
            <span className="text-[11px] text-foreground-muted">Mouvements créditeurs cumulés</span>
          </div>

          <div className="bg-surface rounded-2xl p-4 border border-surface-border shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground-muted font-bold uppercase tracking-wider">Soldes Débiteurs</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <p className="text-2xl font-black text-emerald-600 mt-1">{formatCFA(totaux.soldeDebiteur)}</p>
            <span className="text-[11px] text-foreground-muted">Actifs & charges nettes</span>
          </div>

          <div className="bg-surface rounded-2xl p-4 border border-surface-border shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground-muted font-bold uppercase tracking-wider">Soldes Créditeurs</span>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            </div>
            <p className="text-2xl font-black text-amber-600 mt-1">{formatCFA(totaux.soldeCrediteur)}</p>
            <span className="text-[11px] text-foreground-muted">Passifs & produits nets</span>
          </div>
        </div>
      )}

      {/* Tableau Balance */}
      <div id="balance-print" className="bg-surface border border-surface-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-background text-foreground-muted text-xs uppercase font-bold border-b border-surface-border">
              <tr>
                <th className="py-3 px-4">Compte</th>
                <th className="py-3 px-4">Libellé du Compte</th>
                <th className="py-3 px-4 text-right">Mouvement Débit</th>
                <th className="py-3 px-4 text-right">Mouvement Crédit</th>
                <th className="py-3 px-4 text-right text-emerald-600">Solde Débiteur</th>
                <th className="py-3 px-4 text-right text-amber-600">Solde Créditeur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {balance && balance.length > 0 ? (
                balance.map((b) => (
                  <tr key={b.compte} className="hover:bg-background/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary">{b.compte}</td>
                    <td className="py-3 px-4 font-medium text-foreground">{b.libelle}</td>
                    <td className="py-3 px-4 text-right font-mono text-foreground-muted">
                      {b.debit > 0 ? formatCFA(b.debit) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-foreground-muted">
                      {b.credit > 0 ? formatCFA(b.credit) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                      {b.soldeDebiteur > 0 ? formatCFA(b.soldeDebiteur) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-600">
                      {b.soldeCrediteur > 0 ? formatCFA(b.soldeCrediteur) : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-foreground-muted">
                    <Scale className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Aucune écriture comptable enregistrée pour le moment.
                  </td>
                </tr>
              )}
            </tbody>

            {totaux && (
              <tfoot className="bg-background font-bold text-xs uppercase border-t-2 border-surface-border">
                <tr>
                  <td colSpan={2} className="py-4 px-4 text-foreground">
                    TOTAUX GÉNÉRAUX DE LA BALANCE
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-foreground">
                    {formatCFA(totaux.debit)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-foreground">
                    {formatCFA(totaux.credit)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-emerald-600 text-sm">
                    {formatCFA(totaux.soldeDebiteur)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-amber-600 text-sm">
                    {formatCFA(totaux.soldeCrediteur)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
