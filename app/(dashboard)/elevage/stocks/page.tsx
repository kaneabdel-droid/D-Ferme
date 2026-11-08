import { createClient } from '@/utils/supabase/server'
import { getTenantContext } from '@/utils/supabase/tenant'
import { Boxes, AlertTriangle, ShieldAlert, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import CreerIntrantModal from './CreerIntrantModal'
import SaisirAchatModal from './SaisirAchatModal'
import { DEMO_INTRANTS } from '@/lib/demo-data'

import { getLocale, getDictionary } from '@/dictionaries'

export default async function StocksPage() {
  const tenant = await getTenantContext()
  const supabase = await createClient()
  const locale = await getLocale()
  const dict = await getDictionary(locale)
  const tStocks = dict.elevage?.stocks_page || {}

  const [
    { data: intrants },
    { data: categories }
  ] = await Promise.all([
    supabase
      .from('intrants')
      .select('*')
      .order('categorie')
      .order('nom'),
    supabase
      .from('categories_intrants')
      .select('code, nom')
      .order('nom')
  ])

  const isDemo = !intrants || intrants.length === 0
  const displayIntrants = isDemo ? (DEMO_INTRANTS as any[]) : intrants

  const alertesStock = displayIntrants?.filter((i) => i.stock_actuel <= i.stock_minimum) || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">
            {tStocks.title || "Aliments & Stocks d'Intrants"}
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            {tStocks.subtitle || "Gestion des approvisionnements en aliments de bétail, vaccins et produits vétérinaires."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SaisirAchatModal articles={displayIntrants} />
          <CreerIntrantModal categories={categories || []} />
        </div>
      </div>

      {/* Alerte stock faible */}
      {alertesStock.length > 0 && (
        <div className="rounded-2xl border border-warning/40 bg-warning/10 p-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-warning">
              Alerte de Rupture : {alertesStock.length} article(s) sous le seuil d'alerte
            </h4>
            <p className="text-xs text-foreground-muted mt-0.5">
              Pensez à renouveler vos commandes pour éviter les ruptures d'alimentation ou de traitement :{' '}
              <span className="font-semibold text-foreground">
                {alertesStock.map((a) => `${a.nom} (${a.stock_actuel} ${a.conditionnement || a.unite || 'sachet'})`).join(', ')}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Grille des articles */}
      <div className="rounded-2xl bg-surface border border-surface-border overflow-hidden shadow-sm">
        <div className="p-5 border-b border-surface-border flex items-center justify-between">
          <h3 className="font-bold font-heading text-foreground">Inventaire Complet des Articles</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-background border-b border-surface-border text-xs uppercase text-foreground-muted">
              <tr>
                <th className="py-3 px-4">Article</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4">Conditionnement</th>
                <th className="py-3 px-4">Stock Actuel</th>
                <th className="py-3 px-4">Seuil Min</th>
                <th className="py-3 px-4">Prix Unitaire</th>
                <th className="py-3 px-4">Délai Latence</th>
                <th className="py-3 px-4">Valeur Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {displayIntrants && displayIntrants.length > 0 ? (
                displayIntrants.map((i) => {
                  const estBas = i.stock_actuel <= i.stock_minimum
                  const valeurStock = i.stock_actuel * (i.prix_unitaire_moyen || 0)
                  const cond = (i.conditionnement || i.unite || 'sachet').toLowerCase()

                  return (
                    <tr key={i.id} className="hover:bg-black/5">
                      <td className="py-3 px-4 font-semibold text-foreground">{i.nom}</td>
                      <td className="py-3 px-4 capitalize text-foreground-muted">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-black/5">
                          {i.categorie.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                          cond === 'sachet'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-primary/10 text-primary border border-primary/20'
                        }`}>
                          {cond === 'sachet' ? 'Sachet' : cond.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold">
                        <span className={estBas ? 'text-danger' : 'text-foreground'}>
                          {i.stock_actuel} {i.conditionnement || i.unite || 'sachet'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-foreground-muted">
                        {i.stock_minimum} {i.conditionnement || i.unite || 'sachet'}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {Number(i.prix_unitaire_moyen || 0).toLocaleString('fr-FR')} {tenant?.devise || 'FCFA'}
                      </td>
                      <td className="py-3 px-4">
                        {i.latence_jours_defaut > 0 ? (
                          <span className="text-xs font-bold text-danger px-2 py-0.5 rounded-full bg-danger/10">
                            {i.latence_jours_defaut} jours
                          </span>
                        ) : (
                          <span className="text-xs text-foreground-muted">0 j</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-primary">
                        {valeurStock.toLocaleString('fr-FR')} {tenant?.devise || 'FCFA'}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-foreground-muted">
                    Aucun article en stock enregistré.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
