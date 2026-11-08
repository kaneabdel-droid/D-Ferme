'use client'

import { useState, useTransition } from 'react'
import { changerForfait, prolongerEssai, verrouillerCompte, deverrouillerCompte } from '../actions'
import ValiderAbonnementModal from './ValiderAbonnementModal'
import SupprimerEntrepriseButton from './SupprimerEntrepriseButton'

export default function EntrepriseActions({
  entrepriseId,
  forfaitActuel,
  verrouille,
  essaiExpireLe,
}: {
  entrepriseId: string
  forfaitActuel: string
  verrouille: boolean
  essaiExpireLe?: string | null
}) {
  const [forfait, setForfait] = useState(forfaitActuel || 'standard')
  const [jours, setJours] = useState(14)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  const run = (action: () => Promise<{ success?: boolean; error?: string }>) => {
    setMessage(null)
    startTransition(async () => {
      try {
        const result = await action()
        setMessage(result.error ? `Erreur : ${result.error}` : 'Action exécutée avec succès.')
      } catch (err) {
        setMessage(`Erreur : ${err instanceof Error ? err.message : String(err)}`)
      }
    })
  }

  const maintenant = new Date()
  const essaiExpire = essaiExpireLe ? new Date(essaiExpireLe) < maintenant : false

  return (
    <div className="bg-background rounded-xl p-5 border border-surface-border">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="font-semibold text-foreground">Actions & Statut du compte</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-foreground-muted">Statut :</span>
            {verrouille ? (
              <span className="text-xs bg-danger/10 text-danger px-2 py-0.5 rounded-full font-bold">
                Compte verrouillé
              </span>
            ) : essaiExpire ? (
              <span className="text-xs bg-danger/10 text-danger px-2 py-0.5 rounded-full font-bold">
                Essai expiré ({new Date(essaiExpireLe!).toLocaleDateString('fr-FR')})
              </span>
            ) : essaiExpireLe ? (
              <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full font-bold">
                Essai en cours (jusqu'au {new Date(essaiExpireLe).toLocaleDateString('fr-FR')})
              </span>
            ) : (
              <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-bold">
                Abonnement Actif
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ValiderAbonnementModal entrepriseId={entrepriseId} forfaitActuel={forfaitActuel} />
          <SupprimerEntrepriseButton entrepriseId={entrepriseId} />
        </div>
      </div>

      {message && <p className="text-xs text-primary mb-4 p-2 bg-primary/10 rounded-lg">{message}</p>}

      <div className="flex flex-wrap items-end gap-6 pt-2 border-t border-surface-border">
        <div>
          <label className="block text-xs text-foreground-muted mb-1 font-medium">Changer le forfait</label>
          <div className="flex gap-2">
            <select
              value={forfait}
              onChange={(e) => setForfait(e.target.value)}
              className="rounded-md border border-surface-border bg-surface px-3 py-1.5 text-xs text-foreground"
            >
              <option value="standard">Standard</option>
              <option value="medium">Medium</option>
              <option value="premium">Premium</option>
            </select>
            <button
              disabled={isPending || forfait === forfaitActuel}
              onClick={() => run(() => changerForfait(entrepriseId, forfait))}
              className="rounded-md bg-primary text-white px-3 py-1.5 text-xs font-semibold hover:bg-primary-hover disabled:opacity-50"
            >
              Appliquer
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs text-foreground-muted mb-1 font-medium">Prolonger l'essai (jours)</label>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              value={jours}
              onChange={(e) => setJours(parseInt(e.target.value, 10) || 1)}
              className="w-20 rounded-md border border-surface-border bg-surface px-3 py-1.5 text-xs text-foreground"
            />
            <button
              disabled={isPending}
              onClick={() => run(() => prolongerEssai(entrepriseId, jours))}
              className="rounded-md bg-surface border border-surface-border text-foreground px-3 py-1.5 text-xs font-semibold hover:bg-surface-hover disabled:opacity-50"
            >
              +{jours}j
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs text-foreground-muted mb-1 font-medium">Verrouillage de l'accès</label>
          {verrouille ? (
            <button
              disabled={isPending}
              onClick={() => run(() => deverrouillerCompte(entrepriseId))}
              className="rounded-md bg-success text-white px-3 py-1.5 text-xs font-bold hover:bg-success/90 disabled:opacity-50"
            >
              Déverrouiller le compte
            </button>
          ) : (
            <button
              disabled={isPending}
              onClick={() => run(() => verrouillerCompte(entrepriseId))}
              className="rounded-md bg-danger text-white px-3 py-1.5 text-xs font-bold hover:bg-danger/90 disabled:opacity-50"
            >
              Verrouiller le compte
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

