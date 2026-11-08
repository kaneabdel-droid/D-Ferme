'use client'

import { useState } from 'react'
import { Plus, X, DollarSign, TrendingUp, TrendingDown, ShoppingBag, Trash2, Calculator } from 'lucide-react'
import { enregistrerOperation } from './actions'

type ArticleOption = {
  id: string
  nom: string
  categorie: string
  unite?: string
  conditionnement?: string
  prix_unitaire_moyen?: number
  stock_actuel?: number
}

type LigneArticleAchat = {
  id: string
  intrant_id: string
  quantite: number
  prix_unitaire: number
  conditionnement?: string
}

export default function CreerOperationModal({
  bandes,
  animaux,
  intrants = []
}: {
  bandes: Array<{ id: string; code_bande: string; statut: string }>
  animaux: Array<{ id: string; numero_boucle: string; etat_sante: string }>
  intrants?: ArticleOption[]
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [typeOp, setTypeOp] = useState('vente_sujets')

  // Champs opération simple / ventes
  const [quantiteSimple, setQuantiteSimple] = useState<number>(1)
  const [prixUnitaireSimple, setPrixUnitaireSimple] = useState<number>(0)
  const [montantManuel, setMontantManuel] = useState<string>('')

  // Liste d'articles pour la saisie des achats
  const [lignesArticles, setLignesArticles] = useState<LigneArticleAchat[]>([
    {
      id: '1',
      intrant_id: intrants[0]?.id || '',
      quantite: 1,
      prix_unitaire: intrants[0]?.prix_unitaire_moyen || 0,
      conditionnement: intrants[0]?.conditionnement || intrants[0]?.unite || 'sachet'
    }
  ])

  const isVente = typeOp.startsWith('vente') || typeOp === 'autre_produit'
  const isAchatIntrant = typeOp === 'achat_intrant'

  // Calcul automatique pour achat liste articles : Somme (quantité * prix)
  const totalLignesAchats = lignesArticles.reduce((sum, l) => {
    return sum + (Number(l.quantite) || 0) * (Number(l.prix_unitaire) || 0)
  }, 0)

  // Calcul automatique opération simple : montant = quantité * prix
  const montantCalculeSimple = quantiteSimple > 0 && prixUnitaireSimple > 0
    ? quantiteSimple * prixUnitaireSimple
    : (parseFloat(montantManuel) || 0)

  function handleArticleChange(ligneId: string, intrantId: string) {
    const art = intrants.find((a) => a.id === intrantId)
    setLignesArticles((prev) =>
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

  function handleLigneQteChange(ligneId: string, val: number) {
    setLignesArticles((prev) =>
      prev.map((l) => (l.id === ligneId ? { ...l, quantite: Math.max(0, val) } : l))
    )
  }

  function handleLignePrixChange(ligneId: string, val: number) {
    setLignesArticles((prev) =>
      prev.map((l) => (l.id === ligneId ? { ...l, prix_unitaire: Math.max(0, val) } : l))
    )
  }

  function ajouterLigneArticle() {
    const nextArt = intrants[0]
    setLignesArticles((prev) => [
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

  function supprimerLigneArticle(ligneId: string) {
    if (lignesArticles.length <= 1) return
    setLignesArticles((prev) => prev.filter((l) => l.id !== ligneId))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    if (isAchatIntrant) {
      formData.set(
        'lignes_articles',
        JSON.stringify(
          lignesArticles.map((l) => ({
            intrant_id: l.intrant_id,
            quantite: Number(l.quantite) || 1,
            prix_unitaire: Number(l.prix_unitaire) || 0
          }))
        )
      )
      formData.set('montant_total', String(totalLignesAchats))
    } else {
      formData.set('quantite', String(quantiteSimple))
      formData.set('prix_unitaire', String(prixUnitaireSimple))
      formData.set('montant_total', String(montantCalculeSimple))
    }

    const res = await enregistrerOperation(formData)

    setLoading(false)
    if (res?.error) {
      setError(res.error)
    } else {
      setOpen(false)
      setMontantManuel('')
      setQuantiteSimple(1)
      setPrixUnitaireSimple(0)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover shadow-sm transition-all flex items-center gap-2 cursor-pointer"
      >
        <Plus className="w-4 h-4" /> Enregistrer une Opération
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-surface-border rounded-2xl w-full max-w-xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-2 text-foreground-muted hover:text-foreground rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2.5 rounded-xl ${isVente ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}>
                {isVente ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-xl font-bold font-heading text-foreground">
                  {isVente ? 'Encaisser une Vente' : isAchatIntrant ? 'Saisie des Achats d’Articles & Intrants' : 'Enregistrer une Charge'}
                </h3>
                <p className="text-xs text-foreground-muted">
                  {isAchatIntrant 
                    ? 'Ajoutez la liste des articles achetés avec calcul automatique (Montant = Quantité × Prix)' 
                    : "Ventes d'animaux, œufs, lait ou charges vétérinaires et d'exploitation"}
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Type d&apos;Opération *</label>
                <select
                  name="type_operation"
                  value={typeOp}
                  onChange={(e) => setTypeOp(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                >
                  <optgroup label="Revenus & Ventes">
                    <option value="vente_sujets">Vente d&apos;animaux / volailles</option>
                    <option value="vente_oeufs">Vente d&apos;œufs (plateaux / alvéoles)</option>
                    <option value="vente_lait">Vente de lait</option>
                    <option value="autre_produit">Autre produit d&apos;élevage</option>
                  </optgroup>
                  <optgroup label="Dépenses & Achats">
                    <option value="achat_intrant">🛒 Achat d&apos;aliments / intrants / sachets (Gestion Articles)</option>
                    <option value="charge_veterinaire">Soins vétérinaires / vaccins</option>
                    <option value="achat_animaux">Achat d&apos;animaux</option>
                    <option value="autre_charge">Autre charge d&apos;exploitation</option>
                  </optgroup>
                </select>
              </div>

              {/* SECTION 1 : SAISIE DES ACHATS D'ARTICLES EN LISTE (achat_intrant) */}
              {isAchatIntrant ? (
                <div className="space-y-3 p-3.5 rounded-xl border border-surface-border bg-background/50">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-primary" />
                      Liste des Articles Achetés
                    </label>
                    <button
                      type="button"
                      onClick={ajouterLigneArticle}
                      className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Ajouter un article
                    </button>
                  </div>

                  <div className="space-y-2">
                    {lignesArticles.map((l, idx) => {
                      const montantLigne = (Number(l.quantite) || 0) * (Number(l.prix_unitaire) || 0)
                      const art = intrants.find((a) => a.id === l.intrant_id)
                      const cond = art?.conditionnement || art?.unite || l.conditionnement || 'sachet'

                      return (
                        <div
                          key={l.id}
                          className="p-2.5 rounded-xl border border-surface-border bg-surface grid grid-cols-12 gap-2 items-center"
                        >
                          <div className="col-span-5">
                            <label className="block text-[10px] text-foreground-muted mb-0.5">
                              Article #{idx + 1}
                            </label>
                            <select
                              value={l.intrant_id}
                              onChange={(e) => handleArticleChange(l.id, e.target.value)}
                              required
                              className="w-full px-2 py-1.5 text-xs rounded-lg border border-surface-border bg-background font-medium text-foreground"
                            >
                              <option value="">-- Sélectionner l&apos;article --</option>
                              {intrants.map((artOption) => (
                                <option key={artOption.id} value={artOption.id}>
                                  {artOption.nom} ({artOption.conditionnement || artOption.unite || 'sachet'})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="col-span-2">
                            <label className="block text-[10px] text-foreground-muted mb-0.5">
                              Quantité ({cond})
                            </label>
                            <input
                              type="number"
                              step="any"
                              min="0.1"
                              required
                              value={l.quantite}
                              onChange={(e) => handleLigneQteChange(l.id, parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 text-xs rounded-lg border border-surface-border bg-background text-center font-bold"
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="block text-[10px] text-foreground-muted mb-0.5">
                              Prix Unit.
                            </label>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              required
                              value={l.prix_unitaire}
                              onChange={(e) => handleLignePrixChange(l.id, parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 text-xs rounded-lg border border-surface-border bg-background text-right font-medium"
                            />
                          </div>

                          <div className="col-span-2 text-right">
                            <label className="block text-[10px] text-foreground-muted mb-0.5">
                              Montant (Q × P)
                            </label>
                            <div className="text-xs font-bold text-primary font-mono py-1.5">
                              {montantLigne.toLocaleString('fr-FR')} F
                            </div>
                          </div>

                          <div className="col-span-1 text-center">
                            <label className="block text-[10px] text-transparent mb-0.5">X</label>
                            <button
                              type="button"
                              onClick={() => supprimerLigneArticle(l.id)}
                              disabled={lignesArticles.length <= 1}
                              className="p-1 rounded-lg text-foreground-muted hover:text-danger disabled:opacity-30 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Récapitulatif automatique : montant = quantité * prix */}
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-primary">
                        Total Achat ({lignesArticles.length} article{lignesArticles.length > 1 ? 's' : ''})
                      </span>
                      <p className="text-[10px] text-foreground-muted">
                        Montant calculé automatiquement : Somme des (Quantité × Prix)
                      </p>
                    </div>
                    <div className="text-lg font-black font-heading text-primary font-mono">
                      {totalLignesAchats.toLocaleString('fr-FR')} FCFA
                    </div>
                  </div>
                </div>
              ) : (
                /* SECTION 2 : OPÉRATIONS STANDARD (VENTES & AUTRES CHARGES) */
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Bande Associée</label>
                      <select
                        name="bande_id"
                        className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">-- Aucune --</option>
                        {bandes.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.code_bande} {b.statut === 'en_latence' ? '⚠️ (Latence active)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Ou Animal Individuel</label>
                      <select
                        name="animal_id"
                        className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">-- Aucun --</option>
                        {animaux.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.numero_boucle} {a.etat_sante === 'en_latence' ? '⚠️ (Latence active)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-background/50 border border-surface-border">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Quantité *</label>
                      <input
                        type="number"
                        step="any"
                        min="0.1"
                        required
                        value={quantiteSimple}
                        onChange={(e) => setQuantiteSimple(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background text-center font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Prix Unitaire *</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        required
                        value={prixUnitaireSimple}
                        onChange={(e) => setPrixUnitaireSimple(parseFloat(e.target.value) || 0)}
                        placeholder="Prix / unité"
                        className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background text-right font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        Montant Total (Q × P)
                      </label>
                      <div className="px-3 py-2 text-sm rounded-xl border border-primary/20 bg-primary/10 text-primary font-bold font-mono text-right">
                        {montantCalculeSimple.toLocaleString('fr-FR')} FCFA
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    {isVente ? 'Client' : 'Fournisseur / Tiers'}
                  </label>
                  <input
                    type="text"
                    name="tiers_nom"
                    placeholder={isVente ? 'Nom du client' : 'Nom du fournisseur'}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Mode de Paiement</label>
                  <select
                    name="moyen_paiement"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="especes">Espèces (Caisse)</option>
                    <option value="wave">Wave</option>
                    <option value="orange_money">Orange Money</option>
                    <option value="virement">Virement Bancaire</option>
                    <option value="cheque">Chèque</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Date *</label>
                  <input
                    type="date"
                    name="date_operation"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Libellé / Détails</label>
                  <input
                    type="text"
                    name="description"
                    placeholder="ex: Facture provende ou vente directe"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-xl border border-surface-border text-foreground text-sm font-semibold hover:bg-black/5 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading || (isAchatIntrant ? totalLignesAchats <= 0 : montantCalculeSimple <= 0)}
                  className={`px-5 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50 cursor-pointer shadow-sm ${
                    isVente ? 'bg-success hover:bg-success/90' : 'bg-primary hover:bg-primary-hover'
                  }`}
                >
                  {loading 
                    ? 'Enregistrement...' 
                    : isVente 
                      ? 'Valider la Vente' 
                      : isAchatIntrant 
                        ? 'Valider l’Achat & Actualiser Stocks' 
                        : 'Valider la Charge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
