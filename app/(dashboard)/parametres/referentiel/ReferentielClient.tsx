'use client'

import { useState } from 'react'
import { 
  Beef, 
  Dna, 
  Sprout, 
  Boxes, 
  Plus, 
  Trash2, 
  X, 
  CheckCircle2, 
  Sparkles,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { 
  ajouterEspece, 
  ajouterRace, 
  ajouterSpeculation, 
  ajouterCategorieIntrant,
  supprimerElementReferentiel
} from './actions'

type TabType = 'especes' | 'races' | 'speculations' | 'categories'

export default function ReferentielClient({
  initialEspeces,
  initialRaces,
  initialSpeculations,
  initialCategories,
  entrepriseId
}: {
  initialEspeces: any[]
  initialRaces: any[]
  initialSpeculations: any[]
  initialCategories: any[]
  entrepriseId: string
}) {
  const [activeTab, setActiveTab] = useState<TabType>('especes')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Espèce form state
  const [selectedEspeceForRace, setSelectedEspeceForRace] = useState(initialEspeces[0]?.code || '')

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)
    let res: any

    if (activeTab === 'especes') {
      res = await ajouterEspece(formData)
    } else if (activeTab === 'races') {
      res = await ajouterRace(formData)
    } else if (activeTab === 'speculations') {
      res = await ajouterSpeculation(formData)
    } else if (activeTab === 'categories') {
      res = await ajouterCategorieIntrant(formData)
    }

    setLoading(false)
    if (res?.error) {
      setError(res.error)
    } else {
      setSuccess('Élément ajouté avec succès au catalogue !')
      setModalOpen(false)
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  async function handleDelete(table: any, id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément personnalisé ?')) return
    setLoading(true)
    const res = await supprimerElementReferentiel(table, id)
    setLoading(false)
    if (res?.error) {
      setError(res.error)
    } else {
      setSuccess('Supprimé avec succès')
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header avec bouton retour */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/parametres"
            className="p-2.5 rounded-xl bg-surface border border-surface-border text-foreground hover:border-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-heading text-foreground">
              Référentiels & Catalogues d'Exploitation
            </h1>
            <p className="text-xs text-foreground-muted mt-0.5">
              Personnalisez vos espèces d'élevage, races, spéculations végétales et catégories d'intrants.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setError(null)
            setModalOpen(true)
          }}
          className="px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          {activeTab === 'especes' && 'Ajouter une Espèce'}
          {activeTab === 'races' && 'Ajouter une Race'}
          {activeTab === 'speculations' && 'Ajouter une Spéculation'}
          {activeTab === 'categories' && 'Ajouter une Catégorie'}
        </button>
      </div>

      {success && (
        <div className="p-3 rounded-xl bg-success/10 border border-success/20 text-success text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {success}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Navigation par Onglets */}
      <div className="flex flex-wrap gap-2 border-b border-surface-border pb-4">
        <button
          onClick={() => setActiveTab('especes')}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'especes'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-surface text-foreground-muted hover:text-foreground border border-surface-border'
          }`}
        >
          <Beef className="w-4 h-4" />
          <span>Espèces d'élevage ({initialEspeces.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('races')}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'races'
              ? 'bg-secondary text-white shadow-sm'
              : 'bg-surface text-foreground-muted hover:text-foreground border border-surface-border'
          }`}
        >
          <Dna className="w-4 h-4" />
          <span>Races & Souches ({initialRaces.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('speculations')}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'speculations'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-surface text-foreground-muted hover:text-foreground border border-surface-border'
          }`}
        >
          <Sprout className="w-4 h-4" />
          <span>Spéculations Végétales ({initialSpeculations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'categories'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-surface text-foreground-muted hover:text-foreground border border-surface-border'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Catégories d'Intrants ({initialCategories.length})</span>
        </button>
      </div>

      {/* Contenu de l'onglet actif */}
      <div className="bg-surface rounded-2xl border border-surface-border overflow-hidden shadow-sm">
        {/* ONGLET 1 : ESPÈCES */}
        {activeTab === 'especes' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-background border-b border-surface-border text-xs uppercase text-foreground-muted">
                <tr>
                  <th className="py-3 px-4">Nom de l'Espèce</th>
                  <th className="py-3 px-4">Catégorie</th>
                  <th className="py-3 px-4">Mode de Suivi</th>
                  <th className="py-3 px-4">Unité d'Effectif</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {initialEspeces.map((esp) => {
                  const isCustom = esp.entreprise_id === entrepriseId
                  return (
                    <tr key={esp.id || esp.code} className="hover:bg-surface-border/20">
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        {esp.nom}
                      </td>
                      <td className="py-3.5 px-4 text-xs capitalize text-foreground-muted">
                        {esp.categorie?.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <span className="px-2 py-0.5 rounded-full bg-surface-border/50 text-foreground font-medium">
                          {esp.mode_suivi === 'bande' ? 'En bandes / lots' : esp.mode_suivi === 'individuel' ? 'Individuel par boucle' : 'Mixte'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-foreground-muted">
                        {esp.unite_effectif || 'sujets'}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {isCustom ? (
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                            Personnalisée
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-surface-border/40 text-foreground-muted font-medium">
                            Standard
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isCustom && (
                          <button
                            onClick={() => handleDelete('especes_elevage', esp.id)}
                            className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ONGLET 2 : RACES */}
        {activeTab === 'races' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-background border-b border-surface-border text-xs uppercase text-foreground-muted">
                <tr>
                  <th className="py-3 px-4">Race / Souche</th>
                  <th className="py-3 px-4">Espèce Rattachée</th>
                  <th className="py-3 px-4">Description / Aptitude</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {initialRaces.map((r) => {
                  const isCustom = r.entreprise_id === entrepriseId
                  return (
                    <tr key={r.id} className="hover:bg-surface-border/20">
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        {r.nom}
                      </td>
                      <td className="py-3.5 px-4 text-xs capitalize text-secondary font-semibold">
                        {r.espece_code ? r.espece_code.replace(/_/g, ' ') : 'Multi-espèces'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-foreground-muted max-w-md">
                        {r.description || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {isCustom ? (
                          <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-bold">
                            Personnalisée
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-surface-border/40 text-foreground-muted font-medium">
                            Référence Sahel
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isCustom && (
                          <button
                            onClick={() => handleDelete('races_elevage', r.id)}
                            className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ONGLET 3 : SPÉCULATIONS VÉGÉTALES */}
        {activeTab === 'speculations' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-background border-b border-surface-border text-xs uppercase text-foreground-muted">
                <tr>
                  <th className="py-3 px-4">Spéculation (Culture)</th>
                  <th className="py-3 px-4">Type de Culture</th>
                  <th className="py-3 px-4">Variété Recommandée</th>
                  <th className="py-3 px-4">Rendement Moyen (t/ha)</th>
                  <th className="py-3 px-4">Cycle (Jours)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {initialSpeculations.map((sp) => {
                  const isCustom = sp.entreprise_id === entrepriseId
                  return (
                    <tr key={sp.id} className="hover:bg-surface-border/20">
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        {sp.nom}
                      </td>
                      <td className="py-3.5 px-4 text-xs capitalize text-emerald-600 font-semibold">
                        {sp.type_culture}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-foreground">
                        {sp.variete_defaut || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-foreground">
                        {sp.rendement_estime_ha ? `${sp.rendement_estime_ha} t/ha` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-foreground-muted">
                        {sp.cycle_jours ? `${sp.cycle_jours} jours` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isCustom && (
                          <button
                            onClick={() => handleDelete('speculations_vegetales', sp.id)}
                            className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ONGLET 4 : CATÉGORIES D'INTRANTS */}
        {activeTab === 'categories' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-background border-b border-surface-border text-xs uppercase text-foreground-muted">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Nom de la Catégorie</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {initialCategories.map((c) => {
                  const isCustom = c.entreprise_id === entrepriseId
                  return (
                    <tr key={c.id} className="hover:bg-surface-border/20">
                      <td className="py-3.5 px-4 font-mono text-xs text-foreground-muted">
                        {c.code}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        {c.nom}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-foreground-muted max-w-md">
                        {c.description || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {isCustom ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 font-bold">
                            Personnalisée
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-surface-border/40 text-foreground-muted font-medium">
                            Standard
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isCustom && (
                          <button
                            onClick={() => handleDelete('categories_intrants', c.id)}
                            className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL D'AJOUT RAPIDE */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-surface-border rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-foreground-muted hover:text-foreground rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-heading text-foreground mb-4">
              {activeTab === 'especes' && 'Nouvelle Espèce d\'Élevage'}
              {activeTab === 'races' && 'Nouvelle Race d\'Animal'}
              {activeTab === 'speculations' && 'Nouvelle Spéculation Végétale'}
              {activeTab === 'categories' && 'Nouvelle Catégorie d\'Intrants'}
            </h3>

            <form onSubmit={handleAdd} className="space-y-4">
              {/* Formulaire Espèce */}
              {activeTab === 'especes' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Nom de l'Espèce *</label>
                    <input
                      type="text"
                      name="nom"
                      required
                      placeholder="ex: Caprins Maradi, Cuniculture (Lapins)..."
                      className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Catégorie *</label>
                      <select
                        name="categorie"
                        required
                        className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="bovin">Bovin</option>
                        <option value="petit_ruminant">Ovin / Caprin</option>
                        <option value="avicole">Avicole</option>
                        <option value="porcin">Porcin</option>
                        <option value="autre">Autre (Cunicole, Piscicole...)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Mode de Suivi *</label>
                      <select
                        name="mode_suivi"
                        required
                        className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="individuel">Individuel (Boucle)</option>
                        <option value="bande">Par Bande / Cohorte</option>
                        <option value="mixte">Mixte</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Unité d'Effectif</label>
                    <input
                      type="text"
                      name="unite_effectif"
                      defaultValue="têtes"
                      placeholder="têtes, sujets, paires..."
                      className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </>
              )}

              {/* Formulaire Race */}
              {activeTab === 'races' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Nom de la Race *</label>
                    <input
                      type="text"
                      name="nom"
                      required
                      placeholder="ex: Touabire, Sahel, Holstein..."
                      className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Espèce Rattachée</label>
                    <select
                      name="espece_code"
                      value={selectedEspeceForRace}
                      onChange={(e) => setSelectedEspeceForRace(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    >
                      <option value="">Toutes / Générique</option>
                      {initialEspeces.map((esp) => (
                        <option key={esp.code} value={esp.code}>
                          {esp.nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Description / Aptitude</label>
                    <textarea
                      name="description"
                      rows={2}
                      placeholder="ex: Forte résistance à la chaleur, aptitudes laitières élevées..."
                      className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    />
                  </div>
                </>
              )}

              {/* Formulaire Spéculation Végétale */}
              {activeTab === 'speculations' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Nom de la Culture / Spéculation *</label>
                    <input
                      type="text"
                      name="nom"
                      required
                      placeholder="ex: Oignon, Piment, Aubergine, Luzerne..."
                      className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Type de Culture *</label>
                      <select
                        name="type_culture"
                        required
                        className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="maraichere">Maraîchère</option>
                        <option value="fruitiere">Fruitière</option>
                        <option value="fourragere">Fourragère (Bétail)</option>
                        <option value="cerealiere">Céréalière</option>
                        <option value="legumineuse">Légumineuse</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Variété par défaut</label>
                      <input
                        type="text"
                        name="variete_defaut"
                        placeholder="ex: Violet de Galmi..."
                        className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Rendement estimé (t/ha)</label>
                      <input
                        type="number"
                        step="0.1"
                        name="rendement_estime_ha"
                        placeholder="ex: 25.0"
                        className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Cycle cultural (Jours)</label>
                      <input
                        type="number"
                        name="cycle_jours"
                        placeholder="ex: 90"
                        className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Formulaire Catégorie Intrants */}
              {activeTab === 'categories' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Nom de la Catégorie *</label>
                    <input
                      type="text"
                      name="nom"
                      required
                      placeholder="ex: Engrais Foliolaires, Rejets & Semences..."
                      className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Description</label>
                    <textarea
                      name="description"
                      rows={2}
                      placeholder="Description des intrants classés dans cette catégorie..."
                      className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-background focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm text-foreground-muted hover:text-foreground font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
                >
                  {loading ? 'Enregistrement...' : 'Ajouter au Référentiel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
