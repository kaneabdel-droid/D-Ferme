import { createClient } from '@/utils/supabase/server'
import { getTenantContext } from '@/utils/supabase/tenant'
import { Warehouse, Bird, Beef, Users, CheckCircle2 } from 'lucide-react'
import CreerBatimentModal from './CreerBatimentModal'

import { getLocale, getDictionary } from '@/dictionaries'

export default async function BatimentsPage() {
  const tenant = await getTenantContext()
  const supabase = await createClient()
  const locale = await getLocale()
  const dict = await getDictionary(locale)
  const tBatiments = dict.elevage?.batiments_page || {}

  const [
    { data: batiments },
    { data: bandes },
    { data: animaux }
  ] = await Promise.all([
    supabase.from('batiments').select('*').order('nom'),
    supabase.from('bandes').select('batiment_id, effectif_actuel').eq('statut', 'en_cours'),
    supabase.from('animaux').select('batiment_id').in('etat_sante', ['sain', 'en_soins', 'en_latence'])
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">
            {tBatiments.title || 'Bâtiments, Poulaillers & Enclos'}
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            {tBatiments.subtitle || "Organisation spatiale de la ferme : capacité d'accueil et taux d'occupation des infrastructures."}
          </p>
        </div>
        <CreerBatimentModal />
      </div>

      {batiments && batiments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batiments.map((b) => {
            // Calculer l'occupation actuelle
            const effectifVolailles = bandes
              ?.filter((bande) => bande.batiment_id === b.id)
              .reduce((acc, bande) => acc + (bande.effectif_actuel || 0), 0) || 0

            const effectifRuminants = animaux
              ?.filter((a) => a.batiment_id === b.id).length || 0

            const totalOccupants = effectifVolailles + effectifRuminants
            const tauxOccupation = b.capacite_max > 0 
              ? Math.min(100, Math.round((totalOccupants / b.capacite_max) * 100))
              : 0

            return (
              <div
                key={b.id}
                className="rounded-2xl bg-surface border border-surface-border p-6 shadow-sm hover:border-primary transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold font-heading text-lg text-foreground">
                      {b.nom}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-black/5 capitalize text-foreground-muted">
                      {b.type_batiment}
                    </span>
                  </div>

                  <div className="space-y-3 mt-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-foreground-muted">Taux d'occupation</span>
                        <span className="font-bold text-foreground">{tauxOccupation}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-background overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            tauxOccupation > 90 ? 'bg-danger' : tauxOccupation > 60 ? 'bg-warning' : 'bg-primary'
                          }`}
                          style={{ width: `${tauxOccupation}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm pt-2 border-t border-surface-border/50">
                      <span className="text-xs text-foreground-muted">Présence actuelle :</span>
                      <span className="font-bold text-foreground">
                        {totalOccupants} / {b.capacite_max}
                      </span>
                    </div>

                    {effectifVolailles > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                        <Bird className="w-3.5 h-3.5" /> {effectifVolailles} volailles en bandes
                      </div>
                    )}

                    {effectifRuminants > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-secondary font-medium">
                        <Beef className="w-3.5 h-3.5" /> {effectifRuminants} têtes de bétail
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-surface-border text-xs text-foreground-muted">
                  Infrastructure active &bull; Conforme aux normes d'aération
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-surface border border-surface-border p-12 text-center">
          <Warehouse className="w-12 h-12 text-foreground-muted/40 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground">Aucun bâtiment configuré</h3>
          <p className="text-sm text-foreground-muted max-w-md mx-auto mt-1 mb-6">
            Ajoutez vos poulaillers, étables et enclos pour gérer leur capacité et la répartition des animaux.
          </p>
          <CreerBatimentModal />
        </div>
      )}
    </div>
  )
}
