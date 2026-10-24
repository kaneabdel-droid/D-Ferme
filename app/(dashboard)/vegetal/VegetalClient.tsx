'use client'

import { useState } from 'react'
import { 
  Sprout, 
  Wheat, 
  Apple, 
  Store, 
  Layers, 
  Plus, 
  Calendar, 
  MapPin, 
  Droplet, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Boxes, 
  Filter,
  Eye,
  X,
  FileText,
  HeartHandshake
} from 'lucide-react'
import { formatMontant } from '@/lib/currency'
import { 
  ajouterParcelle, 
  ajouterRecolte, 
  ajusterStockVegetal, 
  ajouterVenteVegetale 
} from './actions'

export default function VegetalClient({
  initialTab = 'parcelles',
  parcelles = [],
  recoltes = [],
  stocks = [],
  ventes = [],
  devise = 'FCFA',
  dict,
  locale
}: {
  initialTab?: string
  parcelles: any[]
  recoltes: any[]
  stocks: any[]
  ventes: any[]
  devise: string
  dict: any
  locale: string
}) {
  const [tab, setTab] = useState(initialTab)
  const [filterType, setFilterType] = useState('tous')
  
  // Modals state
  const [modalParcelle, setModalParcelle] = useState(false)
  const [modalRecolte, setModalRecolte] = useState(false)
  const [modalStock, setModalStock] = useState(false)
  const [modalVente, setModalVente] = useState(false)

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Statistiques calculées
  const totalSurfaceHa = parcelles.reduce((acc, p) => acc + (Number(p.surface_ha) || 0), 0)
  const totalRecolteKg = recoltes.reduce((acc, r) => acc + (Number(r.quantite) || 0), 0)
  const totalValeurStock = stocks.reduce((acc, s) => acc + ((Number(s.quantite_disponible) || 0) * (Number(s.prix_unitaire_estime) || 0)), 0)
  const totalVentesMontant = ventes.reduce((acc, v) => acc + (Number(v.montant_total) || 0), 0)

  // Filtrage des parcelles
  const parcellesFiltrees = parcelles.filter(p => {
    if (filterType === 'tous') return true
    return p.type_culture === filterType
  })

  // Gestion soumissions
  async function handleParcelleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const formData = new FormData(e.currentTarget)
    const res = await ajouterParcelle(formData)
    setLoading(false)
    if (res?.error) {
      setMessage({ type: 'error', text: res.error })
    } else {
      setMessage({ type: 'success', text: 'Parcelle enregistrée avec succès.' })
      setModalParcelle(false)
    }
  }

  async function handleRecolteSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const formData = new FormData(e.currentTarget)
    const res = await ajouterRecolte(formData)
    setLoading(false)
    if (res?.error) {
      setMessage({ type: 'error', text: res.error })
    } else {
      setMessage({ type: 'success', text: 'Récolte enregistrée avec succès.' })
      setModalRecolte(false)
    }
  }

  async function handleStockSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const formData = new FormData(e.currentTarget)
    const res = await ajusterStockVegetal(formData)
    setLoading(false)
    if (res?.error) {
      setMessage({ type: 'error', text: res.error })
    } else {
      setMessage({ type: 'success', text: 'Stock végétal mis à jour avec succès.' })
      setModalStock(false)
    }
  }

  async function handleVenteSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const formData = new FormData(e.currentTarget)
    const res = await ajouterVenteVegetale(formData)
    setLoading(false)
    if (res?.error) {
      setMessage({ type: 'error', text: res.error })
    } else {
      setMessage({ type: 'success', text: 'Vente enregistrée avec succès.' })
      setModalVente(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Sprout className="w-6 h-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-foreground">
              {dict.vegetal?.title || 'Volet Végétal & Cultures'}
            </h1>
          </div>
          <p className="mt-1.5 text-xs sm:text-sm text-foreground-muted">
            {dict.vegetal?.desc || 'Suivi des productions maraîchères, arboricoles et fourragères, stocks de récoltes et commercialisation.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setModalParcelle(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{dict.vegetal?.btn_nouvelle_parcelle || 'Nouvelle Parcelle'}</span>
          </button>
          <button
            type="button"
            onClick={() => setModalRecolte(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface border border-surface-border text-foreground text-xs font-semibold hover:bg-black/5 shadow-xs cursor-pointer transition-colors"
          >
            <Wheat className="w-4 h-4 text-amber-500" />
            <span>{dict.vegetal?.btn_enregistrer_recolte || 'Enregistrer Récolte'}</span>
          </button>
          <button
            type="button"
            onClick={() => setModalVente(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface border border-surface-border text-foreground text-xs font-semibold hover:bg-black/5 shadow-xs cursor-pointer transition-colors"
          >
            <Store className="w-4 h-4 text-emerald-500" />
            <span>{dict.vegetal?.btn_nouvelle_vente || 'Nouvelle Vente'}</span>
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm flex items-center justify-between ${
          message.type === 'success' 
            ? 'bg-success/10 border border-success/20 text-success' 
            : 'bg-danger/10 border border-danger/20 text-danger'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
          <button type="button" onClick={() => setMessage(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cartes KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface border border-surface-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground-muted">Surface Cultivée</span>
            <div className="p-2 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
              <Sprout className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-foreground">
            {totalSurfaceHa.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span className="text-sm font-normal text-foreground-muted">ha</span>
          </p>
          <p className="mt-1 text-[11px] text-foreground-muted">{parcelles.length} parcelles actives</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-surface-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground-muted">Récoltes Cumulées</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Wheat className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-foreground">
            {totalRecolteKg.toLocaleString('fr-FR')} <span className="text-sm font-normal text-foreground-muted">kg / bottes</span>
          </p>
          <p className="mt-1 text-[11px] text-foreground-muted">{recoltes.length} récoltes enregistrées</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-surface-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground-muted">Valeur Stocks Végétaux</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-foreground">
            {formatMontant(totalValeurStock, devise)}
          </p>
          <p className="mt-1 text-[11px] text-foreground-muted">{stocks.length} références en magasin</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-surface-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground-muted">Ventes Végétales</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-foreground">
            {formatMontant(totalVentesMontant, devise)}
          </p>
          <p className="mt-1 text-[11px] text-foreground-muted">{ventes.length} transactions enregistrées</p>
        </div>
      </div>

      {/* Onglets de navigation */}
      <div className="flex items-center gap-2 border-b border-surface-border overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setTab('parcelles')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
            tab === 'parcelles'
              ? 'border-primary text-primary'
              : 'border-transparent text-foreground-muted hover:text-foreground'
          }`}
        >
          <Sprout className="w-4 h-4" />
          <span>{dict.vegetal?.tab_parcelles || 'Cultures & Parcelles'} ({parcelles.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('recoltes')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
            tab === 'recoltes'
              ? 'border-primary text-primary'
              : 'border-transparent text-foreground-muted hover:text-foreground'
          }`}
        >
          <Wheat className="w-4 h-4" />
          <span>{dict.vegetal?.tab_recoltes || 'Récoltes & Rendements'} ({recoltes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('stocks')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
            tab === 'stocks'
              ? 'border-primary text-primary'
              : 'border-transparent text-foreground-muted hover:text-foreground'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>{dict.vegetal?.tab_stocks || 'Stocks & Magasins'} ({stocks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('ventes')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
            tab === 'ventes'
              ? 'border-primary text-primary'
              : 'border-transparent text-foreground-muted hover:text-foreground'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>{dict.vegetal?.tab_ventes || 'Ventes Végétales'} ({ventes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('fourrage')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
            tab === 'fourrage'
              ? 'border-primary text-primary'
              : 'border-transparent text-foreground-muted hover:text-foreground'
          }`}
        >
          <HeartHandshake className="w-4 h-4 text-emerald-500" />
          <span>{dict.vegetal?.tab_fourrage || 'Synergie Fourrage & Cheptel'}</span>
        </button>
      </div>

      {/* Onglet 1 : Parcelles & Cultures */}
      {tab === 'parcelles' && (
        <div className="space-y-6">
          {/* Filtres par filière végétale */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'tous', label: 'Toutes les cultures' },
                { id: 'maraichere', label: 'Maraîchage' },
                { id: 'fruitiere', label: 'Arboriculture Fruitière' },
                { id: 'fourragere', label: 'Cultures Fourragères' },
                { id: 'cerealiere', label: 'Grandes Cultures & Céréales' },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterType(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    filterType === f.id
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface border border-surface-border text-foreground-muted hover:text-foreground'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <span className="text-xs text-foreground-muted">
              {parcellesFiltrees.length} parcelle(s) affichée(s)
            </span>
          </div>

          {/* Grille des Parcelles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {parcellesFiltrees.map((p) => {
              const statutColors: Record<string, string> = {
                en_culture: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20',
                recolte_en_cours: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20',
                preparation: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20',
                jachere: 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/20',
                recoltee: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/20',
              }

              return (
                <div key={p.id} className="p-5 rounded-2xl bg-surface border border-surface-border shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                          {p.type_culture}
                        </span>
                        <h3 className="text-base font-bold text-foreground">{p.nom}</h3>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border capitalize ${statutColors[p.statut] || 'bg-surface-border text-foreground'}`}>
                        {p.statut.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-background border border-surface-border space-y-2 mb-4 text-xs">
                      <div className="flex justify-between">
                        <span className="text-foreground-muted">Culture & Variété :</span>
                        <span className="font-bold text-foreground">{p.culture_actuelle} • {p.variete || 'Non spécifiée'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground-muted">Superficie :</span>
                        <span className="font-bold text-foreground">{p.surface_ha} ha</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground-muted">Système d'irrigation :</span>
                        <span className="font-semibold text-foreground flex items-center gap-1">
                          <Droplet className="w-3 h-3 text-blue-500" />
                          {p.systeme_irrigation.replace('_', ' ')}
                        </span>
                      </div>
                      {p.rendement_estime > 0 && (
                        <div className="flex justify-between">
                          <span className="text-foreground-muted">Rendement estimé :</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{p.rendement_estime.toLocaleString('fr-FR')} kg</span>
                        </div>
                      )}
                    </div>

                    {p.notes && (
                      <p className="text-xs text-foreground-muted italic line-clamp-2 mb-3">
                        « {p.notes} »
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-surface-border flex items-center justify-between text-[11px] text-foreground-muted">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Semis: {p.date_semis || '—'}
                    </span>
                    <span className="font-medium text-foreground">
                      Récolte: {p.date_recolte_prevue || 'En cours'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Onglet 2 : Récoltes & Rendements */}
      {tab === 'recoltes' && (
        <div className="space-y-4 bg-surface rounded-2xl p-6 border border-surface-border shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-surface-border">
            <div>
              <h2 className="text-base font-bold text-foreground">Historique des Récoltes & Coupes</h2>
              <p className="text-xs text-foreground-muted">Productions enregistrées et destinations des récoltes</p>
            </div>
            <button
              type="button"
              onClick={() => setModalRecolte(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold cursor-pointer hover:bg-primary-hover"
            >
              <Plus className="w-4 h-4" />
              <span>Enregistrer</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-surface-border text-foreground-muted text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3 text-start">Date</th>
                  <th className="py-2.5 px-3 text-start">Culture & Variété</th>
                  <th className="py-2.5 px-3 text-start">Quantité</th>
                  <th className="py-2.5 px-3 text-start">Qualité</th>
                  <th className="py-2.5 px-3 text-start">Destination</th>
                  <th className="py-2.5 px-3 text-start">Coût Récolte</th>
                  <th className="py-2.5 px-3 text-start">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {recoltes.map((r) => (
                  <tr key={r.id} className="hover:bg-black/5 transition-colors">
                    <td className="py-3 px-3 font-semibold text-foreground whitespace-nowrap">{r.date_recolte}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-foreground">{r.culture}</span>
                      {r.variete && <span className="text-foreground-muted block text-[11px]">{r.variete}</span>}
                    </td>
                    <td className="py-3 px-3 font-black text-foreground">
                      {Number(r.quantite).toLocaleString('fr-FR')} {r.unite}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-surface-border text-foreground font-medium capitalize">
                        {r.qualite?.replace('_', ' ') || 'Premier choix'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.destination === 'autoconsommation_fourrage'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                          : r.destination === 'vente_directe'
                          ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {r.destination === 'autoconsommation_fourrage' ? 'Fourrage Cheptel' : r.destination?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-foreground-muted">
                      {r.cout_recolte > 0 ? formatMontant(r.cout_recolte, devise) : '—'}
                    </td>
                    <td className="py-3 px-3 text-foreground-muted max-w-xs truncate">
                      {r.observations || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Onglet 3 : Stocks Végétaux */}
      {tab === 'stocks' && (
        <div className="space-y-4 bg-surface rounded-2xl p-6 border border-surface-border shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-surface-border">
            <div>
              <h2 className="text-base font-bold text-foreground">Stocks de Récoltes, Semences & Fourrages</h2>
              <p className="text-xs text-foreground-muted">Suivi des quantités en entrepôt et valorisation</p>
            </div>
            <button
              type="button"
              onClick={() => setModalStock(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold cursor-pointer hover:bg-primary-hover"
            >
              <Plus className="w-4 h-4" />
              <span>Ajuster / Ajouter Stock</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stocks.map((s) => {
              const estBas = Number(s.quantite_disponible) <= Number(s.seuil_alerte)
              return (
                <div key={s.id} className="p-4 rounded-xl border border-surface-border bg-background shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary truncate">
                        {s.type_element?.replace('_', ' ')}
                      </span>
                      {estBas && (
                        <span className="px-1.5 py-0.5 rounded bg-danger/15 text-danger text-[9px] font-bold">
                          Stock Bas
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-foreground">{s.nom_produit}</h4>
                    {s.variete && <p className="text-xs text-foreground-muted mt-0.5">Variété : {s.variete}</p>}
                    <p className="mt-3 text-2xl font-black text-foreground">
                      {Number(s.quantite_disponible).toLocaleString('fr-FR')} <span className="text-xs font-normal text-foreground-muted">{s.unite}</span>
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-surface-border space-y-1 text-xs">
                    <div className="flex justify-between text-foreground-muted">
                      <span>Lieu de stockage :</span>
                      <span className="font-medium text-foreground">{s.lieu_stockage || 'Magasin'}</span>
                    </div>
                    {s.prix_unitaire_estime > 0 && (
                      <div className="flex justify-between text-foreground-muted">
                        <span>Valeur unitaire :</span>
                        <span className="font-semibold text-foreground">{formatMontant(s.prix_unitaire_estime, devise)} / {s.unite}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Onglet 4 : Ventes Végétales */}
      {tab === 'ventes' && (
        <div className="space-y-4 bg-surface rounded-2xl p-6 border border-surface-border shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-surface-border">
            <div>
              <h2 className="text-base font-bold text-foreground">Journal des Ventes de Produits Végétaux</h2>
              <p className="text-xs text-foreground-muted">Commandes, facturation et paiements clients</p>
            </div>
            <button
              type="button"
              onClick={() => setModalVente(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold cursor-pointer hover:bg-primary-hover"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle Vente</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-surface-border text-foreground-muted text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3 text-start">Date</th>
                  <th className="py-2.5 px-3 text-start">Client</th>
                  <th className="py-2.5 px-3 text-start">Produit Vendu</th>
                  <th className="py-2.5 px-3 text-start">Quantité</th>
                  <th className="py-2.5 px-3 text-start">Prix Unitaire</th>
                  <th className="py-2.5 px-3 text-start">Total</th>
                  <th className="py-2.5 px-3 text-start">Mode / Statut</th>
                  <th className="py-2.5 px-3 text-start">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {ventes.map((v) => (
                  <tr key={v.id} className="hover:bg-black/5 transition-colors">
                    <td className="py-3 px-3 font-semibold text-foreground whitespace-nowrap">{v.date_vente}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-foreground">{v.client_nom}</span>
                      {v.client_contact && <span className="text-foreground-muted block text-[11px]">{v.client_contact}</span>}
                    </td>
                    <td className="py-3 px-3 font-medium text-foreground">{v.culture} {v.variete ? `(${v.variete})` : ''}</td>
                    <td className="py-3 px-3 font-semibold text-foreground">
                      {Number(v.quantite).toLocaleString('fr-FR')} {v.unite}
                    </td>
                    <td className="py-3 px-3 text-foreground-muted">
                      {formatMontant(v.prix_unitaire, devise)}
                    </td>
                    <td className="py-3 px-3 font-black text-emerald-600 dark:text-emerald-400">
                      {formatMontant(v.montant_total, devise)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary capitalize">
                        {v.moyen_paiement}
                      </span>
                      <span className={`ms-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        v.statut_paiement === 'regle'
                          ? 'bg-success/15 text-success'
                          : 'bg-warning/15 text-warning'
                      }`}>
                        {v.statut_paiement}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-foreground-muted max-w-xs truncate">
                      {v.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Onglet 5 : Synergie Fourrage & Cheptel */}
      {tab === 'fourrage' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary/10 via-surface to-background p-6 sm:p-8 rounded-3xl border border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-primary text-white shadow-xs">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-heading text-foreground">Synergie Agro-Pastorale Intégrée</h2>
                <p className="text-xs sm:text-sm text-foreground-muted">Comment la production végétale et l'élevage s'auto-alimentent au quotidien</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="p-5 rounded-2xl bg-surface border border-surface-border">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Wheat className="w-4 h-4 text-emerald-500" />
                  Fourrage Végétal ➔ Alimentation Cheptel
                </h3>
                <p className="mt-2 text-xs text-foreground-muted leading-relaxed">
                  Les parcelles fourragères (luzerne, maralfalfa, sorgho, ensilage maïs) sont récoltées et injectées directement 
                  pour l'alimentation des vaches laitières et des reproducteurs. Réduction massive des dépenses en aliments industriels.
                </p>
                <div className="mt-4 p-3 rounded-xl bg-background border border-surface-border text-xs flex justify-between items-center">
                  <span className="text-foreground-muted">Bottes de luzerne distribuées :</span>
                  <span className="font-bold text-primary">150 bottes ce mois</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-surface border border-surface-border">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-primary" />
                  Effluents Cheptel ➔ Fertilisation Maraîchère
                </h3>
                <p className="mt-2 text-xs text-foreground-muted leading-relaxed">
                  Le fumier de volaille et les litières bovines compostées enrichissent naturellement le sol sablo-argileux 
                  des parcelles maraîchères (tomate, oignon, piment), augmentant les rendements sans surcoût d'engrais chimiques.
                </p>
                <div className="mt-4 p-3 rounded-xl bg-background border border-surface-border text-xs flex justify-between items-center">
                  <span className="text-foreground-muted">Compost épandu :</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">12 tonnes fertilisées</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL : NOUVELLE PARCELLE */}
      {modalParcelle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <div className="bg-surface border border-surface-border rounded-2xl max-w-lg w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Sprout className="w-5 h-5 text-primary" />
                Nouvelle Parcelle / Culture
              </h3>
              <button type="button" onClick={() => setModalParcelle(false)} className="text-foreground-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleParcelleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Nom de la Parcelle *</label>
                <input
                  type="text"
                  name="nom"
                  required
                  placeholder="Ex: Parcelle Maraîchère Est B1"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Type de Culture</label>
                  <select name="type_culture" className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background">
                    <option value="maraichere">Maraîchère</option>
                    <option value="fruitiere">Fruitière / Verger</option>
                    <option value="fourragere">Fourragère (Luzerne, etc.)</option>
                    <option value="cerealiere">Céréalière & Grains</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Superficie (ha) *</label>
                  <input
                    type="number"
                    name="surface_ha"
                    step="0.01"
                    defaultValue="1.0"
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Culture Actuelle *</label>
                  <input
                    type="text"
                    name="culture_actuelle"
                    required
                    placeholder="Ex: Tomate, Oignon, Luzerne"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Variété</label>
                  <input
                    type="text"
                    name="variete"
                    placeholder="Ex: Roma VF, Violet de Galmi"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Système d'Irrigation</label>
                  <select name="systeme_irrigation" className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background">
                    <option value="goutte_a_goutte">Goutte-à-goutte</option>
                    <option value="aspersion">Aspersion</option>
                    <option value="gravitaire">Gravitaire</option>
                    <option value="pluvial">Pluvial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Statut</label>
                  <select name="statut" className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background">
                    <option value="en_culture">En culture</option>
                    <option value="preparation">En préparation</option>
                    <option value="recolte_en_cours">Récolte en cours</option>
                    <option value="jachere">En jachère</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Date de Semis</label>
                  <input
                    type="date"
                    name="date_semis"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Date Récolte Prévue</label>
                  <input
                    type="date"
                    name="date_recolte_prevue"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Rendement Prévu (kg)</label>
                <input
                  type="number"
                  name="rendement_estime"
                  placeholder="Ex: 25000"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Notes & Observations</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Détails du sol, fertilisation, observations..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background"
                />
              </div>

              <div className="pt-3 border-t border-surface-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalParcelle(false)}
                  className="px-4 py-2 rounded-xl border border-surface-border text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover disabled:opacity-50"
                >
                  {loading ? 'Enregistrement...' : 'Créer la parcelle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL : ENREGISTRER UNE RÉCOLTE */}
      {modalRecolte && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <div className="bg-surface border border-surface-border rounded-2xl max-w-lg w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Wheat className="w-5 h-5 text-amber-500" />
                Enregistrer une Récolte
              </h3>
              <button type="button" onClick={() => setModalRecolte(false)} className="text-foreground-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecolteSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Parcelle d'Origine</label>
                <select name="parcelle_id" className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background">
                  <option value="">Sélectionner une parcelle</option>
                  {parcelles.map(p => (
                    <option key={p.id} value={p.id}>{p.nom} ({p.culture_actuelle})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Culture Récoltée *</label>
                  <input
                    type="text"
                    name="culture"
                    required
                    placeholder="Ex: Tomate, Oignon, Luzerne"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Variété</label>
                  <input
                    type="text"
                    name="variete"
                    placeholder="Ex: Roma VF"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Quantité *</label>
                  <input
                    type="number"
                    name="quantite"
                    step="0.1"
                    required
                    placeholder="Ex: 1200"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Unité</label>
                  <select name="unite" className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background">
                    <option value="kg">kg</option>
                    <option value="tonnes">tonnes</option>
                    <option value="bottes">bottes</option>
                    <option value="sacs">sacs</option>
                    <option value="cagettes">cagettes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Qualité</label>
                  <select name="qualite" className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background">
                    <option value="premier_choix">1er Choix</option>
                    <option value="deuxieme_choix">2ème Choix</option>
                    <option value="standard">Standard</option>
                    <option value="rebut">Rebut / Tri</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Destination *</label>
                  <select name="destination" className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background">
                    <option value="stock">Mise en Stock Magasin</option>
                    <option value="vente_directe">Vente Directe Bord Champ</option>
                    <option value="autoconsommation_fourrage">Fourrage pour le Cheptel</option>
                    <option value="perte">Perte / Rebut</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Date de Récolte</label>
                  <input
                    type="date"
                    name="date_recolte"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Coût de la Main-d'Œuvre Récolte</label>
                <input
                  type="number"
                  name="cout_recolte"
                  placeholder="0"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Observations</label>
                <textarea
                  name="observations"
                  rows={2}
                  placeholder="Tri, calibre, météo..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background"
                />
              </div>

              <div className="pt-3 border-t border-surface-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalRecolte(false)}
                  className="px-4 py-2 rounded-xl border border-surface-border text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover disabled:opacity-50"
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer la récolte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL : AJUSTER STOCK */}
      {modalStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <div className="bg-surface border border-surface-border rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Boxes className="w-5 h-5 text-blue-500" />
                Ajuster ou Ajouter un Stock Végétal
              </h3>
              <button type="button" onClick={() => setModalStock(false)} className="text-foreground-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStockSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Désignation du Produit / Stock *</label>
                <input
                  type="text"
                  name="nom_produit"
                  required
                  placeholder="Ex: Tomates en cagettes, Bottes de luzerne..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Type d'Élément</label>
                  <select name="type_element" className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background">
                    <option value="produit_recolte">Produit Récolté</option>
                    <option value="fourrage_stocke">Fourrage pour Animaux</option>
                    <option value="semence">Semences & Plants</option>
                    <option value="fertilisant_organique">Compost / Engrais Vert</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Variété</label>
                  <input
                    type="text"
                    name="variete"
                    placeholder="Ex: Roma VF"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Quantité *</label>
                  <input
                    type="number"
                    name="quantite_disponible"
                    step="0.1"
                    required
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Unité</label>
                  <select name="unite" className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background">
                    <option value="kg">kg</option>
                    <option value="bottes">bottes</option>
                    <option value="sacs">sacs</option>
                    <option value="tonnes">tonnes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Seuil Alerte</label>
                  <input
                    type="number"
                    name="seuil_alerte"
                    defaultValue="10"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Lieu de Stockage</label>
                  <input
                    type="text"
                    name="lieu_stockage"
                    placeholder="Hangar, Chambre froide..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Prix Unitaire Estimé ({devise})</label>
                  <input
                    type="number"
                    name="prix_unitaire_estime"
                    placeholder="Ex: 500"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-surface-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalStock(false)}
                  className="px-4 py-2 rounded-xl border border-surface-border text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover disabled:opacity-50"
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL : NOUVELLE VENTE */}
      {modalVente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <div className="bg-surface border border-surface-border rounded-2xl max-w-lg w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Store className="w-5 h-5 text-emerald-500" />
                Nouvelle Vente de Produits Végétaux
              </h3>
              <button type="button" onClick={() => setModalVente(false)} className="text-foreground-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVenteSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Nom du Client *</label>
                  <input
                    type="text"
                    name="client_nom"
                    required
                    placeholder="Ex: Grossiste Marché Castors"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Contact Téléphone</label>
                  <input
                    type="tel"
                    name="client_contact"
                    placeholder="+221 77 000 00 00"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Prélever sur un Stock (Optionnel)</label>
                <select name="stock_vegetal_id" className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background">
                  <option value="">Sélection libre (hors stock répertorié)</option>
                  {stocks.map(s => (
                    <option key={s.id} value={s.id}>{s.nom_produit} ({s.quantite_disponible} {s.unite} dispo)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Culture Vendue *</label>
                  <input
                    type="text"
                    name="culture"
                    required
                    placeholder="Ex: Tomate, Oignon, Mangue"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Variété</label>
                  <input
                    type="text"
                    name="variete"
                    placeholder="Ex: Roma VF"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Quantité *</label>
                  <input
                    type="number"
                    name="quantite"
                    step="0.1"
                    required
                    placeholder="Ex: 500"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Unité</label>
                  <select name="unite" className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background">
                    <option value="kg">kg</option>
                    <option value="bottes">bottes</option>
                    <option value="sacs">sacs</option>
                    <option value="tonnes">tonnes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Prix Unitaire *</label>
                  <input
                    type="number"
                    name="prix_unitaire"
                    required
                    placeholder="Ex: 500"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Moyen de Paiement</label>
                  <select name="moyen_paiement" className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background">
                    <option value="especes">Espèces</option>
                    <option value="wave">Wave</option>
                    <option value="orange_money">Orange Money</option>
                    <option value="virement">Virement bancaire</option>
                    <option value="cheque">Chèque</option>
                    <option value="credit">À crédit (différé)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Statut Paiement</label>
                  <select name="statut_paiement" className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background">
                    <option value="regle">Totalement réglé</option>
                    <option value="partiel">Paiement partiel / Acompte</option>
                    <option value="en_attente">En attente de règlement</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Montant Réglé (si partiel)</label>
                <input
                  type="number"
                  name="montant_regle"
                  placeholder="Laisser vide si réglé en totalité"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Notes & Modalités de livraison</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="N° Bon de livraison, lieu de déchargement..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-background"
                />
              </div>

              <div className="pt-3 border-t border-surface-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalVente(false)}
                  className="px-4 py-2 rounded-xl border border-surface-border text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover disabled:opacity-50"
                >
                  {loading ? 'Enregistrement...' : 'Valider la vente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
