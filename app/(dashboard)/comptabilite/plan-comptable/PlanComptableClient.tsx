'use client'

import { useState } from 'react'
import { Plus, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react'
import { ajouterComptePlan } from '../actions'

interface Compte {
  id: string
  compte: string
  libelle: string
  classe: number
  type: string
  entreprise_id: string | null
}

const CLASSES_DESCRIPTIONS: Record<number, string> = {
  1: 'Comptes de Ressources Durables (Capitaux propres & Dettes financières)',
  2: 'Comptes d’Actif Immobilisé (Terres agricoles, Bâtiments, Matériels, Cheptel reproducteur)',
  3: 'Comptes de Stocks (Intrants, Semences, Récoltes récoltées, Animaux d’engraissement)',
  4: 'Comptes de Tiers (Fournisseurs d’intrants, Clients acheteurs, Sécurité sociale, État)',
  5: 'Comptes de Trésorerie (Caisses fermes, Banques, Comptes Mobile Money Wave/Orange)',
  6: 'Comptes de Charges des Activités Ordinaires (Aliments bétail, Soins véto, Carburant, Salaires)',
  7: 'Comptes de Produits des Activités Ordinaires (Ventes de bêtes, Lait, Récoltes maraîchères)',
}

export default function PlanComptableClient({ plan }: { plan: Compte[] }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const res = await ajouterComptePlan(formData)

    if (res.error) {
      setError(res.error)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => {
        setModalOpen(false)
        setSuccess(false)
        setLoading(false)
      }, 700)
    }
  }

  // Grouper par classe
  const comptesParClasse = (plan || []).reduce((acc, c) => {
    if (!acc[c.classe]) acc[c.classe] = []
    acc[c.classe].push(c)
    return acc
  }, {} as Record<number, Compte[]>)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-foreground">
            Plan Comptable Exploitation Agricole (SYSCOHADA Révisé)
          </h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Comptes normalisés adaptés aux spécificités agro-pastorales, élevage et productions végétales.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary text-xs flex items-center gap-2 py-2 px-3.5 rounded-xl font-bold"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un Compte</span>
        </button>
      </div>

      {/* Accordion / Sections par classe */}
      <div className="space-y-6">
        {[1, 2, 3, 4, 5, 6, 7].map((classe) => {
          const list = comptesParClasse[classe] || []
          return (
            <div
              key={classe}
              className="bg-surface border border-surface-border rounded-2xl overflow-hidden shadow-sm"
            >
              <div className="px-5 py-3.5 bg-background border-b border-surface-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-mono font-bold text-xs flex items-center justify-center">
                    C{classe}
                  </span>
                  <h3 className="font-bold text-sm text-foreground">
                    Classe {classe} — {CLASSES_DESCRIPTIONS[classe] || `Comptes classe ${classe}`}
                  </h3>
                </div>
                <span className="text-xs text-foreground-muted font-medium">
                  {list.length} compte{list.length > 1 ? 's' : ''}
                </span>
              </div>

              {list.length > 0 ? (
                <div className="divide-y divide-surface-border">
                  {list.map((c) => (
                    <div
                      key={c.id || c.compte}
                      className="px-5 py-3 flex items-center justify-between hover:bg-background/40 transition-colors text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-primary w-16">{c.compte}</span>
                        <span className="font-medium text-foreground">{c.libelle}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-background border border-surface-border text-foreground-muted uppercase font-semibold">
                          {c.type}
                        </span>
                        {c.entreprise_id && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                            Personnalisé
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-4 text-xs text-foreground-muted italic">
                  Aucun sous-compte enregistré dans cette classe.
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal Ajout Compte */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-surface-border p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <h3 className="font-bold font-heading text-lg text-foreground flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Nouveau Compte Comptable
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-foreground-muted hover:text-foreground text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Compte créé avec succès !</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-foreground-muted uppercase mb-1">
                  Numéro de compte *
                </label>
                <input
                  type="text"
                  name="compte"
                  required
                  placeholder="Ex: 6023, 7018, 5212"
                  className="w-full px-3 py-2 rounded-xl border border-surface-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground-muted uppercase mb-1">
                  Intitulé du compte *
                </label>
                <input
                  type="text"
                  name="libelle"
                  required
                  placeholder="Ex: Achats de provende poules pondeuses"
                  className="w-full px-3 py-2 rounded-xl border border-surface-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground-muted uppercase mb-1">
                    Classe *
                  </label>
                  <select
                    name="classe"
                    required
                    defaultValue="6"
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="1">Classe 1 - Capitaux</option>
                    <option value="2">Classe 2 - Immobilisations</option>
                    <option value="3">Classe 3 - Stocks</option>
                    <option value="4">Classe 4 - Tiers</option>
                    <option value="5">Classe 5 - Trésorerie</option>
                    <option value="6">Classe 6 - Charges</option>
                    <option value="7">Classe 7 - Produits</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground-muted uppercase mb-1">
                    Nature / Type *
                  </label>
                  <select
                    name="type"
                    required
                    defaultValue="charge"
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="actif">Actif</option>
                    <option value="passif">Passif</option>
                    <option value="charge">Charge</option>
                    <option value="produit">Produit</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-surface-border text-foreground text-xs font-semibold hover:bg-background"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {loading ? 'Création...' : 'Enregistrer le Compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
