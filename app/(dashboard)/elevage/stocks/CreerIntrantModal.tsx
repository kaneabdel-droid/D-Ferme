'use client'

import { useState } from 'react'
import { Plus, X, Boxes } from 'lucide-react'
import { creerIntrant } from './actions'

export default function CreerIntrantModal({
  categories = []
}: {
  categories?: Array<{ code: string; nom: string }>
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categorie, setCategorie] = useState(categories[0]?.code || 'aliment')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const res = await creerIntrant(formData)

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
        className="px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover shadow-sm transition-all flex items-center gap-2"
      >
        <Plus className="w-4 h-4" /> Nouvel Article en Stock
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
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-heading text-foreground">Ajouter un Intrant / Médicament</h3>
                <p className="text-xs text-foreground-muted">Aliments (démarrage, finition), vaccins, vitamines, litière</p>
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
                  <label className="block text-xs font-semibold text-foreground mb-1">Nom du Produit *</label>
                  <input
                    type="text"
                    name="nom"
                    required
                    placeholder="ex: Aliment Démarrage Poussin"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Catégorie *</label>
                  <select
                    name="categorie"
                    value={categorie}
                    onChange={(e) => setCategorie(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {categories.length > 0 ? (
                      categories.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.nom}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="aliment">Aliment / Rations</option>
                        <option value="medicament">Médicament vétérinaire</option>
                        <option value="vaccin">Vaccin</option>
                        <option value="vitamines">Vitamines & Minéraux</option>
                        <option value="litiere">Litière / Paille</option>
                        <option value="desinfectant">Désinfectant / Hygiène</option>
                        <option value="semences">Semences & Plants</option>
                        <option value="engrais">Engrais & Fertilisants</option>
                        <option value="autre">Autre consommable</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Unité de mesure</label>
                  <select
                    name="unite"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="kg">Kilogramme (kg)</option>
                    <option value="sac_50kg">Sac de 50 kg</option>
                    <option value="flacon">Flacon</option>
                    <option value="dose">Dose</option>
                    <option value="litre">Litre (L)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Stock Initial</label>
                  <input
                    type="number"
                    step="0.5"
                    name="stock_actuel"
                    defaultValue="0"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Seuil Alerte Min</label>
                  <input
                    type="number"
                    step="0.5"
                    name="stock_minimum"
                    defaultValue="5"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Prix Unitaire Moyen</label>
                  <input
                    type="number"
                    name="prix_unitaire_moyen"
                    defaultValue="0"
                    placeholder="Prix par unité"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Délai Latence / Retrait (Jours)
                  </label>
                  <input
                    type="number"
                    name="latence_jours_defaut"
                    defaultValue="0"
                    placeholder="0 si pas de délai"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-[10px] text-foreground-muted mt-0.5">Délai d’attente avant vente/abattage</p>
                </div>
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
                  className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover disabled:opacity-50"
                >
                  {loading ? 'Enregistrement...' : 'Créer l’article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
