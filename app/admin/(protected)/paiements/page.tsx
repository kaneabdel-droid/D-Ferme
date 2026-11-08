import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/admin'
import ValiderPaiementButton from '../entreprises/ValiderPaiementButton'
import { Wallet, CheckCircle, Clock, AlertCircle, ArrowUpRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminPaiementsPage() {
  const supabase = createAdminClient()

  let paiements: any[] = []
  try {
    const { data } = await supabase
      .from('abonnement_paiements')
      .select('id, entreprise_id, gie_id, niveau, montant, devise, statut, provider, provider_reference, moyen_paiement, created_at, entreprises(id, nom)')
      .order('created_at', { ascending: false })
      .limit(100)
    paiements = data || []
  } catch (e) {
    console.error('Erreur chargement paiements admin d-elevage:', e)
  }

  // KPIs
  let totalEncaisse = 0
  let nbCompletes = 0
  let nbPending = 0

  paiements.forEach((p) => {
    if (p.statut === 'completed') {
      totalEncaisse += Number(p.montant || 0)
      nbCompletes++
    } else if (p.statut === 'pending') {
      nbPending++
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">
            Paiements d'Abonnement D-ÉLEVAGE
          </h1>
          <p className="text-sm text-foreground-muted">
            Suivi des encaissements et validation manuelle des paiements d'abonnements.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-background rounded-xl border border-surface-border p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Total Encaissé
            </span>
            <span className="p-2 rounded-lg bg-success/10 text-success">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {totalEncaisse.toLocaleString('fr-FR')} FCFA
          </p>
          <p className="text-xs text-foreground-muted mt-0.5">{nbCompletes} paiement(s) validé(s)</p>
        </div>

        <div className="bg-background rounded-xl border border-surface-border p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              En Attente de Validation
            </span>
            <span className="p-2 rounded-lg bg-warning/10 text-warning">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-warning">{nbPending}</p>
          <p className="text-xs text-foreground-muted mt-0.5">Nécessite une validation manuelle</p>
        </div>

        <div className="bg-background rounded-xl border border-surface-border p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Taux de validation
            </span>
            <span className="p-2 rounded-lg bg-primary/10 text-primary">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {paiements.length > 0 ? Math.round((nbCompletes / paiements.length) * 100) : 0}%
          </p>
          <p className="text-xs text-foreground-muted mt-0.5">{paiements.length} transaction(s) au total</p>
        </div>
      </div>

      {/* Table des paiements */}
      <div className="bg-background rounded-xl border border-surface-border overflow-hidden overflow-x-auto shadow-xs">
        <table className="w-full text-sm">
          <thead className="bg-surface text-foreground-muted text-left text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Exploitation</th>
              <th className="px-4 py-3 font-semibold">Forfait</th>
              <th className="px-4 py-3 font-semibold">Montant</th>
              <th className="px-4 py-3 font-semibold">Mode / Réf</th>
              <th className="px-4 py-3 font-semibold">Statut</th>
              <th className="px-4 py-3 font-semibold text-right">Validation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {paiements.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-foreground-muted italic">
                  Aucun paiement d'abonnement enregistré pour le moment.
                </td>
              </tr>
            ) : (
              paiements.map((p) => {
                const ent = Array.isArray(p.entreprises) ? p.entreprises[0] : p.entreprises
                const entId = ent?.id || p.entreprise_id || p.gie_id

                return (
                  <tr key={p.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-foreground-muted whitespace-nowrap">
                      {new Date(p.created_at).toLocaleString('fr-FR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {entId ? (
                        <Link
                          href={`/admin/entreprises/${entId}`}
                          className="group inline-flex items-center gap-1 font-semibold text-foreground hover:text-primary transition-colors"
                        >
                          <span>{ent?.nom || 'Exploitation'}</span>
                          <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                        </Link>
                      ) : (
                        <span className="text-foreground-muted">Exploitation</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize font-semibold text-xs bg-surface border border-surface-border px-2 py-0.5 rounded">
                        {p.niveau || 'standard'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-foreground whitespace-nowrap">
                      {Number(p.montant).toLocaleString('fr-FR')} {p.devise || 'FCFA'}
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground-muted font-mono">
                      <span className="uppercase font-semibold text-[11px] text-foreground">
                        {p.provider}
                      </span>{' '}
                      ({p.moyen_paiement || 'mobile'})
                      {p.provider_reference && (
                        <div className="text-[10px] text-foreground-muted/80 truncate max-w-xs">
                          Réf: {p.provider_reference}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${p.statut === 'completed'
                            ? 'bg-success/10 text-success border border-success/20'
                            : p.statut === 'pending'
                              ? 'bg-warning/10 text-warning border border-warning/20'
                              : 'bg-danger/10 text-danger border border-danger/20'
                          }`}
                      >
                        {p.statut === 'completed'
                          ? 'Validé'
                          : p.statut === 'pending'
                            ? 'En attente'
                            : 'Échoué'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {p.statut === 'pending' ? (
                        <ValiderPaiementButton paiementId={p.id} />
                      ) : (
                        <span className="text-xs text-foreground-muted/40 font-mono">—</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
