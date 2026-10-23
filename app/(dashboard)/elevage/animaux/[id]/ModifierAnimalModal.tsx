'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Edit3, X, Beef } from 'lucide-react'
import { modifierAnimal } from '../actions'

export default function ModifierAnimalModal({
  animal,
  batiments,
  especes,
  races
}: {
  animal: any
  batiments: Array<{ id: string; nom: string }>
  especes: Array<{ code: string; nom: string }>
  races: Array<{ nom: string; espece_code?: string }>
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedEspece, setSelectedEspece] = useState(animal.espece_code || especes[0]?.code || '')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set('id', animal.id)

    const res = await modifierAnimal(formData)
    setLoading(false)

    if (res?.error) {
      setError(res.error)
    } else {
      setOpen(false)
      if (res?.newId) {
        router.push(`/elevage/animaux/${res.newId}`)
      } else {
        router.refresh()
      }
    }
  }

  const filteredRaces = races.filter(
    (r) => !r.espece_code || r.espece_code === selectedEspece
  )

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3.5 py-2 rounded-xl bg-surface border border-surface-border text-foreground hover:border-primary text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
      >
        <Edit3 className="w-3.5 h-3.5 text-primary" /> Modifier la Fiche
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
                <Beef className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-heading text-foreground">Modifier la Fiche Animal</h3>
                <p className="text-xs text-foreground-muted">Boucle #{animal.numero_boucle}</p>
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
                    defaultValue={animal.numero_boucle}
                    required
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Nom / Surnom</label>
                  <input
                    type="text"
                    name="nom_ou_surnom"
                    defaultValue={animal.nom_ou_surnom || ''}
                    placeholder="Bella, Sultan..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Espèce *</label>
                  <select
                    name="espece_code"
                    value={selectedEspece}
                    onChange={(e) => setSelectedEspece(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                    list="races-list-mod"
                    name="race"
                    defaultValue={animal.race || ''}
                    placeholder="Gobra, Ladoum..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <datalist id="races-list-mod">
                    {filteredRaces.map((r, idx) => (
                      <option key={idx} value={r.nom} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Sexe *</label>
                  <select
                    name="sexe"
                    defaultValue={animal.sexe}
                    required
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="F">Femelle (F)</option>
                    <option value="M">Mâle (M)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Poids (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="poids_actuel_kg"
                    defaultValue={animal.poids_actuel_kg || ''}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">État de santé</label>
                  <select
                    name="etat_sante"
                    defaultValue={animal.etat_sante || 'sain'}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 font-semibold"
                  >
                    <option value="sain">Sain</option>
                    <option value="en_soins">En soins</option>
                    <option value="en_latence">En latence médicale</option>
                    <option value="isole">Isolé / Quarantaine</option>
                    <option value="vendu">Vendu</option>
                    <option value="decede">Décédé</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Bâtiment / Enclos</label>
                  <select
                    name="batiment_id"
                    defaultValue={animal.batiment_id || ''}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Aucun (Parc général)</option>
                    {batiments.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Date de Naissance</label>
                  <input
                    type="date"
                    name="date_naissance"
                    defaultValue={animal.date_naissance || ''}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Père (Boucle)</label>
                  <input
                    type="text"
                    name="pere_boucle"
                    defaultValue={animal.pere_boucle || ''}
                    placeholder="N° Boucle père"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Mère (Boucle)</label>
                  <input
                    type="text"
                    name="mere_boucle"
                    defaultValue={animal.mere_boucle || ''}
                    placeholder="N° Boucle mère"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="en_lactation_mod"
                  name="en_lactation"
                  defaultChecked={animal.en_lactation}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
                <label htmlFor="en_lactation_mod" className="text-xs font-semibold text-foreground">
                  Femelle en phase active de lactation / traite
                </label>
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
                  className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer les Modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
