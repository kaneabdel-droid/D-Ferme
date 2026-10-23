'use client'

import { useState } from 'react'
import { Plus, X, Scale } from 'lucide-react'
import { ajouterSuiviAnimal } from '../actions'

export default function AjouterSuiviModal({
  animalId,
  numeroBoucle,
  poidsActuel
}: {
  animalId: string
  numeroBoucle: string
  poidsActuel?: number | null
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set('animal_id', animalId)

    const res = await ajouterSuiviAnimal(formData)
    setLoading(false)

    if (res?.error) {
      setError(res.error)
    } else {
      setOpen(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2.5 rounded-xl bg-surface border border-surface-border text-foreground font-semibold text-sm hover:border-secondary hover:text-secondary shadow-sm transition-all flex items-center gap-2"
      >
        <Plus className="w-4 h-4 text-secondary" /> Enregistrer une Pesée / Contrôle
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-surface-border rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-2 text-foreground-muted hover:text-foreground rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-secondary/10 text-secondary">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-heading text-foreground">Pesée & Contrôle Croissance</h3>
                <p className="text-xs text-foreground-muted">Animal #{numeroBoucle}</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Date de la pesée *</label>
                <input
                  type="date"
                  name="date_suivi"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Poids mesuré (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    name="poids_moyen_mesure_kg"
                    defaultValue={poidsActuel || ''}
                    placeholder="ex: 435.5"
                    required
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-secondary/20 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Lait récolté (L/jour)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="lait_recolte_litres"
                    placeholder="ex: 15.2"
                    defaultValue="0"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Observations / État général</label>
                <textarea
                  name="observations"
                  rows={2}
                  placeholder="Appétit, vigueur, croissance constatée..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
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
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-secondary text-white font-semibold text-sm hover:bg-secondary/90 disabled:opacity-50 transition-all"
                >
                  {loading ? 'Enregistrement...' : 'Valider la Pesée'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
