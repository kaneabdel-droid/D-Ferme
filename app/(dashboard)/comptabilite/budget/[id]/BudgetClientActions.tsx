'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Printer, Trash2, CheckCircle2, Archive, Play, Loader2 } from 'lucide-react'
import { supprimerLigneBudget, modifierStatutBudget, supprimerBudget } from '../actions'

export function ActionSupprimerLigne({ ligneId, budgetId }: { ligneId: string; budgetId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSupprimer = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette ligne de prévision budgétaire ?')) return
    setLoading(true)
    await supprimerLigneBudget(ligneId, budgetId)
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleSupprimer}
      disabled={loading}
      className="p-1 rounded-lg text-foreground-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
      title="Supprimer ce poste"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
    </button>
  )
}

export function ActionStatutBudget({ budgetId, statutActuel }: { budgetId: string; statutActuel: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleChangerStatut = async (nouveauStatut: string) => {
    setLoading(true)
    await modifierStatutBudget(budgetId, nouveauStatut)
    setLoading(false)
    router.refresh()
  }

  const handleSupprimerBudget = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement ce budget et l’ensemble de ses prévisions ?')) return
    setLoading(true)
    const res = await supprimerBudget(budgetId)
    setLoading(false)
    if (res.success) {
      router.push('/comptabilite/budget')
    }
  }

  return (
    <div className="flex items-center gap-2">
      {statutActuel === 'en_cours' ? (
        <button
          onClick={() => handleChangerStatut('cloture')}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-border text-xs font-semibold text-foreground hover:bg-black/5 cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Clôturer l'exercice</span>
        </button>
      ) : (
        <button
          onClick={() => handleChangerStatut('en_cours')}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-border text-xs font-semibold text-foreground hover:bg-black/5 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 text-primary" />
          <span>Rouvrir le budget</span>
        </button>
      )}

      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-border text-xs font-semibold text-foreground hover:bg-black/5 cursor-pointer print:hidden"
      >
        <Printer className="w-3.5 h-3.5 text-primary" />
        <span>Imprimer l'état</span>
      </button>

      <button
        onClick={handleSupprimerBudget}
        disabled={loading}
        className="p-1.5 rounded-xl text-foreground-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer print:hidden"
        title="Supprimer ce budget"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}
