'use client'

import { useState, useTransition } from 'react'
import { UserPlus, X, Check } from 'lucide-react'
import { creerUtilisateurPourEntreprise } from '../actions'

export default function AjouterUtilisateurModal({ entrepriseId }: { entrepriseId: string }) {
  const [open, setOpen] = useState(false)
  const [identifiant, setIdentifiant] = useState('')
  const [password, setPassword] = useState('')
  const [nomComplet, setNomComplet] = useState('')
  const [telephone, setTelephone] = useState('')
  const [role, setRole] = useState('agent')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!identifiant.trim()) {
      setError('Veuillez renseigner un email ou identifiant')
      return
    }
    if (!password || password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères')
      return
    }

    startTransition(async () => {
      const res = await creerUtilisateurPourEntreprise(
        entrepriseId,
        identifiant.trim(),
        password,
        role,
        null,
        {
          nomComplet: nomComplet.trim() || undefined,
          telephone: telephone.trim() || undefined,
        }
      )

      if (res?.error) {
        setError(res.error)
      } else {
        setOpen(false)
        setIdentifiant('')
        setPassword('')
        setNomComplet('')
        setTelephone('')
        setRole('agent')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors"
      >
        <UserPlus className="w-3.5 h-3.5" />
        Ajouter un utilisateur
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-background border border-surface-border p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Créer un compte utilisateur
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-foreground-muted hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-xs text-danger">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Nom complet (Prénom et Nom)
                </label>
                <input
                  type="text"
                  value={nomComplet}
                  onChange={(e) => setNomComplet(e.target.value)}
                  placeholder="Ex: Ibrahima Diallo"
                  className="w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Email ou Identifiant de connexion *
                </label>
                <input
                  type="text"
                  required
                  value={identifiant}
                  onChange={(e) => setIdentifiant(e.target.value)}
                  placeholder="Ex: ibrahima@ferme.sn ou diallo_ferme"
                  className="w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
                <p className="mt-1 text-[11px] text-foreground-muted">
                  Si un identifiant court est saisi, un alias interne sera automatiquement assigné.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Téléphone (optionnel)
                  </label>
                  <input
                    type="tel"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    placeholder="77 123 45 67"
                    className="w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Rôle d'accès *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="admin">Administrateur</option>
                    <option value="responsable">Responsable élevage</option>
                    <option value="veterinaire">Vétérinaire</option>
                    <option value="comptable">Comptable</option>
                    <option value="agent">Agent d'élevage</option>
                    <option value="ouvrier">Ouvrier agricole</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Mot de passe temporaire * (min 6 caractères)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                  className="rounded-lg border border-surface-border bg-surface px-4 py-2 text-xs font-medium text-foreground hover:bg-surface-hover"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-hover disabled:opacity-50"
                >
                  {isPending ? 'Création en cours...' : 'Créer le compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

