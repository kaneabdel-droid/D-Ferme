'use client'

import { useState, useTransition } from 'react'
import { BadgeCheck, CreditCard, X } from 'lucide-react'
import { accorderAbonnementManuel } from '../actions'

const TARIFS: Record<string, number> = {
  standard: 10000,
  medium: 15000,
  premium: 25000,
}

export default function ValiderAbonnementModal({
  entrepriseId,
  forfaitActuel,
}: {
  entrepriseId: string
  forfaitActuel: string
}) {
  const [open, setOpen] = useState(false)
  const [niveau, setNiveau] = useState(forfaitActuel || 'standard')
  const [mois, setMois] = useState(1)
  const [moyen, setMoyen] = useState('virement')
  const [reference, setReference] = useState('')
  const [customMontant, setCustomMontant] = useState<string>('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const defaultMontant = (TARIFS[niveau] || 10000) * mois
  const montantFinal = customMontant ? parseFloat(customMontant) : defaultMontant

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const res = await accorderAbonnementManuel(entrepriseId, {
        niveau,
        mois,
        montant: isNaN(montantFinal) ? defaultMontant : montantFinal,
        moyen,
        reference: reference.trim() || undefined,
      })

      if (res?.error) {
        setError(res.error)
      } else {
        setOpen(false)
        setReference('')
        setCustomMontant('')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-success/90 transition-colors"
      >
        <BadgeCheck className="w-3.5 h-3.5" />
        Valider un paiement / Activer forfait
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-background border border-surface-border p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-success" />
                Validation de Paiement d'Abonnement
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-foreground-muted hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-xs text-danger">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Forfait validé *
                  </label>
                  <select
                    value={niveau}
                    onChange={(e) => setNiveau(e.target.value)}
                    className="w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="standard">Standard (10 000 F/m)</option>
                    <option value="medium">Medium (15 000 F/m)</option>
                    <option value="premium">Premium (25 000 F/m)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Période / Durée *
                  </label>
                  <select
                    value={mois}
                    onChange={(e) => setMois(parseInt(e.target.value, 10) || 1)}
                    className="w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value={1}>1 mois</option>
                    <option value={3}>3 mois (trimestriel)</option>
                    <option value={6}>6 mois (semestriel)</option>
                    <option value={12}>12 mois (1 an)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Mode d'encaissement *
                  </label>
                  <select
                    value={moyen}
                    onChange={(e) => setMoyen(e.target.value)}
                    className="w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="virement">Virement bancaire</option>
                    <option value="cheque">Chèque</option>
                    <option value="especes">Espèces / Direct</option>
                    <option value="wave">Wave Mobile</option>
                    <option value="orange_money">Orange Money</option>
                    <option value="commercial">Geste commercial / Offert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Montant encaissé (FCFA)
                  </label>
                  <input
                    type="number"
                    value={customMontant !== '' ? customMontant : defaultMontant}
                    onChange={(e) => setCustomMontant(e.target.value)}
                    className="w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Référence de transaction / Numéro de reçu
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ex: VIR-SGBS-98231 ou CHQ-004312"
                  className="w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="p-3 bg-surface rounded-lg border border-surface-border text-xs text-foreground-muted">
                <p>
                  ✅ L'enregistrement valide immédiatement le paiement avec le statut <strong className="text-success">completed</strong>.
                </p>
                <p className="mt-1">
                  L'entreprise bascule sur le forfait sélectionné et l'horloge d'essai est levée.
                </p>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                  className="rounded-lg border border-surface-border bg-surface px-4 py-2 text-xs font-medium text-foreground hover:bg-surface-hover"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-success px-4 py-2 text-xs font-bold text-white hover:bg-success/90 disabled:opacity-50"
                >
                  {isPending ? 'Validation en cours...' : 'Valider et Activer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

