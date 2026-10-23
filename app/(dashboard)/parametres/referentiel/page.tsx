import { createClient } from '@/utils/supabase/server'
import { getTenantContext } from '@/utils/supabase/tenant'
import { redirect } from 'next/navigation'
import ReferentielClient from './ReferentielClient'

export default async function ReferentielPage() {
  const tenant = await getTenantContext()
  if (!tenant) redirect('/login')

  const supabase = await createClient()

  const [
    { data: especes },
    { data: races },
    { data: speculations },
    { data: categories }
  ] = await Promise.all([
    supabase
      .from('especes_elevage')
      .select('*')
      .or(`entreprise_id.is.null,entreprise_id.eq.${tenant.entrepriseId}`)
      .order('nom'),
    supabase
      .from('races_elevage')
      .select('*')
      .or(`entreprise_id.is.null,entreprise_id.eq.${tenant.entrepriseId}`)
      .order('nom'),
    supabase
      .from('speculations_vegetales')
      .select('*')
      .or(`entreprise_id.is.null,entreprise_id.eq.${tenant.entrepriseId}`)
      .order('nom'),
    supabase
      .from('categories_intrants')
      .select('*')
      .or(`entreprise_id.is.null,entreprise_id.eq.${tenant.entrepriseId}`)
      .order('nom')
  ])

  return (
    <ReferentielClient
      initialEspeces={especes || []}
      initialRaces={races || []}
      initialSpeculations={speculations || []}
      initialCategories={categories || []}
      entrepriseId={tenant.entrepriseId}
    />
  )
}
