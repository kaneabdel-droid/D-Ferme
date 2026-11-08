'use client'

import { useTransition } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { validerPaiementManuel, rejeterPaiementManuel } from './actions'

export default function ValiderPaiementButton({ paiementId }: { paiementId: string }) {
  const [isPending, startTransition] = useTransition()

  const handleValider = () => {
    if (!confirm('Confirmer et valider ce paiement ? Cela activera immédiatement le forfait pour cette exploitation.')) return
    startTransition(async () => {
      const res = await validerPaiementManuel(paiementId)
      if (res?.error) alert(`Erreur : ${res.error}`)
    })
  }

  const handleRejeter = () => {
    if (!confirm('Rejeter / annuler ce paiement ?')) return
    startTransition(async () => {
      const res = await rejeterPaiementManuel(paiementId)
      if (res?.error) alert(`Erreur : ${res.error}`)
    })
  }

  return (
    <div className="inline-flex items-center gap-1.5 justify-end">
      <button
        onClick={handleValider}
        disabled={isPending}
        className="inline-flex items-center gap-1 rounded bg-success/15 border border-success/30 px-2 py-1 text-[11px] font-bold text-success hover:bg-success/25 transition-colors disabled:opacity-50"
        title="Valider manuellement le paiement"
      >
        <CheckCircle2 className="w-3 h-3" />
        {isPending ? 'Validation...' : 'Valider'}
      </button>

      <button
        onClick={handleRejeter}
        disabled={isPending}
        className="inline-flex items-center gap-1 rounded bg-danger/10 border border-danger/20 px-2 py-1 text-[11px] font-semibold text-danger hover:bg-danger/20 transition-colors disabled:opacity-50"
        title="Rejeter ce paiement"
      >
        <XCircle className="w-3 h-3" />
      </button>
    </div>
  )
}
