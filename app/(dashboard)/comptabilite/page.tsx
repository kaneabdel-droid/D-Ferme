import { getEcritures, getPlanComptable } from './actions'
import NouvelleEcritureModal from './NouvelleEcritureModal'
import Link from 'next/link'
import { FileText, Filter, BookOpen, Layers, CheckCircle2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import PrintSectionButton from '@/components/PrintSectionButton'

export default async function ComptabilitePage(props: {
  searchParams: Promise<{ journal?: string }>
}) {
  const searchParams = await props.searchParams
  const selectedJournal = searchParams.journal || 'tous'

  const [{ ecritures, error }, { plan }] = await Promise.all([
    getEcritures(selectedJournal),
    getPlanComptable(),
  ])

  // Statistiques globales du journal
  const totalDebits = ecritures.reduce((acc, ec) => {
    return acc + (ec.lignes_ecritures_comptables || []).reduce((s: number, l: any) => s + Number(l.debit || 0), 0)
  }, 0)

  const totalCredits = ecritures.reduce((acc, ec) => {
    return acc + (ec.lignes_ecritures_comptables || []).reduce((s: number, l: any) => s + Number(l.credit || 0), 0)
  }, 0)

  const formatCFA = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(val) + ' FCFA'

  const journalConfig: Record<string, { label: string; badge: string; color: string }> = {
    achats: { label: 'Achats (Fournisseurs)', badge: 'ACH', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
    ventes: { label: 'Ventes (Clients)', badge: 'VTE', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
    od: { label: 'Opérations Diverses', badge: 'OD', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
    caisse: { label: 'Caisse Principale (Espèces)', badge: 'CAI', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    banque: { label: 'Banque & Virements', badge: 'BNQ', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' },
    mobile: { label: 'Mobile Money (Wave / OM)', badge: 'MOB', color: 'bg-sky-500/10 text-sky-600 border-sky-500/20' },
  }

  return (
    <div className="space-y-6">
      {/* Barre d'action supérieure */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-foreground">
            Livre-Journal des Écritures
          </h2>
          <p className="text-xs text-foreground-muted">
            Enregistrement chronologique de tous les flux financiers de l'exploitation agricole.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PrintSectionButton sectionId="journal-print" label="Imprimer le Journal" />
          <NouvelleEcritureModal plan={plan || []} />
        </div>
      </div>

      {/* Cartes KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface rounded-2xl p-4 border border-surface-border shadow-sm">
          <span className="text-xs text-foreground-muted font-medium">Nombre de Pièces Comptables</span>
          <p className="text-2xl font-bold text-foreground mt-1">{ecritures.length}</p>
          <span className="text-[11px] text-foreground-muted">Écritures enregistrées dans ce journal</span>
        </div>
        <div className="bg-surface rounded-2xl p-4 border border-surface-border shadow-sm">
          <span className="text-xs text-foreground-muted font-medium">Total Débits Période</span>
          <p className="text-2xl font-bold text-primary mt-1">{formatCFA(totalDebits)}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Emplois / Charges / Entrées de fonds</span>
        </div>
        <div className="bg-surface rounded-2xl p-4 border border-surface-border shadow-sm">
          <span className="text-xs text-foreground-muted font-medium">Total Crédits Période</span>
          <p className="text-2xl font-bold text-secondary mt-1">{formatCFA(totalCredits)}</p>
          <span className="text-[11px] text-emerald-600 font-medium">
            {Math.abs(totalDebits - totalCredits) < 0.01 ? '✓ Équilibre parfait débit / crédit' : '⚠ Déséquilibre'}
          </span>
        </div>
      </div>

      {/* Filtres par Journal : Achats, Ventes, OD, Caisse, Banque, Mobile Money */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-foreground-muted mr-1 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Journal :
        </span>
        {[
          { id: 'tous', label: 'Tous les journaux' },
          { id: 'achats', label: '🛒 Achats (ACH)' },
          { id: 'ventes', label: '💰 Ventes (VTE)' },
          { id: 'od', label: '⚙️ Opérations Diverses (OD)' },
          { id: 'caisse', label: '💵 Caisse (CAI)' },
          { id: 'banque', label: '🏦 Banque (BNQ)' },
          { id: 'mobile', label: '📱 Mobile Money (MOB)' },
        ].map((j) => {
          const isActive = selectedJournal === j.id
          return (
            <Link
              key={j.id}
              href={`/comptabilite?journal=${j.id}`}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface text-foreground-muted hover:text-foreground border border-surface-border'
              }`}
            >
              {j.label}
            </Link>
          )
        })}
      </div>

      {/* Tableau des Écritures */}
      <div id="journal-print" className="bg-surface rounded-2xl border border-surface-border overflow-hidden shadow-sm">
        {ecritures.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-background border-b border-surface-border text-xs uppercase text-foreground-muted">
                <tr>
                  <th className="py-3 px-4">Date & Pièce</th>
                  <th className="py-3 px-4">Journal</th>
                  <th className="py-3 px-4">Libellé de l'Écriture</th>
                  <th className="py-3 px-4">Lignes d'Imputation (Compte & Libellé)</th>
                  <th className="py-3 px-4 text-right">Débit</th>
                  <th className="py-3 px-4 text-right">Crédit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {ecritures.map((ec: any) => {
                  const cfg = journalConfig[ec.journal] || { label: ec.journal, badge: ec.journal.toUpperCase(), color: 'bg-surface-border/50 text-foreground' }
                  const lignes = ec.lignes_ecritures_comptables || []

                  return (
                    <tr key={ec.id} className="hover:bg-surface-border/20 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap align-top">
                        <span className="font-bold text-xs text-foreground block">{ec.date_ecriture}</span>
                        {ec.numero_piece ? (
                          <span className="text-[11px] font-mono text-foreground-muted block mt-0.5">
                            N° {ec.numero_piece}
                          </span>
                        ) : (
                          <span className="text-[11px] text-foreground-muted/60">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap align-top">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${cfg.color}`}>
                          {cfg.badge}
                        </span>
                        <span className="text-[11px] text-foreground-muted block mt-1">
                          {cfg.label.split('(')[0]}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-xs text-foreground align-top max-w-xs">
                        {ec.libelle}
                      </td>

                      <td className="py-3.5 px-4 text-xs align-top">
                        <div className="space-y-1">
                          {lignes.map((l: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="font-mono font-bold text-primary px-1.5 py-0.5 bg-primary/10 rounded text-[11px]">
                                {l.compte}
                              </span>
                              <span className="text-foreground-muted truncate max-w-xs">
                                {l.libelle}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-right align-top font-bold text-primary font-mono">
                        <div className="space-y-1">
                          {lignes.map((l: any, idx: number) => (
                            <div key={idx} className="h-5 flex items-center justify-end">
                              {Number(l.debit) > 0 ? formatCFA(Number(l.debit)) : '—'}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-right align-top font-bold text-secondary font-mono">
                        <div className="space-y-1">
                          {lignes.map((l: any, idx: number) => (
                            <div key={idx} className="h-5 flex items-center justify-end">
                              {Number(l.credit) > 0 ? formatCFA(Number(l.credit)) : '—'}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-foreground-muted">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary" />
            <h3 className="text-base font-bold text-foreground">Aucune écriture enregistrée dans ce journal</h3>
            <p className="text-xs text-foreground-muted max-w-md mx-auto mt-1 mb-4">
              Cliquez sur « Nouvelle Pièce Comptable » pour enregistrer vos achats d'intrants, ventes d'animaux, encaissements ou opérations de caisse.
            </p>
            <NouvelleEcritureModal plan={plan || []} />
          </div>
        )}
      </div>
    </div>
  )
}
