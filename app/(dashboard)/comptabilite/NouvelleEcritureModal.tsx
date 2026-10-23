'use client'

import { useState } from 'react'
import { Plus, X, BookOpen, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { creerEcriture } from './actions'

type LigneForm = {
  compte: string
  libelle: string
  debit: string
  credit: string
}

export default function NouvelleEcritureModal({
  plan
}: {
  plan: Array<{ compte: string; libelle: string; classe: number }>
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [journal, setJournal] = useState('achats')
  const [dateEcriture, setDateEcriture] = useState(new Date().toISOString().split('T')[0])
  const [numeroPiece, setNumeroPiece] = useState('')
  const [libelle, setLibelle] = useState('')

  const [lignes, setLignes] = useState<LigneForm[]>([
    { compte: plan.find(p => p.compte.startsWith('6'))?.compte || '602', libelle: '', debit: '0', credit: '0' },
    { compte: '531', libelle: '', debit: '0', credit: '0' },
  ])

  const totalDebit = lignes.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0)
  const totalCredit = lignes.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0)
  const estEquilibre = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0

  function handleLigneChange(index: number, field: keyof LigneForm, val: string) {
    const updated = [...lignes]
    updated[index] = { ...updated[index], [field]: val }
    setLignes(updated)
  }

  function ajouterLigne() {
    setLignes([...lignes, { compte: '531', libelle: '', debit: '0', credit: '0' }])
  }

  function supprimerLigne(index: number) {
    if (lignes.length <= 2) return
    setLignes(lignes.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!estEquilibre) {
      setError(`L'écriture doit être équilibrée : Débit (${totalDebit.toLocaleString()} FCFA) = Crédit (${totalCredit.toLocaleString()} FCFA)`)
      return
    }

    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.set('journal', journal)
    formData.set('date_ecriture', dateEcriture)
    formData.set('numero_piece', numeroPiece)
    formData.set('libelle', libelle)
    formData.set('lignes', JSON.stringify(lignes.map(l => ({
      compte: l.compte,
      libelle: l.libelle || libelle,
      debit: parseFloat(l.debit) || 0,
      credit: parseFloat(l.credit) || 0
    }))))

    const res = await creerEcriture(formData)
    setLoading(false)

    if (res?.error) {
      setError(res.error)
    } else {
      setOpen(false)
      setLibelle('')
      setNumeroPiece('')
      setLignes([
        { compte: '602', libelle: '', debit: '0', credit: '0' },
        { compte: '531', libelle: '', debit: '0', credit: '0' },
      ])
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 shadow-sm transition-all flex items-center gap-2"
      >
        <Plus className="w-4 h-4" /> Nouvelle Pièce Comptable
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-surface-border rounded-2xl w-full max-w-3xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-2 text-foreground-muted hover:text-foreground rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-heading text-foreground">Saisie d'une Écriture en Partie Double</h3>
                <p className="text-xs text-foreground-muted">SYSCOHADA Révisé — Respect impératif de l'équilibre Débit = Crédit</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Journal de Saisie *</label>
                  <select
                    value={journal}
                    onChange={(e) => setJournal(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:ring-2 focus:ring-primary/20 font-bold text-foreground"
                  >
                    <option value="achats">🛒 Journal des Achats (ACH)</option>
                    <option value="ventes">💰 Journal des Ventes (VTE)</option>
                    <option value="caisse">💵 Journal de Caisse Espèces (CAI)</option>
                    <option value="banque">🏦 Journal de Banque (BNQ)</option>
                    <option value="mobile">📱 Journal Mobile Money Wave/OM (MOB)</option>
                    <option value="od">⚙️ Journal des Opérations Diverses (OD)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Date d'Écriture *</label>
                  <input
                    type="date"
                    value={dateEcriture}
                    onChange={(e) => setDateEcriture(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">N° Pièce / Facture</label>
                  <input
                    type="text"
                    value={numeroPiece}
                    onChange={(e) => setNumeroPiece(e.target.value)}
                    placeholder="FAC-2026-001, BORD..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Libellé Global de l'Écriture *</label>
                <input
                  type="text"
                  value={libelle}
                  onChange={(e) => setLibelle(e.target.value)}
                  required
                  placeholder="ex: Achat 20 sacs aliment finition SEDIMA, Vente 4 béliers Ladoum..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Lignes d'écritures */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
                    Lignes d'imputation comptable
                  </span>
                  <button
                    type="button"
                    onClick={ajouterLigne}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter une ligne
                  </button>
                </div>

                <div className="space-y-2.5">
                  {lignes.map((l, index) => (
                    <div key={index} className="p-3 rounded-xl border border-surface-border bg-background/60 grid grid-cols-12 gap-2.5 items-center">
                      <div className="col-span-12 sm:col-span-5">
                        <label className="text-[10px] text-foreground-muted block mb-0.5 sm:hidden">Compte</label>
                        <select
                          value={l.compte}
                          onChange={(e) => handleLigneChange(index, 'compte', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-surface-border bg-background font-semibold text-foreground"
                        >
                          {plan.map((p) => (
                            <option key={p.compte} value={p.compte}>
                              {p.compte} — {p.libelle}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-12 sm:col-span-3">
                        <label className="text-[10px] text-foreground-muted block mb-0.5 sm:hidden">Libellé ligne</label>
                        <input
                          type="text"
                          value={l.libelle}
                          onChange={(e) => handleLigneChange(index, 'libelle', e.target.value)}
                          placeholder="Libellé spécifique..."
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-surface-border bg-background"
                        />
                      </div>

                      <div className="col-span-5 sm:col-span-2">
                        <label className="text-[10px] text-foreground-muted block mb-0.5 sm:hidden">Débit</label>
                        <input
                          type="number"
                          step="0.01"
                          value={l.debit}
                          onChange={(e) => {
                            handleLigneChange(index, 'debit', e.target.value)
                            if (parseFloat(e.target.value) > 0) {
                              handleLigneChange(index, 'credit', '0')
                            }
                          }}
                          placeholder="Débit"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-surface-border bg-background font-bold text-primary text-right"
                        />
                      </div>

                      <div className="col-span-5 sm:col-span-2 flex items-center gap-1.5">
                        <div className="w-full">
                          <label className="text-[10px] text-foreground-muted block mb-0.5 sm:hidden">Crédit</label>
                          <input
                            type="number"
                            step="0.01"
                            value={l.credit}
                            onChange={(e) => {
                              handleLigneChange(index, 'credit', e.target.value)
                              if (parseFloat(e.target.value) > 0) {
                                handleLigneChange(index, 'debit', '0')
                              }
                            }}
                            placeholder="Crédit"
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-surface-border bg-background font-bold text-secondary text-right"
                          />
                        </div>
                        {lignes.length > 2 && (
                          <button
                            type="button"
                            onClick={() => supprimerLigne(index)}
                            className="p-1 text-danger hover:bg-danger/10 rounded shrink-0 mt-3 sm:mt-0"
                            title="Supprimer la ligne"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totaux & Équilibre */}
              <div className="p-3.5 rounded-xl bg-surface border border-surface-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-foreground-muted block text-[11px]">Total Débit</span>
                    <span className="font-bold text-primary text-sm">{totalDebit.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div>
                    <span className="text-foreground-muted block text-[11px]">Total Crédit</span>
                    <span className="font-bold text-secondary text-sm">{totalCredit.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </div>

                <div>
                  {estEquilibre ? (
                    <span className="px-3 py-1 rounded-full bg-success/15 text-success font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Écriture Équilibrée
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-danger/15 text-danger font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Écart : {Math.abs(totalDebit - totalCredit).toLocaleString('fr-FR')} FCFA
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm text-foreground-muted hover:text-foreground font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading || !estEquilibre}
                  className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm"
                >
                  {loading ? 'Validation en cours...' : 'Valider & Enregistrer l\'Écriture'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
