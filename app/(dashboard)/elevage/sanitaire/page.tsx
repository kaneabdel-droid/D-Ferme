import { createClient } from '@/utils/supabase/server'
import { getTenantContext } from '@/utils/supabase/tenant'
import { ShieldAlert, AlertTriangle, CheckCircle2, Plus, Calendar, Clock, Sparkles } from 'lucide-react'
import { DEMO_TRAITEMENTS } from '@/lib/demo-data'

import { getLocale, getDictionary } from '@/dictionaries'

export default async function SanitairePage() {
  const tenant = await getTenantContext()
  const supabase = await createClient()
  const locale = await getLocale()
  const dict = await getDictionary(locale)
  const tSanitaire = dict.elevage?.sanitaire_page || {}

  const todayStr = new Date().toISOString().split('T')[0]

  const [
    { data: traitements },
    { data: bandes },
    { data: intrants }
  ] = await Promise.all([
    supabase
      .from('traitements_medicaux')
      .select('*, bandes(code_bande), animaux(numero_boucle), intrants(nom, unite, categorie)')
      .order('date_administration', { ascending: false }),
    supabase.from('bandes').select('id, code_bande').eq('statut', 'en_cours'),
    supabase.from('intrants').select('id, nom, latence_jours_defaut, unite').in('categorie', ['medicament', 'vaccin'])
  ])

  const isDemo = !traitements || traitements.length === 0
  const displayTraitements = isDemo ? (DEMO_TRAITEMENTS as any[]) : traitements

  // Séparer les traitements avec latence en cours vs historiques
  const traitementsEnLatence = displayTraitements?.filter(
    (t) => t.date_fin_latence && t.date_fin_latence >= todayStr
  ) || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">
            {tSanitaire.title || 'Sécurité Sanitaire & Latence Médicamenteuse'}
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            {tSanitaire.subtitle || "Contrôle des délais d'attente (délai de retrait) avant vente ou abattage pour garantir la conformité sanitaire."}
          </p>
        </div>
      </div>

      {isDemo && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>Données de démonstration : suivi des délais de latence et rappels vaccinaux du cheptel.</span>
        </div>
      )}

      {/* Bannière d'état */}
      {traitementsEnLatence.length > 0 ? (
        <div className="rounded-2xl border border-danger/40 bg-danger/10 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-danger text-white">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-danger">
                {traitementsEnLatence.length} lot(s) ou animal(aux) en période de retrait actif
              </h3>
              <p className="text-sm text-foreground-muted">
                Toute commercialisation ou consommation de viande, lait ou œufs de ces lots est strictement interdite jusqu'à expiration du délai.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-success/30 bg-success/5 p-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-success text-white">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-success">Aucune latence médicale active</h3>
            <p className="text-sm text-foreground-muted">Tous les lots et animaux sont sains et aptes à la commercialisation.</p>
          </div>
        </div>
      )}

      {/* Table des traitements */}
      <div className="rounded-2xl bg-surface border border-surface-border overflow-hidden shadow-sm">
        <div className="p-5 border-b border-surface-border flex items-center justify-between">
          <h3 className="font-bold font-heading text-foreground">Historique des Traitements Administrés</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-background border-b border-surface-border text-xs uppercase text-foreground-muted">
              <tr>
                <th className="py-3 px-4">Date Admin</th>
                <th className="py-3 px-4">Cible (Bande / Animal)</th>
                <th className="py-3 px-4">Médicament / Vaccin</th>
                <th className="py-3 px-4">Quantité</th>
                <th className="py-3 px-4">Délai Latence</th>
                <th className="py-3 px-4">Fin de Retrait</th>
                <th className="py-3 px-4">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {traitements && traitements.length > 0 ? (
                traitements.map((t) => {
                  const estEnLatence = t.date_fin_latence >= todayStr

                  return (
                    <tr key={t.id} className="hover:bg-black/5">
                      <td className="py-3 px-4 font-medium">{t.date_administration}</td>
                      <td className="py-3 px-4 font-semibold text-primary">
                        {t.bandes?.code_bande || t.animaux?.numero_boucle || 'Non spécifié'}
                      </td>
                      <td className="py-3 px-4">{t.intrants?.nom || 'Produit vétérinaire'}</td>
                      <td className="py-3 px-4">
                        {t.quantite_administree} {t.intrants?.unite || 'doses'}
                      </td>
                      <td className="py-3 px-4">{t.duree_latence_jours} jours</td>
                      <td className="py-3 px-4 font-semibold">
                        {t.date_fin_latence}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                            estEnLatence
                              ? 'bg-danger text-white'
                              : 'bg-success/15 text-success'
                          }`}
                        >
                          {estEnLatence ? 'INTERDIT À LA VENTE' : 'Apte à la vente'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-foreground-muted">
                    Aucun traitement médical enregistré pour le moment.
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
