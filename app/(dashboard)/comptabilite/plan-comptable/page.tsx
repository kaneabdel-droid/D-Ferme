import { getPlanComptable } from '../actions'
import PlanComptableClient from './PlanComptableClient'

export default async function PlanComptablePage() {
  const { plan } = await getPlanComptable()

  return <PlanComptableClient plan={plan || []} />
}
