'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CreditCard, Smartphone, Banknote, ArrowLeft, Clock, Building2, User, Phone, Mail, MapPin } from 'lucide-react'
import { initiateSubscriptionPayment } from './actions'
import { montantUsd } from '@/lib/payments/dollars'
import { FORFAITS_ELEVAGE, type TierElevage } from '@/lib/abonnements/tiers'

type MoyenPaiement = 'wave' | 'orange' | 'carte' | 'virement' | 'chariow' | 'maketou'

export default function CheckoutClient({
  initialPlan,
  initialPeriod = 'annuel',
  isLoggedIn,
  currentTier,
  isUpgrade,
  enDollars = false,
  hasOnlinePayment,
  entrepriseInfo,
  dict,
  locale,
}: {
  initialPlan: string
  initialPeriod?: 'annuel' | 'mensuel'
  isLoggedIn: boolean
  currentTier: string
  isUpgrade: boolean
  /** GIE d'un autre pays (devise « sans unité ») : paiement par carte en dollars US uniquement. */
  enDollars?: boolean
  hasOnlinePayment: { mobileMoney: boolean; carte: boolean; chariow: boolean; maketou: boolean }
  entrepriseInfo?: {
    nom: string
    responsable?: string
    telephone?: string
    email?: string
    adresse?: string
    code_pays?: string
    devise?: string
  }
  dict: any
  locale: string
}) {
  const d = dict.checkout_extra
  const localeCode = locale === 'fr' ? 'fr-FR' : 'en-US'

  // Chariow ne facture que le prix plein d'un forfait (produit préconfiguré dans sa
  // boutique) : jamais disponible pour un montant de proratisation d'upgrade.
  const chariowDisponible = hasOnlinePayment.chariow && !isUpgrade && !enDollars
  const maketouDisponible = hasOnlinePayment.maketou && !isUpgrade && !enDollars

  const availableMethods: MoyenPaiement[] = enDollars
    ? hasOnlinePayment.carte ? ['carte'] : []
    : [
        ...(hasOnlinePayment.mobileMoney ? (['wave'] as const) : []),
        ...(hasOnlinePayment.carte ? (['carte'] as const) : []),
        ...(chariowDisponible ? (['chariow'] as const) : []),
        ...(maketouDisponible ? (['maketou'] as const) : []),
        'virement',
      ]

  const router = useRouter()
  const [paymentMethod, setPaymentMethod] = useState<MoyenPaiement>(availableMethods[0])
  const [phoneLocal, setPhoneLocal] = useState(entrepriseInfo?.telephone || '')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [virementPending, setVirementPending] = useState(false)

  const [billingCycle, setBillingCycle] = useState<'annuel' | 'mensuel'>(initialPeriod)

  const planKey = (initialPlan in FORFAITS_ELEVAGE ? initialPlan : 'medium') as TierElevage
  const forfait = FORFAITS_ELEVAGE[planKey] || FORFAITS_ELEVAGE.medium
  const currentForfait = (currentTier in FORFAITS_ELEVAGE ? FORFAITS_ELEVAGE[currentTier as TierElevage] : FORFAITS_ELEVAGE.standard)

  const selectedBasePrice = billingCycle === 'annuel' ? forfait.prixAnnuelFcfa : forfait.prixMensuelFcfa
  const currentBasePrice = billingCycle === 'annuel' ? currentForfait.prixAnnuelFcfa : currentForfait.prixMensuelFcfa

  let numericPrice = selectedBasePrice
  if (isUpgrade) {
    numericPrice = selectedBasePrice - currentBasePrice
    if (numericPrice <= 0) numericPrice = selectedBasePrice
  }

  const formattedAmount = numericPrice.toLocaleString('fr-FR').replace(/\s/g, '.')
  const priceSuffix = billingCycle === 'annuel' ? 'an' : 'mois'
  let priceToPay = `${formattedAmount} FCFA / ${priceSuffix}`

  if (enDollars) {
    priceToPay = `${montantUsd(numericPrice).toLocaleString('en-US')} $`
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isLoggedIn) {
      // Pas de paiement réel avant la création du compte — l'inscription est gratuite
      // et le passage à un forfait payant se fait depuis /abonnement une fois connecté.
      router.push(`/signup?plan=${initialPlan}`)
      return
    }

    setError(null)
    setIsProcessing(true)

    if ((paymentMethod === 'chariow' || paymentMethod === 'maketou') && !phoneLocal.trim()) {
      setError(d.phone_required_error)
      setIsProcessing(false)
      return
    }

    const result = await initiateSubscriptionPayment(planKey, isUpgrade, paymentMethod, phoneLocal, billingCycle)

    setIsProcessing(false)

    if (!result.ok) {
      setError(typeof result.error === 'string' ? result.error : (typeof result.error === 'object' ? JSON.stringify(result.error) : 'Une erreur est survenue lors du paiement.'))
      return
    }

    if ('virement' in result) {
      setVirementPending(true)
      return
    }

    window.location.href = result.checkoutUrl
  }

  if (virementPending) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="bg-surface border border-surface-border p-8 rounded-2xl max-w-md w-full text-center shadow-lg">
          <Clock className="w-16 h-16 text-primary mx-auto mb-6" />
          <h2 className="text-2xl font-bold font-heading mb-2">{d.virement_saved_title}</h2>
          <p className="text-foreground-muted mb-6">
            {d.virement_saved_desc}
          </p>
          <Link href="/abonnement" className="text-primary font-semibold hover:text-primary-hover">
            {d.back_to_subscription}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/tarifs" className="text-foreground-muted hover:text-primary flex items-center gap-2 w-fit transition-colors">
            <ArrowLeft className="w-4 h-4" /> {d.back_offers}
          </Link>
        </div>

        <div className="bg-background border border-surface-border rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row">

          {/* Order Summary */}
          <div className="bg-primary/5 p-8 md:w-1/3 border-b md:border-b-0 md:border-r border-surface-border flex flex-col justify-between">
            <div className="space-y-6">
              <h2 className="text-xl font-bold font-heading">{d.order_summary}</h2>
              <div>
                <p className="text-sm text-foreground-muted">{d.subscription}</p>
                <p className="font-semibold text-lg text-foreground">{forfait.nom}</p>
                <p className="text-xs text-foreground-muted mt-1 leading-relaxed">{forfait.description}</p>
              </div>

              {/* Cycle de facturation */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-2">Période</p>
                <div className="grid grid-cols-2 gap-2 p-1 bg-surface rounded-xl border border-surface-border">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('annuel')}
                    className={`px-2.5 py-2 rounded-lg text-xs font-bold transition-all text-center ${
                      billingCycle === 'annuel'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    Annuel
                    <span className="block text-[10px] font-normal opacity-90">-17% (2 mois off.)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('mensuel')}
                    className={`px-2.5 py-2 rounded-lg text-xs font-bold transition-all text-center ${
                      billingCycle === 'mensuel'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    Mensuel
                    <span className="block text-[10px] font-normal opacity-90">Sans engag.</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-surface-border">
                <p className="text-sm text-foreground-muted mb-1">{d.total_ttc}</p>
                <p className="text-2xl font-bold text-primary tracking-tight">{priceToPay}</p>
                {billingCycle === 'annuel' && !enDollars && (
                  <p className="text-xs text-success font-medium mt-1">
                    Économie : {(forfait.prixMensuelFcfa * 12 - forfait.prixAnnuelFcfa).toLocaleString('fr-FR').replace(/\s/g, '.')} FCFA / an
                  </p>
                )}
              </div>

              {/* Entreprise & Payeur identifiés */}
              <div className="pt-4 border-t border-surface-border">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-2">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Exploitation & Payeur identifiés</span>
                </div>
                <div className="bg-surface p-3.5 rounded-xl border border-surface-border space-y-1.5 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-foreground-muted block">Exploitation facturée :</span>
                    <p className="font-bold text-foreground text-sm">
                      {entrepriseInfo?.nom || 'Mon Exploitation'}
                    </p>
                  </div>
                  {entrepriseInfo?.responsable && (
                    <div className="flex items-center gap-1.5 text-foreground-muted pt-1 border-t border-surface-border/50">
                      <User className="w-3 h-3 text-primary shrink-0" />
                      <span>Responsable : <strong className="text-foreground">{entrepriseInfo.responsable}</strong></span>
                    </div>
                  )}
                  {entrepriseInfo?.telephone && (
                    <div className="flex items-center gap-1.5 text-foreground-muted font-mono">
                      <Phone className="w-3 h-3 text-primary shrink-0" />
                      <span>{entrepriseInfo.telephone}</span>
                    </div>
                  )}
                  {entrepriseInfo?.email && (
                    <div className="flex items-center gap-1.5 text-foreground-muted truncate">
                      <Mail className="w-3 h-3 text-primary shrink-0" />
                      <span className="truncate">{entrepriseInfo.email}</span>
                    </div>
                  )}
                  {entrepriseInfo?.adresse && (
                    <div className="flex items-center gap-1.5 text-foreground-muted">
                      <MapPin className="w-3 h-3 text-primary shrink-0" />
                      <span>{entrepriseInfo.adresse}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="p-8 md:w-2/3">
            <h2 className="text-xl font-bold font-heading mb-6">{d.payment_method}</h2>

            {error && (
              <p className="mb-6 text-sm bg-danger/10 text-danger p-3 rounded-md">{error}</p>
            )}

            {enDollars && (
              <p className="mb-6 text-sm bg-surface border border-surface-border p-3 rounded-md">
                {availableMethods.length > 0 ? d.usd_card_only : d.card_unavailable}
              </p>
            )}

            <form onSubmit={handlePayment}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {hasOnlinePayment.mobileMoney && !enDollars && (
                  <label className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'wave' ? 'border-primary bg-primary/5' : 'border-surface-border bg-surface hover:bg-black/5'}`}>
                    <input type="radio" name="paymentMethod" value="wave" checked={paymentMethod === 'wave'} onChange={() => setPaymentMethod('wave')} className="sr-only" />
                    <Smartphone className={`w-8 h-8 mb-2 ${paymentMethod === 'wave' ? 'text-primary' : 'text-foreground-muted'}`} />
                    <span className={`font-semibold ${paymentMethod === 'wave' ? 'text-primary' : 'text-foreground'}`}>Mobile Money</span>
                  </label>
                )}

                {hasOnlinePayment.carte && (
                  <label className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'carte' ? 'border-primary bg-primary/5' : 'border-surface-border bg-surface hover:bg-black/5'}`}>
                    <input type="radio" name="paymentMethod" value="carte" checked={paymentMethod === 'carte'} onChange={() => setPaymentMethod('carte')} className="sr-only" />
                    <CreditCard className={`w-8 h-8 mb-2 ${paymentMethod === 'carte' ? 'text-primary' : 'text-foreground-muted'}`} />
                    <span className={`font-semibold ${paymentMethod === 'carte' ? 'text-primary' : 'text-foreground'}`}>{d.card}</span>
                  </label>
                )}

                {chariowDisponible && (
                  <label className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'chariow' ? 'border-primary bg-primary/5' : 'border-surface-border bg-surface hover:bg-black/5'}`}>
                    <input type="radio" name="paymentMethod" value="chariow" checked={paymentMethod === 'chariow'} onChange={() => setPaymentMethod('chariow')} className="sr-only" />
                    <Smartphone className={`w-8 h-8 mb-2 ${paymentMethod === 'chariow' ? 'text-primary' : 'text-foreground-muted'}`} />
                    <span className={`font-semibold ${paymentMethod === 'chariow' ? 'text-primary' : 'text-foreground'}`}>{d.mobile_money_chariow}</span>
                  </label>
                )}
                {maketouDisponible && (
                  <label className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'maketou' ? 'border-primary bg-primary/5' : 'border-surface-border bg-surface hover:bg-black/5'}`}>
                    <input type="radio" name="paymentMethod" value="maketou" checked={paymentMethod === 'maketou'} onChange={() => setPaymentMethod('maketou')} className="sr-only" />
                    <Smartphone className={`w-8 h-8 mb-2 ${paymentMethod === 'maketou' ? 'text-primary' : 'text-foreground-muted'}`} />
                    <span className={`font-semibold ${paymentMethod === 'maketou' ? 'text-primary' : 'text-foreground'}`}>Mobile Money (Maketou)</span>
                  </label>
                )}

                {!enDollars && (
                  <label className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'virement' ? 'border-primary bg-primary/5' : 'border-surface-border bg-surface hover:bg-black/5'}`}>
                    <input type="radio" name="paymentMethod" value="virement" checked={paymentMethod === 'virement'} onChange={() => setPaymentMethod('virement')} className="sr-only" />
                    <Banknote className={`w-8 h-8 mb-2 ${paymentMethod === 'virement' ? 'text-primary' : 'text-foreground-muted'}`} />
                    <span className={`font-semibold ${paymentMethod === 'virement' ? 'text-primary' : 'text-foreground'}`}>{d.transfer}</span>
                  </label>
                )}
              </div>

              {paymentMethod === 'virement' && (
                <div className="mb-8 bg-surface p-4 rounded-lg border border-surface-border">
                  <p className="text-sm text-foreground-muted mb-2">{d.transfer_instructions}</p>
                  <p className="font-mono font-semibold">SN048 08002 01057183001 43</p>
                  <p className="text-sm text-foreground-muted mt-2">{d.transfer_note}</p>
                </div>
              )}

              {(paymentMethod === 'chariow' || paymentMethod === 'maketou') && (
                <div className="mb-8">
                  <label htmlFor="phoneLocal" className="block text-sm font-medium text-foreground mb-2">{d.phone_label}</label>
                  <input
                    type="tel"
                    id="phoneLocal"
                    required
                    value={phoneLocal}
                    onChange={(e) => setPhoneLocal(e.target.value)}
                    placeholder={d.phone_placeholder}
                    className="w-full rounded-md border border-surface-border bg-surface px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              {(paymentMethod === 'wave' || paymentMethod === 'carte' || paymentMethod === 'chariow' || paymentMethod === 'maketou') && (
                <p className="mb-8 text-sm text-foreground-muted">
                  {d.redirect_notice_prefix} {paymentMethod === 'carte' ? d.redirect_notice_card : d.redirect_notice_mobile}.
                </p>
              )}

              <button
                type="submit"
                disabled={isProcessing || !paymentMethod}
                className="w-full bg-primary text-white font-bold py-4 px-8 rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>{d.processing}</>
                ) : !isLoggedIn ? (
                  <>{d.create_account_btn}</>
                ) : (
                  <>{d.pay_prefix} {enDollars ? priceToPay : `${formattedAmount} FCFA`}</>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
