import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getTenantContext, ACTIVITES_PAR_DEFAUT } from '@/utils/supabase/tenant'
import { getDictionary, getLocale } from '@/dictionaries'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Database } from 'lucide-react'
import ParametresForm from './ParametresForm'

export default async function ParametresPage() {
  const tenant = await getTenantContext()
  if (!tenant) redirect('/login')

  const locale = await getLocale()
  const dict = await getDictionary(locale)
  const cookieStore = await cookies()
  const menuLayout = (cookieStore.get('menu_layout')?.value === 'horizontal' ? 'horizontal' : 'sidebar') as 'sidebar' | 'horizontal'

  const supabase = await createClient()

  let entreprise: any = null
  try {
    const { data } = await supabase
      .from('entreprises')
      .select('nom, adresse, telephone, email, devise, types_activite')
      .eq('id', tenant.entrepriseId)
      .maybeSingle()
    entreprise = data
  } catch {}

  const typesActivite = Array.isArray(entreprise?.types_activite) && entreprise.types_activite.length > 0
    ? entreprise.types_activite
    : tenant.typesActivite || ACTIVITES_PAR_DEFAUT

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">
          {dict.parametres?.title || "Paramètres de l'Exploitation"}
        </h1>
        <p className="text-sm text-foreground-muted mt-1">
          {dict.parametres?.desc || "Configurez l'identité de votre ferme, vos types d'activité, votre devise et vos préférences de navigation."}
        </p>
      </div>

      <Link
        href="/parametres/referentiel"
        className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-surface-border hover:border-primary transition-all group shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
              Référentiel Espèces, Races, Spéculations & Intrants
            </h3>
            <p className="text-xs text-foreground-muted">
              Personnalisez vos races animales, spéculations végétales et catégories de consommables.
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
          Gérer le catalogue &rarr;
        </span>
      </Link>

      <ParametresForm
        entreprise={{
          nom: entreprise?.nom ?? tenant.entrepriseNom ?? '',
          adresse: entreprise?.adresse ?? '',
          telephone: entreprise?.telephone ?? '',
          email: entreprise?.email ?? '',
          devise: entreprise?.devise ?? tenant.devise ?? 'FCFA',
          typesActivite,
        }}
        menuLayout={menuLayout}
        subscriptionTier={tenant.subscriptionTier}
        dict={dict}
      />
    </div>
  )
}
