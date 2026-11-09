'use client'

import { useState } from 'react'
import { ShoppingCart, Plus, Trash2, X, Calculator, CheckCircle2 } from 'lucide-react'
import { enregistrerAchatArticles } from './actions'

type ArticleOption = {
  id: string
  nom: string
  categorie: string
  unite?: string
  conditionnement?: string
  stock_actuel?: number
  prix_unitaire_moyen?: number
}

type LigneAchat = {
  id: string
  intrant_id: string
  quantite: number
  prix_unitaire: number
  conditionnement?: string
}

export default function SaisirAchatModal({
  articles = []
}: {
  articles: ArticleOption[]
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [tiersNom, setTiersNom] = useState('')
  const [dateOperation, setDateOperation] = useState(new Date().toISOString().split('T')[0])
  const [moyenPaiement, setMoyenPaiement] = useState('especes')

  const [lignes, setLignes] = useState<LigneAchat[]>([
    {
      id: '1',
      intrant_id: articles[0]?.id || '',
      quantite: 1,
      prix_unitaire: articles[0]?.prix_unitaire_moyen || 0,
      conditionnement: articles[0]?.conditionnement || articles[0]?.unite || 'sachet'
    }
  ])

  function handleArticleChange(ligneId: string, intrantId: string) {
    const art = articles.find((a) => a.id === intrantId)
    setLignes((prev) =>
      prev.map((l) =>
        l.id === ligneId
          ? {
            ...l,
            intrant_id: intrantId,
            prix_unitaire: art?.prix_unitaire_moyen || 0,
            conditionnement: art?.conditionnement || art?.unite || 'sachet'
          }
          : l
      )
    )
  }

  function handleQuantiteChange(ligneId: string, val: number) {
    setLignes((prev) =>
      prev.map((l) => (l.id === ligneId ? { ...l, quantite: Math.max(0, val) } : l))
    )
  }

  function handlePrixChange(ligneId: string, val: number) {
    setLignes((prev) =>
      prev.map((l) => (l.id === ligneId ? { ...l, prix_unitaire: Math.max(0, val) } : l))
    )
  }

  function ajouterLigne() {
    const nextArt = articles[0]
    setLignes((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        intrant_id: nextArt?.id || '',
        quantite: 1,
        prix_unitaire: nextArt?.prix_unitaire_moyen || 0,
        conditionnement: nextArt?.conditionnement || nextArt?.unite || 'sachet'
      }
    ])
  }

  function supprimerLigne(ligneId: string) {
    if (lignes.length <= 1) return
    setLignes((prev) => prev.filter((l) => l.id !== ligneId))
  }

  // Calcul automatique : montant = quantité * prix pour chaque ligne, puis total général
  const montantTotalGlobal = lignes.reduce((sum, l) => {
    return sum + (Number(l.quantite) || 0) * (Number(l.prix_unitaire) || 0)
  }, 0)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData()
    formData.set('tiers_nom', tiersNom || 'Fournisseur')
    formData.set('date_operation', dateOperation)
    formData.set('moyen_paiement', moyenPaiement)
    formData.set(
      'lignes_articles',
      JSON.stringify(
        lignes.map((l) => ({
          intrant_id: l.intrant_id,
          quantite: Number(l.quantite) || 1,
          prix_unitaire: Number(l.prix_unitaire) || 0
        }))
      )
    )

    const res = await enregistrerAchatArticles(formData)
    setLoading(false)

    if (res?.error) {
      setError(res.error)
    } else {
      setSuccess('Achat enregistré avec succès ! Stocks et finances mis à jour.')
      setTimeout(() => {
        setOpen(false)
        setSuccess(null)
        setTiersNom('')
        setLignes([
          {
            id: '1',
            intrant_id: articles[0]?.id || '',
            quantite: 1,
            prix_unitaire: articles[0]?.prix_unitaire_moyen || 0,
            conditionnement: articles[0]?.conditionnement || articles[0]?.unite || 'sachet'
          }
        ])
      }, 1000)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
      >
        <ShoppingCart className="w-4 h-4" /> Saisir un Achat d&apos;Articles
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-surface-border rounded-2xl w-full max-w-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-2 text-foreground-muted hover:text-foreground rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-heading text-foreground">
                  Saisie des Achats d&apos;Articles & Intrants
                </h3>
                <p className="text-xs text-foreground-muted">
                  Enregistrez votre facture fournisseur : les stocks d&apos;articles sont incrémentés et le montant est calculé automatiquement (Quantité × Prix).
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Fournisseur
                  </label>
                  <input
                    type="text"
                    value={tiersNom}
                    onChange={(e) => setTiersNom(e.target.value)}
                    placeholder="ex: Provenderie du Sahel"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Date d&apos;Achat *
                  </label>
                  <input
                    type="date"
                    value={dateOperation}
                    onChange={(e) => setDateOperation(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Mode de Règlement
                  </label>
                  <select
                    value={moyenPaiement}
                    onChange={(e) => setMoyenPaiement(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="especes">Espèces (Caisse)</option>
                    <option value="wave">Wave</option>
                    <option value="orange_money">Orange Money</option>
                    <option value="virement">Virement Bancaire</option>
                    <option value="cheque">Chèque</option>
                  </select>
                </div>
              </div>

              {/* Section Liste des Articles */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-emerald-600" />
                    Liste des Articles Achetés
                  </label>
                  <button
                    type="button"
                    onClick={ajouterLigne}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter un article
                  </button>
                </div>

                <div className="space-y-2">
                  {lignes.map((ligne, idx) => {
                    const montantLigne = (Number(ligne.quantite) || 0) * (Number(ligne.prix_unitaire) || 0)
                    const artChoisi = articles.find((a) => a.id === ligne.intrant_id)
                    const cond = artChoisi?.conditionnement || artChoisi?.unite || ligne.conditionnement || 'sachet'

                    return (
                      <div
                        key={ligne.id}
                        className="p-3 rounded-xl border border-surface-border bg-background/60 grid grid-cols-12 gap-2 items-center"
                      >
                        {/* Article */}
                        <div className="col-span-5">
                          <label className="block text-[10px] text-foreground-muted mb-0.5">
                            Article / Produit #{idx + 1}
                          </label>
                          <select
                            value={ligne.intrant_id}
                            onChange={(e) => handleArticleChange(ligne.id, e.target.value)}
                            required
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-surface-border bg-surface font-medium text-foreground"
                          >
                            <option value="">-- Sélectionner l&apos;article --</option>
                            {articles.map((art) => (
                              <option key={art.id} value={art.id}>
                                {art.nom} ({art.conditionnement || art.unite || 'sachet'})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantité */}
                        <div className="col-span-2">
                          <label className="block text-[10px] text-foreground-muted mb-0.5">
                            Quantité ({cond})
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0.1"
                            required
                            value={ligne.quantite}
                            onChange={(e) => handleQuantiteChange(ligne.id, parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 text-xs rounded-lg border border-surface-border bg-surface text-center font-bold"
                          />
                        </div>

                        {/* Prix Unitaire */}
                        <div className="col-span-2">
                          <label className="block text-[10px] text-foreground-muted mb-0.5">
                            Prix Unit. (FCFA)
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            required
                            value={ligne.prix_unitaire}
                            onChange={(e) => handlePrixChange(ligne.id, parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 text-xs rounded-lg border border-surface-border bg-surface text-right font-medium"
                          />
                        </div>

                        {/* Montant = Quantité * Prix */}
                        <div className="col-span-2 text-right">
                          <label className="block text-[10px] text-foreground-muted mb-0.5">
                            Montant
                          </label>
                          <div className="text-xs font-bold text-emerald-600 font-mono py-1.5">
                            {montantLigne.toLocaleString('fr-FR')} F
                          </div>
                        </div>

                        {/* Supprimer */}
                        <div className="col-span-1 text-center">
                          <label className="block text-[10px] text-transparent mb-0.5">X</label>
                          <button
                            type="button"
                            onClick={() => supprimerLigne(ligne.id)}
                            disabled={lignes.length <= 1}
                            className="p-1.5 rounded-lg text-foreground-muted hover:text-danger hover:bg-danger/10 disabled:opacity-30 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Récapitulatif Total : montant = quantité * prix */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    Total Facture Achats ({lignes.length} article{lignes.length > 1 ? 's' : ''})
                  </p>
                  <p className="text-[11px] text-foreground-muted">
                    Montant calculé automatiquement = Somme des (Quantité × Prix)
                  </p>
                </div>
                <div className="text-xl font-black font-heading text-emerald-600 dark:text-emerald-400 font-mono">
                  {montantTotalGlobal.toLocaleString('fr-FR')} FCFA
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-xl border border-surface-border text-foreground text-sm font-semibold hover:bg-black/5 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading || montantTotalGlobal <= 0}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {loading ? 'Enregistrement des achats...' : 'Valider l’Achat & Actualiser Stocks'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

