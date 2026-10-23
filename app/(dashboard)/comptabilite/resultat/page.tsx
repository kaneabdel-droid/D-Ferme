import { getResultat } from '../actions'
import { getTenantContext } from '@/utils/supabase/tenant'
import PremiumLockView from '@/components/comptabilite/PremiumLockView'
import PrintSectionButton from '@/components/PrintSectionButton'
import { BarChart3, TrendingUp, TrendingDown, DollarSign, PieChart, ShieldAlert } from 'lucide-react'

export default async function ResultatPage() {
  const tenant = await getTenantContext()
  const isPremium = tenant?.subscriptionTier === 'premium'

  if (!isPremium) {
    return (
      <PremiumLockView
        titre="Compte de Résultat d'Exploitation (Produits / Charges)"
        description="Analysez en temps réel votre chiffre d'affaires agricole, votre marge brute sur aliments et intrants, et votre bénéfice net d'exploitation. Cette analyse financière est réservée aux abonnés Prémium."
      />
    )
  }

  const {
    produits,
    charges,
    totalProduits,
    totalCharges,
    achatsAppro,
    margeBrute,
    resultatNet,
  } = await getResultat()

  const formatCFA = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(val) + ' FCFA'

  const tauxMarge = totalProduits > 0 ? ((margeBrute / totalProduits) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-heading text-foreground">
              Compte de Résultat de l'Exploitation
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[11px] font-bold border border-emerald-500/20">
              SYSCOHADA Révisé
            </span>
          </div>
          <p className="text-xs text-foreground-muted mt-0.5">
            Performance économique : Chiffre d'affaires, marge brute agro-pastorale et résultat net d'exercice.
          </p>
        </div>
        <PrintSectionButton sectionId="resultat-print" label="Imprimer le Résultat" />
      </div>

      {/* Cartes KPI clés */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-surface rounded-2xl p-4 border border-surface-border shadow-sm">
          <span className="text-xs text-foreground-muted font-medium">Chiffre d'Affaires (Classe 7)</span>
          <p className="text-2xl font-bold text-foreground mt-1">{formatCFA(totalProduits)}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Ventes d'animaux, lait, œufs & récoltes</span>
        </div>

        <div className="bg-surface rounded-2xl p-4 border border-surface-border shadow-sm">
          <span className="text-xs text-foreground-muted font-medium">Achats Approvisionnements (60x)</span>
          <p className="text-2xl font-bold text-amber-500 mt-1">{formatCFA(achatsAppro || 0)}</p>
          <span className="text-[11px] text-foreground-muted">Poussins, aliments, semences, vaccins</span>
        </div>

        <div className="bg-surface rounded-2xl p-4 border border-surface-border shadow-sm">
          <span className="text-xs text-foreground-muted font-medium">Marge Brute d'Exploitation</span>
          <p className="text-2xl font-bold text-primary mt-1">{formatCFA(margeBrute)}</p>
          <span className="text-[11px] text-primary font-medium">Taux de marge brute : {tauxMarge}%</span>
        </div>

        <div className="bg-surface rounded-2xl p-4 border border-surface-border shadow-sm">
          <span className="text-xs text-foreground-muted font-medium">Résultat Net d'Exercice</span>
          <p
            className={`text-2xl font-bold mt-1 ${
              resultatNet >= 0 ? 'text-emerald-600' : 'text-rose-500'
            }`}
          >
            {formatCFA(resultatNet)}
          </p>
          <span className="text-[11px] font-medium flex items-center gap-1">
            {resultatNet >= 0 ? (
              <>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-bold">Bénéfice Net Réalisé</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-rose-500 font-bold">Perte Nette Constatée</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Grille Produits vs Charges */}
      <div id="resultat-print" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PRODUITS (Classe 7) */}
        <div className="bg-surface border border-surface-border rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 bg-emerald-500/10 border-b border-surface-border flex items-center justify-between">
              <h3 className="font-bold font-heading text-sm text-emerald-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> PRODUITS D'EXPLOITATION (Classe 7)
              </h3>
              <span className="font-bold text-emerald-600">{formatCFA(totalProduits)}</span>
            </div>

            <div className="divide-y divide-surface-border">
              {produits.length > 0 ? (
                produits.map((p) => {
                  const solde = p.soldeCrediteur - p.soldeDebiteur
                  return (
                    <div key={p.compte} className="px-5 py-3 flex items-center justify-between text-xs hover:bg-surface-border/20">
                      <div>
                        <span className="font-mono font-bold text-emerald-600 mr-2">{p.compte}</span>
                        <span className="font-medium text-foreground">{p.libelle}</span>
                      </div>
                      <span className="font-bold text-foreground font-mono">{formatCFA(solde)}</span>
                    </div>
                  )
                })
              ) : (
                <div className="p-8 text-center text-xs text-foreground-muted">
                  Aucun produit d'exploitation enregistré sur la période.
                </div>
              )}
            </div>
          </div>

          <div className="px-5 py-3.5 bg-background border-t border-surface-border flex justify-between items-center text-xs font-bold">
            <span>TOTAL DES REVENUS & PRODUITS :</span>
            <span className="text-emerald-600 font-mono text-sm">{formatCFA(totalProduits)}</span>
          </div>
        </div>

        {/* CHARGES (Classe 6) */}
        <div className="bg-surface border border-surface-border rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 bg-rose-500/10 border-b border-surface-border flex items-center justify-between">
              <h3 className="font-bold font-heading text-sm text-rose-600 flex items-center gap-2">
                <TrendingDown className="w-4 h-4" /> CHARGES D'EXPLOITATION (Classe 6)
              </h3>
              <span className="font-bold text-rose-600">{formatCFA(totalCharges)}</span>
            </div>

            <div className="divide-y divide-surface-border">
              {charges.length > 0 ? (
                charges.map((c) => {
                  const solde = c.soldeDebiteur - c.soldeCrediteur
                  return (
                    <div key={c.compte} className="px-5 py-3 flex items-center justify-between text-xs hover:bg-surface-border/20">
                      <div>
                        <span className="font-mono font-bold text-rose-500 mr-2">{c.compte}</span>
                        <span className="font-medium text-foreground">{c.libelle}</span>
                      </div>
                      <span className="font-bold text-foreground font-mono">{formatCFA(solde)}</span>
                    </div>
                  )
                })
              ) : (
                <div className="p-8 text-center text-xs text-foreground-muted">
                  Aucune charge d'exploitation enregistrée sur la période.
                </div>
              )}
            </div>
          </div>

          <div className="px-5 py-3.5 bg-background border-t border-surface-border flex justify-between items-center text-xs font-bold">
            <span>TOTAL DES CHARGES & FRAIS :</span>
            <span className="text-rose-500 font-mono text-sm">{formatCFA(totalCharges)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
