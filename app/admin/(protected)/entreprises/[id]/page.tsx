import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Users, CreditCard } from 'lucide-react'
import { createAdminClient } from '@/utils/supabase/admin'
import EntrepriseConfigCard from './EntrepriseConfigCard'
import EntrepriseActions from './EntrepriseActions'
import UtilisateurRow from './UtilisateurRow'
import AjouterUtilisateurModal from './AjouterUtilisateurModal'
import type { PermissionMap } from '@/lib/permissions'
import ValiderPaiementButton from '../ValiderPaiementButton'

export const dynamic = 'force-dynamic'

export default async function AdminEntrepriseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: ent } = await supabase
    .from('entreprises')
    .select('id, nom, code_pays, telephone, email, adresse, devise, subscription_tier, compte_verrouille, essai_expire_le, created_at, updated_at')
    .eq('id', id)
    .maybeSingle()

  if (!ent) notFound()

  // Utilisateurs rattachés à cette exploitation
  const { data: utilisateurs } = await supabase
    .from('utilisateurs')
    .select('id, entreprise_id, nom_complet, role, permissions, actif, created_at')
    .eq('entreprise_id', id)
    .order('created_at', { ascending: false })

  // Récupérer les comptes auth pour avoir l'e-mail exact et le statut de bannissement
  const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const authMap = new Map(authUsers?.users.map((u) => [u.id, u]) ?? [])

  // Paiements de cette entreprise
  const { data: paiements } = await supabase
    .from('abonnement_paiements')
    .select('id, niveau, montant, devise, provider, moyen_paiement, provider_reference, statut, created_at')
    .or(`entreprise_id.eq.${id},gie_id.eq.${id}`)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Navigation retour */}
      <div>
        <Link
          href="/admin/entreprises"
          className="text-foreground-muted hover:text-primary inline-flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux exploitations
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold font-heading text-foreground break-words">
            {ent.nom}
          </h1>
          <span className="text-xs bg-surface border border-surface-border px-2.5 py-1 rounded-full text-foreground-muted font-mono">
            ID: {ent.id.slice(0, 8)}...
          </span>
        </div>
      </div>

      {/* Configuration & Actions principales */}
      <div className="grid md:grid-cols-2 gap-6">
        <EntrepriseConfigCard entreprise={ent} />

        {/* Bloc Collaborateurs & Permissions */}
        <div className="bg-background rounded-xl p-5 border border-surface-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-surface-border">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Utilisateurs & Droits d'accès ({(utilisateurs ?? []).length})
              </h2>
              <AjouterUtilisateurModal entrepriseId={ent.id} />
            </div>

            <ul className="divide-y divide-surface-border">
              {(utilisateurs ?? []).map((u) => {
                const authUser = authMap.get(u.id)
                return (
                  <UtilisateurRow
                    key={u.id}
                    entrepriseId={ent.id}
                    utilisateurId={u.id}
                    email={authUser?.email || u.id}
                    nomComplet={u.nom_complet}
                    roleActuel={u.role || 'agent'}
                    permissionsActuelles={(u.permissions as PermissionMap | null) ?? null}
                    banni={Boolean(authUser?.banned_until && new Date(authUser.banned_until) > new Date())}
                  />
                )
              })}

              {(utilisateurs ?? []).length === 0 && (
                <li className="text-foreground-muted py-6 text-center text-sm italic">
                  Aucun compte utilisateur rattaché à cette exploitation.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Actions globales de statut & abonnement */}
      <EntrepriseActions
        entrepriseId={ent.id}
        forfaitActuel={ent.subscription_tier || 'standard'}
        verrouille={!!ent.compte_verrouille}
        essaiExpireLe={ent.essai_expire_le}
      />

      {/* Historique des paiements de l'entreprise */}
      <div className="bg-background rounded-xl p-5 border border-surface-border space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            Historique des paiements d'abonnement
          </h2>
        </div>

        <div className="overflow-x-auto rounded-lg border border-surface-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-foreground-muted text-left text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Forfait</th>
                <th className="px-4 py-3 font-semibold">Montant</th>
                <th className="px-4 py-3 font-semibold">Mode / Réf</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {(paiements ?? []).map((p) => (
                <tr key={p.id} className="hover:bg-surface/50">
                  <td className="px-4 py-3 text-xs text-foreground-muted">
                    {p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR') : '-'}
                  </td>
                  <td className="px-4 py-3 font-medium capitalize text-xs">
                    {p.niveau}
                  </td>
                  <td className="px-4 py-3 font-bold text-xs">
                    {Number(p.montant).toLocaleString('fr-FR')} {p.devise || 'FCFA'}
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground-muted font-mono">
                    {p.provider} ({p.moyen_paiement}) {p.provider_reference ? `· ${p.provider_reference}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        p.statut === 'completed'
                          ? 'bg-success/10 text-success'
                          : p.statut === 'pending'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-danger/10 text-danger'
                      }`}
                    >
                      {p.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.statut === 'pending' && (
                      <ValiderPaiementButton paiementId={p.id} />
                    )}
                  </td>
                </tr>
              ))}
              {(paiements ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-foreground-muted italic text-xs">
                    Aucun paiement enregistré pour cette exploitation.
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

