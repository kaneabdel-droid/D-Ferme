'use client'

import { useState } from 'react'
import { Plus, X, ShieldAlert, Pill } from 'lucide-react'
import { ajouterSoinAnimal } from '../actions'

export default function AjouterSoinModal({
  animalId,
  numeroBoucle,
  intrants
}: {
  animalId: string
  numeroBoucle: string
  intrants: Array<{ id: string; nom: string; latence_jours_defaut: number; unite: string }>
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIntrantId, setSelectedIntrantId] = useState(intrants[0]?.id || '')
  const [dureeLatence, setDureeLatence] = useState<number>(intrants[0]?.latence_jours_defaut || 0)

  function handleIntrantChange(id: string) {
    setSelectedIntrantId(id)
    const it = intrants.find((i) => i.id === id)
    if (it) {
      setDureeLatence(it.latence_jours_defaut || 0)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set('animal_id', animalId)
    formData.set('duree_latence_jours', dureeLatence.toString())

    const res = await ajouterSoinAnimal(formData)
    setLoading(false)

    if (res?.error) {
      setError(res.error)
    } else {
      setOpen(false)
    }
  }

  const selectedIntrant = intrants.find((i) => i.id === selectedIntrantId)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2.5 rounded-xl bg-danger text-white font-semibold text-sm hover:bg-danger/90 shadow-sm transition-all flex items-center gap-2"
      >
        <Plus className="w-4 h-4" /> Administrer un Soin / Traitement
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
              <div className="p-2.5 rounded-xl bg-danger/10 text-danger">
                <Pill className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-heading text-foreground">Soin Sanitaire & Traitement</h3>
                <p className="text-xs text-foreground-muted">Administration pour l'animal #{numeroBoucle}</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Médicament / Vaccin *</label>
                <select
                  name="intrant_id"
                  required
                  value={selectedIntrantId}
                  onChange={(e) => handleIntrantChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-danger/20 font-medium"
                >
                  {intrants.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nom} ({i.unite}) {i.latence_jours_defaut > 0 ? `— Latence ${i.latence_jours_defaut}j` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Date d'Administration *</label>
                  <input
                    type="date"
                    name="date_administration"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-danger/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Quantité administrée *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="quantite_administree"
                    defaultValue="1"
                    required
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-danger/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Posologie / Dose par sujet</label>
                  <input
                    type="text"
                    name="dose_par_sujet"
                    placeholder="ex: 5 ml IM, 1 comprimé..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-danger/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Motif médical *</label>
                  <select
                    name="motif"
                    required
                    defaultValue="antibiotique_curatif"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-danger/20"
                  >
                    <option value="antibiotique_curatif">Traitement curatif (Antibiotique)</option>
                    <option value="vaccination_preventive">Vaccination préventive</option>
                    <option value="vitamines_demarrage">Vitamines & Fortifiant</option>
                    <option value="antiparasitaire">Antiparasitaire / Déparasitage</option>
                    <option value="autre">Autre soin vétérinaire</option>
                  </select>
                </div>
              </div>

              <div className="rounded-xl p-3 bg-danger/5 border border-danger/20">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-danger flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" /> Délai d'Attente / Retrait Sanitaire (Jours)
                  </label>
                  <span className="text-xs font-bold text-danger">{dureeLatence} jour(s)</span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={dureeLatence}
                  onChange={(e) => setDureeLatence(parseInt(e.target.value || '0', 10))}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-danger/30 bg-background focus:outline-none font-semibold text-danger"
                />
                <p className="text-[11px] text-foreground-muted mt-1.5">
                  Interdit la consommation du lait, de la viande ou l'abattage pendant ce délai pour élimination des résidus.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Vétérinaire / Administré par</label>
                  <input
                    type="text"
                    name="administre_par"
                    placeholder="ex: Dr. Sow, Vétérinaire..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-danger/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Notes / Diagnostic</label>
                  <input
                    type="text"
                    name="notes"
                    placeholder="ex: Suspicion bronchite, boiterie..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-danger/20"
                  />
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
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-danger text-white font-semibold text-sm hover:bg-danger/90 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer le Soin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
