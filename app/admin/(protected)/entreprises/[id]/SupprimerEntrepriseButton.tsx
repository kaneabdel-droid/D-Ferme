'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { supprimerEntreprise } from '../actions'

export default function SupprimerEntrepriseButton({ entrepriseId }: { entrepriseId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSupprimer = () => {
    if (
      !confirm(
        'ATTENTION : Supprimer définitivement cette exploitation et TOUTES ses données (animaux, bandes, finances, comptes utilisateurs) ? Cette action est irréversible.'
      )
    ) {
      return
    }

    startTransition(async () => {
      const res = await supprimerEntreprise(entrepriseId)
      if (res?.error) {
        alert(`Erreur : ${res.error}`)
      } else {
        router.push('/admin/entreprises')
      }
    })
  }

  return (
    <button
      onClick={handleSupprimer}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded-lg border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/20 transition-colors disabled:opacity-50"
      title="Supprimer définitivement l'exploitation"
    >
      <Trash2 className="w-3.5 h-3.5" />
      {isPending ? 'Suppression...' : 'Supprimer'}
    </button>
  )
}

