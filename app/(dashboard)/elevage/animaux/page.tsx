import { createClient } from '@/utils/supabase/server'
import { getTenantContext } from '@/utils/supabase/tenant'
import { Beef, ShieldAlert, CheckCircle2, Milk, Calendar, Sparkles } from 'lucide-react'
import CreerAnimalModal from './CreerAnimalModal'
import { DEMO_ANIMAUX, DEMO_BATIMENTS, DEMO_ESPECES } from '@/lib/demo-data'

import { getLocale, getDictionary } from '@/dictionaries'

export default async function AnimauxPage() {
  const tenant = await getTenantContext()
  const supabase = await createClient()
  const locale = await getLocale()
  const dict = await getDictionary(locale)
  const tAnimaux = dict.elevage?.animaux_page || {}

  const [
    { data: animaux },
    { data: batiments },
    { data: especes },
    { data: races }
  ] = await Promise.all([
    supabase
      .from('animaux')
      .select('*, batiments(nom)')
      .order('date_entree', { ascending: false }),
    supabase.from('batiments').select('id, nom').order('nom'),
    supabase.from('especes_elevage').select('code, nom').in('categorie', ['bovin', 'petit_ruminant', 'porcin']).order('nom'),
    supabase.from('races_elevage').select('id, nom, espece_code').order('nom')
  ])

  const isDemo = !animaux || animaux.length === 0
  const displayAnimaux = isDemo ? (DEMO_ANIMAUX as any[]) : animaux
  const displayBatiments = (batiments && batiments.length > 0) ? batiments : DEMO_BATIMENTS
  const displayEspeces = (especes && especes.length > 0) ? especes : DEMO_ESPECES
  const displayRaces = races || []

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">
            {tAnimaux.title || 'Bovins & Ruminants (Suivi par Boucle)'}
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            {tAnimaux.subtitle || 'Traçabilité individuelle : généalogie, lactation, pesées et suivi sanitaire.'}
          </p>
        </div>
        <CreerAnimalModal
          batiments={displayBatiments}
          especes={displayEspeces}
          races={displayRaces}
        />
      </div>

      {isDemo && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>Données de démonstration : cheptel bovin laitier et béliers Ladoum d'élite du Sahel.</span>
        </div>
      )}

      {/* Grille des animaux */}
      {displayAnimaux && displayAnimaux.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayAnimaux.map((a) => {
            const enLatence = a.etat_sante === 'en_latence'

            return (
              <div
                key={a.id}
                className={`rounded-2xl bg-surface border p-6 shadow-sm transition-all flex flex-col justify-between ${
                  enLatence 
                    ? 'border-danger/40 bg-danger/5' 
                    : 'border-surface-border hover:border-secondary'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold font-heading text-lg text-foreground">
                      {a.numero_boucle}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        enLatence
                          ? 'bg-danger text-white'
                          : a.etat_sante === 'sain'
                          ? 'bg-success/15 text-success'
                          : 'bg-warning/20 text-warning'
                      }`}
                    >
                      {enLatence ? 'Latence Médicale' : a.etat_sante}
                    </span>
                  </div>

                  <p className="text-xs text-foreground-muted mb-4 capitalize">
                    {a.nom_ou_surnom ? `"${a.nom_ou_surnom}" — ` : ''}
                    {a.espece_code?.replace(/_/g, ' ')}
                    {a.race ? ` (${a.race})` : ''} &bull; Sexe: {a.sexe}
                  </p>

                  <div className="space-y-2 text-sm border-t border-surface-border/50 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-foreground-muted text-xs">Poids mesuré :</span>
                      <span className="font-bold text-foreground text-xs">
                        {a.poids_actuel_kg ? `${a.poids_actuel_kg} kg` : 'Non renseigné'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-foreground-muted text-xs">Phase de traite :</span>
                      <span className="font-semibold text-xs flex items-center gap-1">
                        {a.en_lactation ? (
                          <span className="text-info flex items-center gap-1"><Milk className="w-3.5 h-3.5" /> En lactation</span>
                        ) : (
                          <span className="text-foreground-muted">Non</span>
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-foreground-muted text-xs">Emplacement :</span>
                      <span className="text-foreground text-xs font-medium">
                        {a.batiments?.nom || 'Parc général'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-foreground-muted text-xs">Entrée :</span>
                      <span className="text-foreground-muted text-xs">
                        {a.date_entree} ({a.origine.replace(/_/g, ' ')})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-surface-border flex items-center justify-between text-xs">
                  <span className="text-foreground-muted">
                    Père: {a.pere_boucle || 'N/C'} | Mère: {a.mere_boucle || 'N/C'}
                  </span>
                  <a
                    href={`/elevage/animaux/${a.id}`}
                    className="font-semibold text-secondary hover:underline"
                  >
                    Fiche & Soins &rarr;
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-surface border border-surface-border p-12 text-center">
          <Beef className="w-12 h-12 text-foreground-muted/40 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground">Aucun animal identifié</h3>
          <p className="text-sm text-foreground-muted max-w-md mx-auto mt-1 mb-6">
            Enregistrez les numéros de boucle de vos bovins, ovins ou caprins pour assurer le suivi individuel.
          </p>
          <CreerAnimalModal
            batiments={displayBatiments}
            especes={displayEspeces}
            races={displayRaces}
          />
        </div>
      )}
    </div>
  )
}
