'use client'

import { useState, useTransition } from 'react'
import PermissionsMatrix from './PermissionsMatrix'
import { fullPermissions, type PermissionMap } from '@/lib/permissions'
import {
  changerPermissionsUtilisateur,
  changerRoleUtilisateur,
  desactiverCompteUtilisateur,
  reactiverCompteUtilisateur,
  retirerUtilisateur,
} from '../actions'
import { Shield, UserX, UserCheck, Trash2, Key } from 'lucide-react'

export default function UtilisateurRow({
  entrepriseId,
  utilisateurId,
  email,
  nomComplet,
  roleActuel,
  permissionsActuelles,
  banni,
}: {
  entrepriseId: string
  utilisateurId: string
  email: string
  nomComplet?: string | null
  roleActuel: string
  permissionsActuelles: PermissionMap | null
  banni: boolean
}) {
  const [role, setRole] = useState(roleActuel)
  const [showPerms, setShowPerms] = useState(false)
  const [perms, setPerms] = useState<PermissionMap>(permissionsActuelles ?? fullPermissions())
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  const isSynthetic = email.endsWith('@auth.dembasolution.internal')
  const displayName = nomComplet || (isSynthetic ? email.replace('@auth.dembasolution.internal', '') : email)

  const run = (action: () => Promise<{ success?: boolean; error?: string }>) => {
    setMessage(null)
    startTransition(async () => {
      try {
        const result = await action()
        if (result.error) setMessage(`Erreur : ${result.error}`)
        else setMessage('Modifications enregistrées.')
      } catch (err) {
        setMessage(`Erreur : ${err instanceof Error ? err.message : String(err)}`)
      }
    })
  }

  const handleRetirer = () => {
    if (!confirm(`Supprimer ${displayName} de cette exploitation ? Son compte sera également supprimé.`)) return
    run(() => retirerUtilisateur(entrepriseId, utilisateurId))
  }

  return (
    <li className="py-3.5 space-y-2.5">
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground text-sm">{displayName}</span>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium capitalize">
              {roleActuel}
            </span>
          </div>
          <p className="text-xs text-foreground-muted truncate">{email}</p>
        </div>
        <div>
          {banni ? (
            <span className="text-xs bg-danger/10 text-danger px-2 py-0.5 rounded-full font-medium">Désactivé</span>
          ) : (
            <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">Actif</span>
          )}
        </div>
      </div>

      {message && <p className="text-xs text-primary">{message}</p>}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          disabled={isPending}
          className="rounded-md border border-surface-border bg-surface px-2 py-1 text-xs"
        >
          <option value="admin">Administrateur</option>
          <option value="responsable">Responsable d'élevage</option>
          <option value="veterinaire">Vétérinaire</option>
          <option value="comptable">Comptable</option>
          <option value="agent">Agent d'élevage</option>
          <option value="ouvrier">Ouvrier agricole</option>
        </select>

        {role !== roleActuel && (
          <button
            disabled={isPending}
            onClick={() => run(() => changerRoleUtilisateur(entrepriseId, utilisateurId, role))}
            className="rounded-md bg-primary text-white px-2.5 py-1 text-xs font-medium hover:bg-primary-hover disabled:opacity-50"
          >
            Enregistrer le rôle
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowPerms(!showPerms)}
          className="inline-flex items-center gap-1 rounded-md border border-surface-border bg-surface px-2 py-1 text-xs font-medium text-foreground hover:bg-surface-hover"
        >
          <Key className="w-3 h-3 text-primary" />
          {showPerms ? 'Masquer permissions' : 'Permissions'}
        </button>

        {banni ? (
          <button
            disabled={isPending}
            onClick={() => run(() => reactiverCompteUtilisateur(entrepriseId, utilisateurId))}
            className="inline-flex items-center gap-1 text-xs text-success bg-success/10 px-2 py-1 rounded hover:bg-success/20"
            title="Réactiver le compte"
          >
            <UserCheck className="w-3 h-3" /> Réactiver
          </button>
        ) : (
          <button
            disabled={isPending}
            onClick={() => run(() => desactiverCompteUtilisateur(entrepriseId, utilisateurId))}
            className="inline-flex items-center gap-1 text-xs text-warning bg-warning/10 px-2 py-1 rounded hover:bg-warning/20"
            title="Désactiver l'accès"
          >
            <UserX className="w-3 h-3" /> Désactiver
          </button>
        )}

        <button
          disabled={isPending}
          onClick={handleRetirer}
          className="inline-flex items-center gap-1 text-xs text-danger bg-danger/10 px-2 py-1 rounded hover:bg-danger/20"
          title="Supprimer l'utilisateur"
        >
          <Trash2 className="w-3 h-3" /> Supprimer
        </button>
      </div>

      {showPerms && (
        <div className="mt-3 p-3 bg-surface rounded-lg border border-surface-border space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-primary" /> Matrice des droits d'accès
            </h4>
            <button
              disabled={isPending}
              onClick={() => run(() => changerPermissionsUtilisateur(entrepriseId, utilisateurId, perms))}
              className="rounded-md bg-success text-white px-3 py-1 text-xs font-bold hover:bg-success/90"
            >
              Sauvegarder les permissions
            </button>
          </div>
          <PermissionsMatrix value={perms} onChange={setPerms} disabled={isPending} />
        </div>
      )}
    </li>
  )
}

