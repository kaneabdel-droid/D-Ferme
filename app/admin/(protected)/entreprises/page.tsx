import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/admin'
import EntrepriseRowActions from './EntrepriseRowActions'
import { Settings, ExternalLink } from 'lucide-react'

export default async function AdminEntreprisesPage() {
  const supabase = createAdminClient()

  let entreprises: any[] = []
  try {
    const { data } = await supabase
      .from('entreprises')
      .select('id, nom, telephone, email, subscription_tier, essai_expire_le, compte_verrouille, devise, created_at')
      .order('created_at', { ascending: false })
    entreprises = data || []
  } catch (e) {
    console.error('Erreur chargement entreprises admin:', e)
  }

  const maintenant = new Date()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">
            Exploitations D-ÉLEVAGE ({entreprises.length})
          </h1>
          <p className="text-sm text-foreground-muted">
            Gestion des accès, permissions, forfaits et validation des abonnements.
          </p>
        </div>
      </div>

      <div className="bg-background rounded-xl border border-surface-border overflow-hidden overflow-x-auto shadow-xs">
        <table className="w-full text-sm">
          <thead className="bg-surface text-foreground-muted text-left">
            <tr>
              <th className="px-4 py-3 font-semibold">Nom de l'exploitation</th>
              <th className="px-4 py-3 font-semibold">Contact</th>
              <th className="px-4 py-3 font-semibold">Forfait</th>
              <th className="px-4 py-3 font-semibold">Statut</th>
              <th className="px-4 py-3 font-semibold text-right">Actions & Configuration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {entreprises.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-foreground-muted italic">
                  Aucune exploitation enregistrée.
                </td>
              </tr>
            ) : (
              entreprises.map((ent) => {
                const essaiExpire = ent.essai_expire_le ? new Date(ent.essai_expire_le) < maintenant : false
                return (
                  <tr key={ent.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/entreprises/${ent.id}`}
                        className="group inline-flex items-center gap-1.5 font-bold text-foreground hover:text-primary transition-colors"
                      >
                        <span>{ent.nom}</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                      </Link>
                      <p className="text-xs text-foreground-muted">{ent.devise || 'FCFA'}</p>
                    </td>
                    <td className="px-4 py-3 text-foreground-muted text-xs">
                      <div>{ent.email || '-'}</div>
                      <div>{ent.telephone || ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize font-semibold text-xs bg-surface border border-surface-border px-2 py-0.5 rounded">
                        {ent.subscription_tier || 'standard'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {ent.compte_verrouille ? (
                        <span className="text-danger font-medium text-xs bg-danger/10 px-2 py-0.5 rounded-full">
                          Verrouillé
                        </span>
                      ) : essaiExpire ? (
                        <span className="text-danger font-medium text-xs bg-danger/10 px-2 py-0.5 rounded-full">
                          Essai expiré
                        </span>
                      ) : ent.essai_expire_le ? (
                        <span className="text-warning font-medium text-xs bg-warning/10 px-2 py-0.5 rounded-full">
                          Essai (jusqu'au {new Date(ent.essai_expire_le).toLocaleDateString('fr-FR')})
                        </span>
                      ) : (
                        <span className="text-success font-medium text-xs bg-success/10 px-2 py-0.5 rounded-full">
                          Abonnement Actif
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <EntrepriseRowActions
                          entrepriseId={ent.id}
                          tier={ent.subscription_tier || 'standard'}
                          isVerrouille={!!ent.compte_verrouille}
                        />
                        <Link
                          href={`/admin/entreprises/${ent.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-2.5 py-1 transition-colors"
                          title="Fiche complète, permissions et paiements"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          Gérer
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
