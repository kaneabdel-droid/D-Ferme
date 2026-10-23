'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Beef } from 'lucide-react'
import { creerAnimal } from './actions'

export default function CreerAnimalModal({
  batiments,
  especes,
  races = []
}: {
  batiments: Array<{ id: string; nom: string }>
  especes: Array<{ code: string; nom: string }>
  races?: Array<{ id: string; nom: string; espece_code?: string }>
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const res = await creerAnimal(formData)

    setLoading(false)
    if (res?.error) {
      setError(res.error)
    } else {
      setOpen(false)
      router.refresh()
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2.5 rounded-xl bg-secondary text-white font-semibold text-sm hover:bg-secondary/90 shadow-sm transition-all flex items-center gap-2"
      >
        <Plus className="w-4 h-4" /> Identifier un Animal (Boucle)
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-surface-border rounded-2xl w-full max-w-lg shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-2 text-foreground-muted hover:text-foreground rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-secondary/10 text-secondary">
                <Beef className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-heading text-foreground">Enregistrer un Ruminant / Reproducteur</h3>
                <p className="text-xs text-foreground-muted">Suivi individuel par boucle auriculaire (Bovin, Ovin, Caprin)</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">N° de Boucle *</label>
                  <input
                    type="text"
                    name="numero_boucle"
                    required
                    placeholder="ex: SN-DK-2026-042"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Nom / Surnom</label>
                  <input
                    type="text"
                    name="nom_ou_surnom"
                    placeholder="ex: Bella, Sultan..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Espèce *</label>
                  <select
                    name="espece_code"
                    required
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  >
                    {especes.map((esp) => (
                      <option key={esp.code} value={esp.code}>
                        {esp.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Race</label>
                  <input
                    type="text"
                    name="race"
                    list="races-list"
                    placeholder="ex: Ladoum, Gobra..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  />
                  <datalist id="races-list">
                    {races.map((r) => (
                      <option key={r.id || r.nom} value={r.nom} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Sexe *</label>
                  <select
                    name="sexe"
                    required
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  >
                    <option value="F">Femelle</option>
                    <option value="M">Mâle</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Bâtiment / Étable / Parc</label>
                  <select
                    name="batiment_id"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  >
                    <option value="">-- Non assigné --</option>
                    {batiments.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Date d'Arrivée *</label>
                  <input
                    type="date"
                    name="date_entree"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Poids (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    name="poids_actuel_kg"
                    placeholder="350"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Prix Achat</label>
                  <input
                    type="number"
                    name="cout_achat"
                    placeholder="250000"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Origine</label>
                  <select
                    name="origine"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  >
                    <option value="ne_sur_ferme">Né sur ferme</option>
                    <option value="achat_marche">Acheté marché</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="en_lactation"
                  name="en_lactation"
                  className="rounded border-surface-border text-secondary focus:ring-secondary"
                />
                <label htmlFor="en_lactation" className="text-xs font-medium text-foreground cursor-pointer">
                  Femelle actuellement en phase de lactation / traite
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-xl border border-surface-border text-foreground text-sm font-semibold hover:bg-black/5"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-secondary text-white text-sm font-semibold hover:bg-secondary/90 disabled:opacity-50"
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
