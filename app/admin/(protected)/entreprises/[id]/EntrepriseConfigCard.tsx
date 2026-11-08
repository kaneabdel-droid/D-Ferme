'use client'

import { useState, useTransition } from 'react'
import { Building2, Save, Check } from 'lucide-react'
import { modifierEntreprise } from '../actions'

export default function EntrepriseConfigCard({
  entreprise,
}: {
  entreprise: {
    id: string
    nom: string
    telephone?: string | null
    email?: string | null
    adresse?: string | null
    devise?: string | null
    subscription_tier?: string | null
    essai_expire_le?: string | null
    compte_verrouille?: boolean | null
    created_at?: string | null
  }
}) {
  const [nom, setNom] = useState(entreprise.nom || '')
  const [telephone, setTelephone] = useState(entreprise.telephone || '')
  const [email, setEmail] = useState(entreprise.email || '')
  const [adresse, setAdresse] = useState(entreprise.adresse || '')
  const [devise, setDevise] = useState(entreprise.devise || 'FCFA')
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setIsError(false)

    startTransition(async () => {
      const res = await modifierEntreprise(entreprise.id, {
        nom,
        telephone,
        email,
        adresse,
        devise,
        subscription_tier: entreprise.subscription_tier || 'standard',
      })

      if (res?.error) {
        setIsError(true)
        setMessage(`Erreur : ${res.error}`)
      } else {
        setMessage('Configuration mise à jour avec succès.')
        setTimeout(() => setMessage(null), 4000)
      }
    })
  }

  return (
    <div className="bg-background rounded-xl p-5 border border-surface-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          Configuration de l'exploitation
        </h2>
      </div>

      {message && (
        <div
          className={`mb-4 p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
            isError ? 'bg-danger/10 text-danger border border-danger/20' : 'bg-success/10 text-success border border-success/20'
          }`}
        >
          {!isError && <Check className="w-3.5 h-3.5" />}
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-foreground-muted mb-1">
            Nom de l'exploitation
          </label>
          <input
            type="text"
            required
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="w-full rounded-md border border-surface-border bg-surface px-3 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1">
              Téléphone contact
            </label>
            <input
              type="tel"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              className="w-full rounded-md border border-surface-border bg-surface px-3 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1">
              Email contact
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-surface-border bg-surface px-3 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1">
              Localisation / Adresse
            </label>
            <input
              type="text"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              className="w-full rounded-md border border-surface-border bg-surface px-3 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1">
              Devise monétaire
            </label>
            <select
              value={devise}
              onChange={(e) => setDevise(e.target.value)}
              className="w-full rounded-md border border-surface-border bg-surface px-3 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="FCFA">FCFA (XOF)</option>
              <option value="GNF">Franc Guinéen (GNF)</option>
              <option value="EUR">Euro (€)</option>
              <option value="USD">Dollar ($)</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    </div>
  )
}

