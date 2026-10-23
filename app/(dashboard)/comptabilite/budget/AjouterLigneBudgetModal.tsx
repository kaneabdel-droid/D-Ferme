'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2, Tag, DollarSign, BookOpen } from 'lucide-react'
import { ajouterLigneBudget } from './actions'

const CATEGORIES_SUGGESTIONS = [
  { type: 'charge', cat: 'aliments', compte: '602', label: 'Aliments bétail & Provendes' },
  { type: 'charge', cat: 'soins_veterinaires', compte: '608', label: 'Soins vétérinaires, vaccins & hygiène' },
  { type: 'charge', cat: 'achats_animaux', compte: '601', label: 'Achat poussins, reproducteurs & sujets' },
  { type: 'charge', cat: 'semences_engrais', compte: '604', label: 'Semences, plants & fertilisants' },
  { type: 'charge', cat: 'carburant_energie', compte: '605', label: 'Carburant tracteurs, électricité & eau' },
  { type: 'charge', cat: 'main_oeuvre', compte: '631', label: 'Salaires ouvriers & main d’œuvre agricole' },
  { type: 'charge', cat: 'transport_logistique', compte: '624', label: 'Transports d’animaux & logistique' },
  { type: 'charge', cat: 'entretien_reparations', compte: '624', label: 'Entretien bâtiments, clôtures & matériel' },
  { type: 'charge', cat: 'autre', compte: '658', label: 'Autres charges courantes' },

  { type: 'produit', cat: 'ventes_animaux', compte: '701', label: 'Ventes d’animaux vifs (volailles, ovins, bovins)' },
  { type: 'produit', cat: 'ventes_lait', compte: '702', label: 'Ventes de lait frais & caillé' },
  { type: 'produit', cat: 'ventes_oeufs', compte: '703', label: 'Ventes d’œufs de table' },
  { type: 'produit', cat: 'ventes_recoltes', compte: '704', label: 'Ventes de récoltes maraîchères & fruitières' },
  { type: 'produit', cat: 'autre_produit', compte: '708', label: 'Sous-produits (Fumier organique, paille, etc.)' },

  { type: 'investissement', cat: 'materiel_agricole', compte: '215', label: 'Matériel agricole, abreuvoirs & équipements' },
  { type: 'investissement', cat: 'batiments_enclos', compte: '213', label: 'Bâtiments, étables, poulaillers & hangars' },
  { type: 'investissement', cat: 'cheptel_reproducteur', compte: '241', label: 'Génisses, béliers & cheptel immobilisé' },
]

export default function AjouterLigneBudgetModal({ budgetId }: { budgetId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [typeFlux, setTypeFlux] = useState<'charge' | 'produit' | 'investissement'>('charge')
  const [compteSyscohada, setCompteSyscohada] = useState('602')
  const [categorie, setCategorie] = useState('aliments')
  const [libelle, setLibelle] = useState('')

  const handleSuggestionSelect = (sugg: typeof CATEGORIES_SUGGESTIONS[0]) => {
    setTypeFlux(sugg.type as any)
    setCategorie(sugg.cat)
    setCompteSyscohada(sugg.compte)
    setLibelle(sugg.label)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set('budget_id', budgetId)
    formData.set('type_flux', typeFlux)
    formData.set('categorie', categorie)
    formData.set('compte_syscohada', compteSyscohada)

    const res = await ajouterLigneBudget(formData)
    setLoading(false)

    if (res.error) {
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
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-hover transition-colors cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Ajouter une Ligne de Prévision</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-surface border border-surface-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-surface-border bg-background/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold font-heading text-foreground text-base">
                    Ajouter un Poste Budgétaire
                  </h3>
                  <p className="text-xs text-foreground-muted">
                    Prévoyez un montant d'exploitation pour cette période
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

              {/* Type de flux */}
              <div>
                <label className="block font-semibold text-foreground mb-1.5">
                  Type de flux *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTypeFlux('charge')
                      setCompteSyscohada('602')
                      setCategorie('aliments')
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                      typeFlux === 'charge'
                        ? 'bg-danger/10 text-danger border-danger shadow-xs'
                        : 'border-surface-border text-foreground-muted hover:bg-black/5'
                    }`}
                  >
                    Dépense (Charge)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTypeFlux('produit')
                      setCompteSyscohada('701')
                      setCategorie('ventes_animaux')
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                      typeFlux === 'produit'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500 shadow-xs'
                        : 'border-surface-border text-foreground-muted hover:bg-black/5'
                    }`}
                  >
                    Recette (Produit)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTypeFlux('investissement')
                      setCompteSyscohada('215')
                      setCategorie('materiel_agricole')
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                      typeFlux === 'investissement'
                        ? 'bg-primary/10 text-primary border-primary shadow-xs'
                        : 'border-surface-border text-foreground-muted hover:bg-black/5'
                    }`}
                  >
                    Investissement
                  </button>
                </div>
              </div>

              {/* Suggestions rapides */}
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Suggestions de postes fréquents
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 rounded-xl bg-background border border-surface-border">
                  {CATEGORIES_SUGGESTIONS.filter((s) => s.type === typeFlux).map((sugg) => (
                    <button
                      key={sugg.cat}
                      type="button"
                      onClick={() => handleSuggestionSelect(sugg)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-surface border border-surface-border hover:border-primary hover:text-primary transition-colors text-left"
                    >
                      {sugg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Libellé */}
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Désignation du poste *
                </label>
                <input
                  type="text"
                  name="libelle"
                  required
                  placeholder="Ex: Aliments provendes démarrage poulets"
                  value={libelle}
                  onChange={(e) => setLibelle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-surface-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary/20 focus:outline-hidden"
                />
              </div>

              {/* Compte SYSCOHADA & Montant */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Compte SYSCOHADA lié
                  </label>
                  <input
                    type="text"
                    value={compteSyscohada}
                    onChange={(e) => setCompteSyscohada(e.target.value)}
                    placeholder="Ex: 602, 608, 701"
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary/20 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-foreground-muted mt-0.5 block">
                    Permet le rapprochement automatique
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Montant Prévisionnel (FCFA) *
                  </label>
                  <input
                    type="number"
                    name="montant_prevu"
                    required
                    min="1"
                    step="1000"
                    placeholder="Ex: 500000"
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary/20 focus:outline-hidden font-bold"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Hypothèses de calcul & Notes (Facultatif)
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Ex: 50 sacs de concentré à 18.000 FCFA/sac + transport."
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
                  <span>Enregistrer le poste</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
