import { createClient } from '@/utils/supabase/server'
import { getTenantContext } from '@/utils/supabase/tenant'
import { Activity, Egg, Milk, Scale, AlertTriangle, Sparkles } from 'lucide-react'
import CreerSuiviModal from './CreerSuiviModal'
import { DEMO_SUIVIS, DEMO_BANDES, DEMO_ANIMAUX, DEMO_INTRANTS } from '@/lib/demo-data'

import { getLocale, getDictionary } from '@/dictionaries'

export default async function SuiviPage() {
  const tenant = await getTenantContext()
  const supabase = await createClient()
  const locale = await getLocale()
  const dict = await getDictionary(locale)
  const tSuivi = dict.elevage?.suivi_page || {}

  const [
    { data: suivis },
    { data: bandes },
    { data: animaux },
    { data: aliments }
  ] = await Promise.all([
    supabase
      .from('suivi_quotidien')
      .select('*, bandes(code_bande), animaux(numero_boucle), intrants(nom, unite)')
      .order('date_suivi', { ascending: false })
      .limit(50),
    supabase.from('bandes').select('id, code_bande, effectif_actuel').eq('statut', 'en_cours'),
    supabase.from('animaux').select('id, numero_boucle, nom_ou_surnom').in('etat_sante', ['sain', 'en_soins', 'en_latence']),
    supabase.from('intrants').select('id, nom, unite').eq('categorie', 'aliment')
  ])

  const isDemo = !suivis || suivis.length === 0
  const displaySuivis = isDemo ? (DEMO_SUIVIS as any[]) : suivis
  const displayBandes = (bandes && bandes.length > 0) ? bandes : DEMO_BANDES
  const displayAnimaux = (animaux && animaux.length > 0) ? animaux : DEMO_ANIMAUX
  const displayAliments = (aliments && aliments.length > 0) ? aliments : DEMO_INTRANTS.filter(i => i.categorie === 'aliment')

  // Cumuls rapides
  const totalMortalites = displaySuivis?.reduce((acc, s) => acc + (s.mortalites || 0), 0) || 0
  const totalAlimentKg = displaySuivis?.reduce((acc, s) => acc + (Number(s.aliment_quantite_kg) || 0), 0) || 0
  const totalOeufs = displaySuivis?.reduce((acc, s) => acc + (s.oeufs_recoltes || 0), 0) || 0
  const totalLait = displaySuivis?.reduce((acc, s) => acc + (Number(s.lait_recolte_litres) || 0), 0) || 0

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">
            {tSuivi.title || 'Suivi Quotidien de Production'}
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            {tSuivi.subtitle || "Enregistrement des mortalités, pesées, rations d'aliment, récoltes d'œufs et de lait."}
          </p>
        </div>
        <CreerSuiviModal
          bandes={displayBandes}
          animaux={displayAnimaux}
          aliments={displayAliments}
        />
      </div>

      {isDemo && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>Données de démonstration : suivi quotidien réel (ponte avicole, lactation bovine, consommations).</span>
        </div>
      )}

      {/* Cartes récapitulatives */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface border border-surface-border">
          <p className="text-xs font-semibold text-danger uppercase tracking-wider">Pertes Enregistrées</p>
          <p className="text-2xl font-bold font-heading text-danger mt-1">{totalMortalites} sujets</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-surface-border">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider">Aliment Consommé</p>
          <p className="text-2xl font-bold font-heading text-primary mt-1">{totalAlimentKg.toLocaleString('fr-FR')} kg</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-surface-border">
          <p className="text-xs font-semibold text-warning uppercase tracking-wider">Œufs Récoltés</p>
          <p className="text-2xl font-bold font-heading text-warning mt-1">{totalOeufs.toLocaleString('fr-FR')}</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-surface-border">
          <p className="text-xs font-semibold text-info uppercase tracking-wider">Lait Trait</p>
          <p className="text-2xl font-bold font-heading text-info mt-1">{totalLait.toLocaleString('fr-FR')} L</p>
        </div>
      </div>

      {/* Table des relevés */}
      <div className="rounded-2xl bg-surface border border-surface-border overflow-hidden shadow-sm">
        <div className="p-5 border-b border-surface-border flex items-center justify-between">
          <h3 className="font-bold font-heading text-foreground">Derniers Relevés Journaliers</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-background border-b border-surface-border text-xs uppercase text-foreground-muted">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Bande / Boucle</th>
                <th className="py-3 px-4">Mortalités</th>
                <th className="py-3 px-4">Aliment Consommé</th>
                <th className="py-3 px-4">Pesée (kg)</th>
                <th className="py-3 px-4">Œufs / Lait</th>
                <th className="py-3 px-4">Observations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {suivis && suivis.length > 0 ? (
                suivis.map((s) => (
                  <tr key={s.id} className="hover:bg-black/5">
                    <td className="py-3 px-4 font-medium">{s.date_suivi}</td>
                    <td className="py-3 px-4 font-semibold text-primary">
                      {s.bandes?.code_bande || s.animaux?.numero_boucle || 'Général'}
                    </td>
                    <td className="py-3 px-4">
                      {s.mortalites > 0 ? (
                        <span className="font-bold text-danger">
                          +{s.mortalites} {s.cause_mortalite ? `(${s.cause_mortalite})` : ''}
                        </span>
                      ) : (
                        <span className="text-foreground-muted">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {s.aliment_quantite_kg > 0 ? (
                        <span>
                          {s.aliment_quantite_kg} kg {s.intrants?.nom ? `(${s.intrants.nom})` : ''}
                        </span>
                      ) : (
                        <span className="text-foreground-muted">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      {s.poids_moyen_mesure_kg ? `${s.poids_moyen_mesure_kg} kg` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {s.oeufs_recoltes > 0 && <span className="mr-2">🥚 {s.oeufs_recoltes}</span>}
                      {s.lait_recolte_litres > 0 && <span>🥛 {s.lait_recolte_litres} L</span>}
                      {!s.oeufs_recoltes && !s.lait_recolte_litres && <span className="text-foreground-muted">-</span>}
                    </td>
                    <td className="py-3 px-4 text-xs text-foreground-muted max-w-xs truncate">
                      {s.observations || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-foreground-muted">
                    Aucun relevé quotidien enregistré pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
