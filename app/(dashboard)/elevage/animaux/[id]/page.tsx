import { createClient } from '@/utils/supabase/server'
import { getTenantContext } from '@/utils/supabase/tenant'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { 
  Beef, 
  ArrowLeft, 
  ShieldAlert, 
  CheckCircle2, 
  Milk, 
  Calendar, 
  Scale, 
  Pill, 
  Warehouse, 
  Activity,
  AlertTriangle,
  Clock,
  Sparkles,
  Printer
} from 'lucide-react'
import { DEMO_ANIMAUX, DEMO_BATIMENTS, DEMO_ESPECES, DEMO_TRAITEMENTS, DEMO_SUIVIS } from '@/lib/demo-data'
import AjouterSoinModal from './AjouterSoinModal'
import AjouterSuiviModal from './AjouterSuiviModal'
import ModifierAnimalModal from './ModifierAnimalModal'
import PrintSectionButton from '@/components/PrintSectionButton'
import { isUuid } from '@/lib/uuid'

export default async function AnimalFicheSoinsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const tenant = await getTenantContext()
  const supabase = await createClient()

  const isUuidId = isUuid(id)
  const demoFallback = (DEMO_ANIMAUX as any[]).find((a) => a.id === id) || (DEMO_ANIMAUX as any[])[0]

  const [
    animalRes,
    { data: batimentsData },
    { data: especesData },
    { data: racesData },
    { data: intrantsData },
    traitementsRes,
    suivisRes
  ] = await Promise.all([
    isUuidId
      ? supabase
          .from('animaux')
          .select('*, batiments(id, nom)')
          .eq('id', id)
          .maybeSingle()
      : (demoFallback?.numero_boucle && tenant?.entrepriseId
          ? supabase
              .from('animaux')
              .select('*, batiments(id, nom)')
              .eq('entreprise_id', tenant.entrepriseId)
              .eq('numero_boucle', demoFallback.numero_boucle)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null })),
    supabase.from('batiments').select('id, nom').order('nom'),
    supabase.from('especes_elevage').select('code, nom').order('nom'),
    supabase.from('races_elevage').select('nom, espece_code').order('nom'),
    supabase
      .from('intrants')
      .select('id, nom, latence_jours_defaut, unite')
      .in('categorie', ['medicament', 'vaccin', 'vitamines', 'autre'])
      .order('nom'),
    isUuidId
      ? supabase
          .from('traitements_medicaux')
          .select('*, intrants(nom, unite, categorie)')
          .eq('animal_id', id)
          .order('date_administration', { ascending: false })
      : Promise.resolve({ data: null, error: null }),
    isUuidId
      ? supabase
          .from('suivi_quotidien')
          .select('*')
          .eq('animal_id', id)
          .order('date_suivi', { ascending: false })
      : Promise.resolve({ data: null, error: null })
  ])

  let animal = animalRes.data
  let traitementsData = traitementsRes.data
  let suivisData = suivisRes.data

  // Si l'animal a été trouvé en base par numéro de boucle pour un id démo
  if (animal && !isUuidId) {
    const [tRes, sRes] = await Promise.all([
      supabase
        .from('traitements_medicaux')
        .select('*, intrants(nom, unite, categorie)')
        .eq('animal_id', animal.id)
        .order('date_administration', { ascending: false }),
      supabase
        .from('suivi_quotidien')
        .select('*')
        .eq('animal_id', animal.id)
        .order('date_suivi', { ascending: false })
    ])
    traitementsData = tRes.data
    suivisData = sRes.data
  }

  if (!animal) {
    animal = demoFallback
  }

  const batiments = (batimentsData && batimentsData.length > 0) ? batimentsData : DEMO_BATIMENTS
  const especes = (especesData && especesData.length > 0) ? especesData : DEMO_ESPECES
  const races = racesData || []
  
  // Traitements démo si pas en base
  const demoTraitementsAnimal = (DEMO_TRAITEMENTS as any[]).filter((t) => t.animal_id === animal.id)
  const traitements = (traitementsData && traitementsData.length > 0) 
    ? traitementsData 
    : (demoTraitementsAnimal.length > 0 ? demoTraitementsAnimal : (traitementsData || []))

  // Suivis démo si pas en base
  const demoSuivisAnimal = (DEMO_SUIVIS as any[]).filter((s) => s.animal_id === animal.id)
  const suivis = (suivisData && suivisData.length > 0)
    ? suivisData
    : (demoSuivisAnimal.length > 0 ? demoSuivisAnimal : (suivisData || []))

  // Intrants sanitaires pour le modal
  const intrants = (intrantsData && intrantsData.length > 0) ? intrantsData : [
    { id: 'int-4', nom: 'Cloxacilline Intramammaire', latence_jours_defaut: 5, unite: 'dose' },
    { id: 'int-5', nom: 'Vaccin Charbon Symptomatique', latence_jours_defaut: 0, unite: 'flacon' },
    { id: 'int-6', nom: 'Ivermectine 1% Injectable (Antiparasitaire)', latence_jours_defaut: 28, unite: 'flacon' },
    { id: 'int-7', nom: 'Oxytétracycline 20% L.A. (Antibiotique)', latence_jours_defaut: 21, unite: 'flacon' },
  ]

  const aujourdhuiStr = new Date().toISOString().split('T')[0]
  const estEnLatence = animal.date_fin_latence && animal.date_fin_latence >= aujourdhuiStr
  const joursLatenceRestants = animal.date_fin_latence && estEnLatence
    ? Math.max(1, Math.ceil((new Date(animal.date_fin_latence).getTime() - new Date(aujourdhuiStr).getTime()) / (1000 * 60 * 60 * 24)))
    : 0

  return (
    <div className="space-y-6">
      {/* Navigation retour & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/elevage/animaux"
            className="p-2.5 rounded-xl bg-surface border border-surface-border text-foreground hover:border-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-heading text-foreground">
                Fiche #{animal.numero_boucle}
              </h1>
              {animal.nom_ou_surnom && (
                <span className="px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary text-xs font-bold">
                  « {animal.nom_ou_surnom} »
                </span>
              )}
            </div>
            <p className="text-xs text-foreground-muted mt-0.5">
              Dossier individuel de traçabilité, suivi sanitaire et performances
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <PrintSectionButton sectionId="fiche-animal-print" label="Imprimer la Fiche" />
          <ModifierAnimalModal
            animal={animal}
            batiments={batiments}
            especes={especes}
            races={races}
          />
          <AjouterSoinModal
            animalId={animal.id}
            numeroBoucle={animal.numero_boucle}
            intrants={intrants}
          />
        </div>
      </div>

      {/* Conteneur imprimable */}
      <div id="fiche-animal-print" className="space-y-6">
        {/* Alerte Sanitaire si Délai de Retrait Actif */}
        {estEnLatence ? (
          <div className="rounded-2xl border-2 border-danger bg-danger/10 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-pulse">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-danger text-white shrink-0">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-danger uppercase tracking-wide">
                    Animal sous Délais d'Attente Médical (Latence Active)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-danger text-white text-xs font-bold">
                    {joursLatenceRestants} jour(s) restant(s)
                  </span>
                </div>
                <p className="text-xs text-foreground mt-1">
                  Traitement administré avec rémanence jusqu'au <span className="font-bold underline">{animal.date_fin_latence}</span>.
                  Toute vente pour abattage ou consommation humaine (viande ou lait) est <span className="font-bold text-danger">strictement proscrite</span>.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-success/30 bg-success/5 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-success text-white">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-success">Statut Sanitaire Conforme</h4>
                <p className="text-xs text-foreground-muted">Aucun délai de retrait actif. Animal apte à la commercialisation.</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-success/20 text-success capitalize">
              {animal.etat_sante || 'Sain'}
            </span>
          </div>
        )}

        {/* Carte Identité & Caractéristiques Principales */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Identité générale */}
          <div className="lg:col-span-2 bg-surface rounded-2xl border border-surface-border p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground-muted mb-4 flex items-center gap-2">
              <Beef className="w-4 h-4 text-secondary" /> Caractéristiques & Généalogie
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div className="p-3 rounded-xl bg-background border border-surface-border/60">
                <span className="text-xs text-foreground-muted block mb-0.5">Espèce</span>
                <span className="font-bold text-foreground capitalize">
                  {animal.espece_code?.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-background border border-surface-border/60">
                <span className="text-xs text-foreground-muted block mb-0.5">Race</span>
                <span className="font-bold text-foreground">
                  {animal.race || 'Non spécifiée'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-background border border-surface-border/60">
                <span className="text-xs text-foreground-muted block mb-0.5">Sexe</span>
                <span className="font-bold text-foreground">
                  {animal.sexe === 'F' ? 'Femelle (F)' : 'Mâle (M)'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-background border border-surface-border/60">
                <span className="text-xs text-foreground-muted block mb-0.5">Poids Actuel</span>
                <span className="font-bold text-secondary text-base">
                  {animal.poids_actuel_kg ? `${animal.poids_actuel_kg} kg` : 'N/C'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-background border border-surface-border/60">
                <span className="text-xs text-foreground-muted block mb-0.5">Phase Laitière</span>
                <span className="font-semibold text-xs flex items-center gap-1 mt-0.5">
                  {animal.en_lactation ? (
                    <span className="text-info flex items-center gap-1 font-bold">
                      <Milk className="w-3.5 h-3.5" /> En lactation active
                    </span>
                  ) : (
                    <span className="text-foreground-muted">Tarissement / Non laitière</span>
                  )}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-background border border-surface-border/60">
                <span className="text-xs text-foreground-muted block mb-0.5">Emplacement</span>
                <span className="font-bold text-foreground flex items-center gap-1">
                  <Warehouse className="w-3.5 h-3.5 text-foreground-muted" />
                  {animal.batiments?.nom || 'Parc général'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-background border border-surface-border/60">
                <span className="text-xs text-foreground-muted block mb-0.5">Date Naissance</span>
                <span className="font-semibold text-foreground text-xs">
                  {animal.date_naissance || 'Inconnue'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-background border border-surface-border/60">
                <span className="text-xs text-foreground-muted block mb-0.5">Père (Ascendance)</span>
                <span className="font-semibold text-foreground text-xs">
                  {animal.pere_boucle ? `#${animal.pere_boucle}` : 'Non renseigné'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-background border border-surface-border/60">
                <span className="text-xs text-foreground-muted block mb-0.5">Mère (Ascendance)</span>
                <span className="font-semibold text-foreground text-xs">
                  {animal.mere_boucle ? `#${animal.mere_boucle}` : 'Non renseignée'}
                </span>
              </div>
            </div>

            {animal.notes && (
              <div className="mt-4 p-3 rounded-xl bg-secondary/5 border border-secondary/20 text-xs text-foreground">
                <span className="font-bold text-secondary block mb-0.5">Observations d'élevage :</span>
                {animal.notes}
              </div>
            )}
          </div>

          {/* Synthèse sanitaire & Actions rapides */}
          <div className="bg-surface rounded-2xl border border-surface-border p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground-muted mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Synthèse Clinique
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-surface-border">
                  <span className="text-foreground-muted text-xs">État de santé :</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    animal.etat_sante === 'sain' 
                      ? 'bg-success/15 text-success' 
                      : animal.etat_sante === 'en_latence' 
                      ? 'bg-danger text-white' 
                      : 'bg-warning/20 text-warning'
                  }`}>
                    {animal.etat_sante}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-surface-border">
                  <span className="text-foreground-muted text-xs">Traitements reçus :</span>
                  <span className="font-bold text-foreground text-xs">{traitements.length} intervention(s)</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-surface-border">
                  <span className="text-foreground-muted text-xs">Pesées & Contrôles :</span>
                  <span className="font-bold text-foreground text-xs">{suivis.length} relevé(s)</span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-foreground-muted text-xs">Date d'entrée cheptel :</span>
                  <span className="font-semibold text-foreground text-xs">{animal.date_entree || 'N/C'}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-surface-border flex flex-col gap-2">
              <AjouterSuiviModal
                animalId={animal.id}
                numeroBoucle={animal.numero_boucle}
                poidsActuel={animal.poids_actuel_kg}
              />
            </div>
          </div>
        </div>

        {/* Section 1 : Historique des Traitements Médicaux & Soins Sanitaires */}
        <div className="bg-surface rounded-2xl border border-surface-border overflow-hidden shadow-sm">
          <div className="p-5 border-b border-surface-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-bold font-heading text-lg text-foreground flex items-center gap-2">
                <Pill className="w-5 h-5 text-danger" /> Carnet de Soins & Traitements Vétérinaires
              </h3>
              <p className="text-xs text-foreground-muted">
                Traçabilité des médicaments, vaccins administrés et vérification du temps d'attente
              </p>
            </div>
            <AjouterSoinModal
              animalId={animal.id}
              numeroBoucle={animal.numero_boucle}
              intrants={intrants}
            />
          </div>

          {traitements.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-background border-b border-surface-border text-xs uppercase text-foreground-muted">
                  <tr>
                    <th className="py-3 px-4">Date Admin</th>
                    <th className="py-3 px-4">Médicament / Vaccin</th>
                    <th className="py-3 px-4">Posologie & Quantité</th>
                    <th className="py-3 px-4">Motif</th>
                    <th className="py-3 px-4">Délai Retrait</th>
                    <th className="py-3 px-4">Fin de Latence</th>
                    <th className="py-3 px-4">Praticien / Soignant</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {traitements.map((t: any) => {
                    const latenceActive = t.date_fin_latence && t.date_fin_latence >= aujourdhuiStr && t.duree_latence_jours > 0

                    return (
                      <tr key={t.id} className={latenceActive ? 'bg-danger/5' : 'hover:bg-surface-border/20'}>
                        <td className="py-3.5 px-4 font-semibold text-xs text-foreground whitespace-nowrap">
                          {t.date_administration}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-foreground">
                          {t.intrants?.nom || 'Médicament spécifique'}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-foreground-muted">
                          {t.quantite_administree} {t.intrants?.unite || 'unité'}
                          {t.dose_par_sujet ? ` (${t.dose_par_sujet})` : ''}
                        </td>
                        <td className="py-3.5 px-4 text-xs capitalize">
                          {t.motif?.replace(/_/g, ' ')}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          {t.duree_latence_jours > 0 ? (
                            <span className="font-bold text-danger">{t.duree_latence_jours} j</span>
                          ) : (
                            <span className="text-foreground-muted">0 j</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          {latenceActive ? (
                            <span className="px-2 py-0.5 rounded-full bg-danger text-white text-[11px] font-bold inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Jusqu'au {t.date_fin_latence}
                            </span>
                          ) : (
                            <span className="text-success font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Expiré / Conforme
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-foreground-muted">
                          {t.administre_par || 'Responsable élevage'}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-foreground-muted max-w-xs truncate">
                          {t.notes || '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-foreground-muted">
              <Pill className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">Aucun traitement sanitaire enregistré pour cet animal</p>
              <p className="text-xs text-foreground-muted mt-0.5">
                Utilisez le bouton ci-dessus pour consigner les vaccinations, antibiotiques et vermifuges.
              </p>
            </div>
          )}
        </div>

        {/* Section 2 : Suivi de Croissance, Pesées & Production Laitière */}
        <div className="bg-surface rounded-2xl border border-surface-border overflow-hidden shadow-sm">
          <div className="p-5 border-b border-surface-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-bold font-heading text-lg text-foreground flex items-center gap-2">
                <Scale className="w-5 h-5 text-secondary" /> Suivi de Croissance & Contrôles de Production
              </h3>
              <p className="text-xs text-foreground-muted">
                Évolution de la masse corporelle (GMQ) et performances laitières relevées
              </p>
            </div>
            <AjouterSuiviModal
              animalId={animal.id}
              numeroBoucle={animal.numero_boucle}
              poidsActuel={animal.poids_actuel_kg}
            />
          </div>

          {suivis.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-background border-b border-surface-border text-xs uppercase text-foreground-muted">
                  <tr>
                    <th className="py-3 px-4">Date Relevé</th>
                    <th className="py-3 px-4">Poids Mesuré</th>
                    <th className="py-3 px-4">Production Laitière</th>
                    <th className="py-3 px-4">Observations Cliniques</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {suivis.map((s: any) => (
                    <tr key={s.id} className="hover:bg-surface-border/20">
                      <td className="py-3.5 px-4 font-semibold text-xs text-foreground whitespace-nowrap">
                        {s.date_suivi}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-secondary">
                        {s.poids_moyen_mesure_kg ? `${s.poids_moyen_mesure_kg} kg` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-info">
                        {s.lait_recolte_litres > 0 ? `${s.lait_recolte_litres} Litres / j` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-foreground-muted">
                        {s.observations || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-foreground-muted">
              <Scale className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">Aucune pesée individuelle enregistrée</p>
              <p className="text-xs text-foreground-muted mt-0.5">
                Pesez régulièrement vos animaux pour mesurer le Gain Moyen Quotidien (GMQ).
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
