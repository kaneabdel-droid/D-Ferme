import { getBilan } from '../actions'
import { getTenantContext } from '@/utils/supabase/tenant'
import PremiumLockView from '@/components/comptabilite/PremiumLockView'
import PrintSectionButton from '@/components/PrintSectionButton'
import { FileSpreadsheet, CheckCircle2, AlertTriangle, Building2, Landmark, Boxes, Wallet } from 'lucide-react'

export default async function BilanPage() {
  const tenant = await getTenantContext()
  const isPremium = tenant?.subscriptionTier === 'premium'

  if (!isPremium) {
    return (
      <PremiumLockView
        titre="Bilan Comptable Agro-Pastoral (Actif / Passif)"
        description="Le Bilan annuel certifié SYSCOHADA permet de valoriser les actifs de votre ferme (terres, bâtiments, cheptel reproducteur et trésorerie) face à vos capitaux et dettes. Cette fonctionnalité est exclusive au forfait Prémium."
      />
    )
  }

  const { actif, passif, equilibre } = await getBilan()

  const formatCFA = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(val) + ' FCFA'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-heading text-foreground">
              Bilan Comptable d'Exploitation
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[11px] font-bold border border-amber-500/20">
              SYSCOHADA Révisé
            </span>
          </div>
          <p className="text-xs text-foreground-muted mt-0.5">
            Photographie patrimoniale : Actifs (biens & créances) et Passifs (capitaux & engagements).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border ${
              equilibre
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
            }`}
          >
            {equilibre ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Bilan Parfaitement Équilibré (Actif = Passif)</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Écart d'Équilibre : {formatCFA(Math.abs(actif.total - passif.total))}</span>
              </>
            )}
          </div>
          <PrintSectionButton sectionId="bilan-print" label="Imprimer le Bilan" />
        </div>
      </div>

      {/* Cartes Totaux Actif vs Passif */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-surface rounded-2xl p-5 border border-surface-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-foreground-muted font-bold uppercase tracking-wider">TOTAL ACTIF (Emplois)</span>
            <p className="text-3xl font-black text-primary mt-1">{formatCFA(actif.total)}</p>
            <span className="text-[11px] text-foreground-muted">Immobilisations + Stocks + Trésorerie</span>
          </div>
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <Building2 className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-5 border border-surface-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-foreground-muted font-bold uppercase tracking-wider">TOTAL PASSIF (Ressources)</span>
            <p className="text-3xl font-black text-secondary mt-1">{formatCFA(passif.total)}</p>
            <span className="text-[11px] text-foreground-muted">Capitaux propres + Dettes & Emprunts</span>
          </div>
          <div className="p-3 rounded-2xl bg-secondary/10 text-secondary">
            <Landmark className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Grille Bilan à deux colonnes Actif / Passif */}
      <div id="bilan-print" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLONNE GAUCHE : ACTIF */}
        <div className="bg-surface border border-surface-border rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 bg-primary/10 border-b border-surface-border flex items-center justify-between">
              <h3 className="font-bold font-heading text-sm text-primary flex items-center gap-2">
                <Building2 className="w-4 h-4" /> ACTIF (Patrimoine & Avoirs)
              </h3>
              <span className="font-black text-primary text-sm">{formatCFA(actif.total)}</span>
            </div>

            <div className="p-4 space-y-5">
              {/* Actif Immobilisé */}
              <div>
                <h4 className="text-xs font-bold uppercase text-foreground-muted tracking-wider mb-2 flex items-center gap-1.5">
                  1. Actif Immobilisé (Terres, Bâtiments, Cheptel reproducteur)
                </h4>
                {actif.immobilise.length > 0 ? (
                  <div className="space-y-1.5">
                    {actif.immobilise.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs p-2 rounded-lg bg-background border border-surface-border/50">
                        <span>
                          <span className="font-mono font-bold text-primary mr-1.5">{item.compte}</span>
                          {item.libelle}
                        </span>
                        <span className="font-bold text-foreground">{formatCFA(item.montant)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-foreground-muted italic p-2 bg-background/50 rounded-lg">Aucune immobilisation enregistrée (comptes 2xx)</p>
                )}
              </div>

              {/* Actif Circulant */}
              <div>
                <h4 className="text-xs font-bold uppercase text-foreground-muted tracking-wider mb-2 flex items-center gap-1.5">
                  2. Actif Circulant (Stocks de bétail, récoltes, semences & créances)
                </h4>
                {actif.circulant.length > 0 ? (
                  <div className="space-y-1.5">
                    {actif.circulant.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs p-2 rounded-lg bg-background border border-surface-border/50">
                        <span>
                          <span className="font-mono font-bold text-emerald-600 mr-1.5">{item.compte}</span>
                          {item.libelle}
                        </span>
                        <span className="font-bold text-foreground">{formatCFA(item.montant)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-foreground-muted italic p-2 bg-background/50 rounded-lg">Aucun stock ou créance (comptes 3xx / 411)</p>
                )}
              </div>

              {/* Trésorerie Actif */}
              <div>
                <h4 className="text-xs font-bold uppercase text-foreground-muted tracking-wider mb-2 flex items-center gap-1.5">
                  3. Trésorerie Actif (Banque, Caisse, Mobile Money)
                </h4>
                {actif.tresorerie.length > 0 ? (
                  <div className="space-y-1.5">
                    {actif.tresorerie.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs p-2 rounded-lg bg-background border border-surface-border/50">
                        <span>
                          <span className="font-mono font-bold text-secondary mr-1.5">{item.compte}</span>
                          {item.libelle}
                        </span>
                        <span className="font-bold text-foreground">{formatCFA(item.montant)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-foreground-muted italic p-2 bg-background/50 rounded-lg">Aucun solde de trésorerie (comptes 5xx)</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-background border-t border-surface-border flex justify-between items-center font-bold text-sm">
            <span>TOTAL DE L'ACTIF :</span>
            <span className="text-primary font-black text-base">{formatCFA(actif.total)}</span>
          </div>
        </div>

        {/* COLONNE DROITE : PASSIF */}
        <div className="bg-surface border border-surface-border rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 bg-secondary/10 border-b border-surface-border flex items-center justify-between">
              <h3 className="font-bold font-heading text-sm text-secondary flex items-center gap-2">
                <Landmark className="w-4 h-4" /> PASSIF (Capitaux & Engagements)
              </h3>
              <span className="font-black text-secondary text-sm">{formatCFA(passif.total)}</span>
            </div>

            <div className="p-4 space-y-5">
              {/* Capitaux Propres */}
              <div>
                <h4 className="text-xs font-bold uppercase text-foreground-muted tracking-wider mb-2 flex items-center gap-1.5">
                  1. Capitaux Propres & Résultat d'Exercice
                </h4>
                {passif.capitaux.length > 0 ? (
                  <div className="space-y-1.5">
                    {passif.capitaux.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs p-2 rounded-lg bg-background border border-surface-border/50">
                        <span>
                          <span className="font-mono font-bold text-secondary mr-1.5">{item.compte}</span>
                          {item.libelle}
                        </span>
                        <span className={`font-bold ${item.montant < 0 ? 'text-danger' : 'text-foreground'}`}>
                          {formatCFA(item.montant)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-foreground-muted italic p-2 bg-background/50 rounded-lg">Aucun apport en capital enregistré (compte 101)</p>
                )}
              </div>

              {/* Dettes & Engagements */}
              <div>
                <h4 className="text-xs font-bold uppercase text-foreground-muted tracking-wider mb-2 flex items-center gap-1.5">
                  2. Dettes Financières & Dettes d'Exploitation (Fournisseurs, Crédits)
                </h4>
                {passif.dettes.length > 0 ? (
                  <div className="space-y-1.5">
                    {passif.dettes.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs p-2 rounded-lg bg-background border border-surface-border/50">
                        <span>
                          <span className="font-mono font-bold text-amber-600 mr-1.5">{item.compte}</span>
                          {item.libelle}
                        </span>
                        <span className="font-bold text-foreground">{formatCFA(item.montant)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-foreground-muted italic p-2 bg-background/50 rounded-lg">Aucune dette bancaire ou fournisseur en cours</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-background border-t border-surface-border flex justify-between items-center font-bold text-sm">
            <span>TOTAL DU PASSIF :</span>
            <span className="text-secondary font-black text-base">{formatCFA(passif.total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
