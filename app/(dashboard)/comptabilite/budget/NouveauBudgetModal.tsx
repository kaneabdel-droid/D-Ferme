'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Calculator, Loader2, Sparkles, Calendar, Layers } from 'lucide-react'
import { creerBudget } from './actions'

export default function NouveauBudgetModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const anneeEnCours = new Date().getFullYear()
  const [exercice, setExercice] = useState(anneeEnCours)
  const [periodeType, setPeriodeType] = useState('annuel')
  const [dateDebut, setDateDebut] = useState(`${anneeEnCours}-01-01`)
  const [dateFin, setDateFin] = useState(`${anneeEnCours}-12-31`)

  const handlePeriodeChange = (type: string) => {
    setPeriodeType(type)
    if (type === 'annuel') {
      setDateDebut(`${exercice}-01-01`)
      setDateFin(`${exercice}-12-31`)
    } else if (type === 'semestriel') {
      setDateDebut(`${exercice}-01-01`)
      setDateFin(`${exercice}-06-30`)
    } else if (type === 'trimestriel') {
      setDateDebut(`${exercice}-01-01`)
      setDateFin(`${exercice}-03-31`)
    } else if (type === 'mensuel') {
      const mois = String(new Date().getMonth() + 1).padStart(2, '0')
      setDateDebut(`${exercice}-${mois}-01`)
      setDateFin(`${exercice}-${mois}-28`)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    const res = await creerBudget(formData)
    setLoading(false)

    if (res.error) {
      setError(res.error)
    } else {
      setOpen(false)
      if (res.budgetId) {
        router.push(`/comptabilite/budget/${res.budgetId}`)
      } else {
        router.refresh()
      }
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary-hover transition-colors cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Nouveau Budget d'Exploitation</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-surface border border-surface-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-surface-border bg-background/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold font-heading text-foreground text-base">
                    Créer un Budget Prévisionnel
                  </h3>
                  <p className="text-xs text-foreground-muted">
                    Fixez vos objectifs de charges et de produits d'exploitation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-foreground-muted hover:text-foreground p-1 rounded-lg hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {error && (
                <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger font-medium">
                  {error}
                </div>
              )}

              {/* Titre */}
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Titre du Budget *
                </label>
                <input
                  type="text"
                  name="titre"
                  required
                  placeholder={`Ex: Budget Annuel d'Exploitation ${exercice}`}
                  defaultValue={`Budget Prévisionnel ${exercice}`}
                  className="w-full px-3 py-2 rounded-xl border border-surface-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary/20 focus:outline-hidden"
                />
              </div>

              {/* Exercice & Période */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Exercice (Année) *
                  </label>
                  <input
                    type="number"
                    name="exercice"
                    required
                    value={exercice}
                    onChange={(e) => {
                      const val = Number(e.target.value) || anneeEnCours
                      setExercice(val)
                      setDateDebut(`${val}-01-01`)
                      setDateFin(`${val}-12-31`)
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary/20 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Type de Période
                  </label>
                  <select
                    name="periode_type"
                    value={periodeType}
                    onChange={(e) => handlePeriodeChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary/20 focus:outline-hidden"
                  >
                    <option value="annuel">Annuel (12 mois)</option>
                    <option value="semestriel">Semestriel (6 mois)</option>
                    <option value="trimestriel">Trimestriel (3 mois)</option>
                    <option value="mensuel">Mensuel (1 mois)</option>
                    <option value="campagne">Campagne / Cycle spécifique</option>
                  </select>
                </div>
              </div>

              {/* Dates début et fin */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Date de début *
                  </label>
                  <input
                    type="date"
                    name="date_debut"
                    required
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary/20 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Date de fin *
                  </label>
                  <input
                    type="date"
                    name="date_fin"
                    required
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary/20 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Atelier / Domaine */}
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Atelier / Périmètre d'application
                </label>
                <select
                  name="atelier"
                  defaultValue="global"
                  className="w-full px-3 py-2 rounded-xl border border-surface-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary/20 focus:outline-hidden"
                >
                  <option value="global">🌾 Ensemble de la Ferme (Agro-Pastoral Global)</option>
                  <option value="volaille">🐔 Atelier Avicole (Poulets de chair / Pondeuses)</option>
                  <option value="ruminants">🐂 Atelier Ruminants (Bovins, Ovins, Caprins)</option>
                  <option value="lait">🥛 Atelier Laitier & Transformation</option>
                  <option value="vegetal">🌱 Cultures Maraîchères, Fruitières & Fourragères</option>
                  <option value="porcin">🐖 Atelier Porcin</option>
                  <option value="autre">Autre projet spécifique</option>
                </select>
              </div>

              {/* Option template agro-pastoral */}
              <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="inclure_template_agricole"
                  name="inclure_template_agricole"
                  value="true"
                  defaultChecked
                  className="mt-0.5 rounded border-surface-border text-primary focus:ring-primary"
                />
                <label htmlFor="inclure_template_agricole" className="cursor-pointer">
                  <span className="font-bold text-foreground block">
                    Pré-charger le modèle agro-pastoral standard (Recommandé)
                  </span>
                  <span className="text-[11px] text-foreground-muted block mt-0.5">
                    Génère automatiquement les postes standards (Aliments, soins vétérinaires, intrants, main-d'œuvre, ventes d'animaux, lait, œufs, récoltes) pré-remplis avec les comptes SYSCOHADA.
                  </span>
                </label>
              </div>

              {/* Description facultative */}
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Notes & Objectifs d'exploitation (Facultatif)
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Ex: Objectif de marge nette de 30%, renforcement du cheptel et économies sur les aliments concentrés."
                  className="w-full px-3 py-2 rounded-xl border border-surface-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary/20 focus:outline-hidden resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-surface-border flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-xl border border-surface-border text-foreground-muted hover:text-foreground font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover shadow-sm disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Créer le Budget</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
