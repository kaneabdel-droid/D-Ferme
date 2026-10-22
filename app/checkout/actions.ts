'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { initiateBictorysPayment } from '@/lib/payments/bictorys'
import { initiateMonerooPayment } from '@/lib/payments/moneroo'
import { initiateChariowPayment } from '@/lib/payments/chariow'
import { initiateMaketouPayment } from '@/lib/payments/maketou'
import { siteUrl } from '@/lib/payments/config'
import { montantUsd } from '@/lib/payments/dollars'
import { FORFAITS_ELEVAGE, type TierElevage } from '@/lib/abonnements/tiers'

type MoyenPaiement = 'wave' | 'orange' | 'carte' | 'virement' | 'chariow' | 'maketou'

type InitiateResult =
  | { ok: true; checkoutUrl: string }
  | { ok: true; virement: true; paymentId: string }
  | { ok: false; error: string }

const MAKETOU_FALLBACK_PRODUCTS: Record<number, string> = {
  5000: 'c62a2efe-c38b-4883-a7c3-3ffe834c272c',
  10000: 'b420f58e-b974-4f38-a0bf-e8be98926294',
  15000: '03dea104-421f-4f00-823c-167893fe3c6b',
  50000: '81245501-b96e-4ac9-be2e-2c77fd5a9a6d',
  100000: '749c1b0c-6cf8-45cc-96b4-bc4e9645d482',
  150000: '00941762-413f-445a-8ca5-49d57f1b429b',
}

const CHARIOW_FALLBACK_PRODUCTS: Record<number, string> = {
  5000: 'prod_elevage_standard_mensuel',
  10000: 'prod_elevage_medium_mensuel',
  15000: 'prod_elevage_premium_mensuel',
  50000: 'prod_elevage_standard_annuel',
  100000: 'prod_elevage_medium_annuel',
  150000: 'prod_elevage_premium_annuel',
}

export async function initiateSubscriptionPayment(
  planId: string,
  isUpgrade: boolean,
  moyenPaiement: MoyenPaiement,
  phoneLocal?: string,
  billingCycle: 'annuel' | 'mensuel' = 'annuel'
): Promise<InitiateResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Non authentifié' }
  }

  if (moyenPaiement === 'chariow' && isUpgrade) {
    // Chariow facture le prix d'un produit préconfiguré dans sa boutique, jamais un
    // montant libre — inutilisable pour un montant de proratisation arbitraire.
    return { ok: false, error: "Chariow n'est disponible que pour un forfait à prix plein" }
  }

  const admin = createAdminClient()

  const { data: userData } = await admin
    .from('utilisateurs')
    .select('entreprise_id, entreprises(nom, subscription_tier, devise, code_pays)')
    .eq('id', user.id)
    .maybeSingle()

  if (!userData?.entreprise_id) {
    return { ok: false, error: 'Exploitation introuvable' }
  }

  const entreprise = Array.isArray(userData.entreprises) ? userData.entreprises[0] : userData.entreprises
  const currentTier = entreprise?.subscription_tier || 'standard'
  const enDollars = entreprise?.devise === 'USD'
  if (enDollars && moyenPaiement !== 'carte') {
    return { ok: false, error: 'Depuis votre pays, l’abonnement se paie par carte bancaire en dollars US' }
  }

  // Tarifs : lecture base avec repli sur FORFAITS_ELEVAGE
  const { data: tarifs } = await admin
    .from('tarif_abonnement')
    .select('niveau, prix_annuel, prix_mensuel')
    .in('niveau', [planId, currentTier])

  const selectedTarif = tarifs?.find((t) => t.niveau === planId)
  const currentTarif = tarifs?.find((t) => t.niveau === currentTier)

  const fallbackSelected = FORFAITS_ELEVAGE[planId as TierElevage]
  const fallbackCurrent = FORFAITS_ELEVAGE[currentTier as TierElevage]

  if (!selectedTarif && !fallbackSelected) {
    return { ok: false, error: 'Forfait inconnu' }
  }

  const getPrice = (tDb?: { prix_annuel?: number; prix_mensuel?: number }, fallback?: typeof fallbackSelected) => {
    if (billingCycle === 'mensuel') {
      return Number(tDb?.prix_mensuel) || fallback?.prixMensuelFcfa || 10000
    }
    return Number(tDb?.prix_annuel) || fallback?.prixAnnuelFcfa || 100000
  }

  const selectedPrice = getPrice(selectedTarif, fallbackSelected)
  const currentPrice = getPrice(currentTarif, fallbackCurrent)

  let montant = selectedPrice
  if (isUpgrade) {
    montant = selectedPrice - currentPrice
    if (montant <= 0) montant = selectedPrice
  }
  const devise = enDollars ? 'USD' : 'XOF'
  if (enDollars) montant = montantUsd(montant)

  const provider = moyenPaiement === 'carte' ? 'moneroo' : moyenPaiement === 'virement' ? 'virement' : moyenPaiement === 'chariow' ? 'chariow' : moyenPaiement === 'maketou' ? 'maketou' : 'bictorys'

  let chariowProductId: string | null = null
  if (provider === 'chariow') {
    // chariow_produits n'a aucune policy RLS publique (config admin) : lecture via le client admin.
    const { data: produit } = await createAdminClient()
      .from('chariow_produits')
      .select('product_id')
      .eq('montant', montant)
      .maybeSingle()
    chariowProductId = produit?.product_id || CHARIOW_FALLBACK_PRODUCTS[montant] || process.env.CHARIOW_PRODUCT_ID || null
    if (!chariowProductId) {
      return { ok: false, error: "Chariow n'est pas configuré pour ce montant" }
    }
  }
  let maketouProductId: string | null = null
  if (provider === 'maketou') {
    const { data: produit } = await createAdminClient()
      .from('maketou_produits')
      .select('product_id')
      .eq('montant', montant)
      .maybeSingle()
    maketouProductId = produit?.product_id || process.env.MAKETOU_PRODUCT_ID || MAKETOU_FALLBACK_PRODUCTS[montant] || 'prod_elevage_medium_annuel'
    if (!maketouProductId) {
      return { ok: false, error: "Maketou n'est pas configuré pour ce montant" }
    }
  }

  // Anti double paiement (1/2) : un forfait déjà réglé ne se paie pas une seconde fois
  // (D-PHARMA n'a pas d'échéance : un paiement vaut pour le forfait tant qu'il est actif).
  if (planId === currentTier) {
    const { count } = await supabase
      .from('abonnement_paiements')
      .select('id', { count: 'exact', head: true })
      .eq('gie_id', userData.entreprise_id)
      .eq('niveau', planId)
      .eq('statut', 'completed')
      .eq('doublon', false)
    if (count) {
      return { ok: false, error: `Votre exploitation est déjà abonnée au forfait ${planId} : aucun nouveau paiement n'est nécessaire.` }
    }
  }

  // Anti double paiement (2/2) : relancer la même offre renvoie vers le paiement déjà
  // ouvert au lieu d'en créer un second (double clic, second onglet, retour arrière).
  const reutilisable = await paiementEnCoursReutilisable(admin, userData.entreprise_id, planId, moyenPaiement, montant)
  if (reutilisable) return reutilisable

  const { data: payment, error: insertError } = await admin
    .from('abonnement_paiements')
    .insert({
      gie_id: userData.entreprise_id,
      entreprise_id: userData.entreprise_id,
      niveau: planId,
      montant,
      provider,
      moyen_paiement: moyenPaiement,
      devise,
      statut: 'pending',
    })
    .select('id')
    .single()

  if (insertError || !payment) {
    if (insertError?.code === '23505') {
      const concurrent = await paiementEnCoursReutilisable(admin, userData.entreprise_id, planId, moyenPaiement, montant)
      if (concurrent) return concurrent
      return { ok: false, error: 'Un paiement est déjà en cours pour votre exploitation. Patientez quelques secondes puis réessayez.' }
    }
    console.error('Erreur création paiement abonnement', insertError)
    return { ok: false, error: insertError?.message || "Impossible d'initier le paiement" }
  }

  if (moyenPaiement === 'virement') {
    return { ok: true, virement: true, paymentId: payment.id }
  }

  const returnUrl = `${siteUrl}/checkout/retour?ref=${payment.id}`
  const description = `Abonnement D-ÉLEVAGE — forfait ${planId}`

  const result =
    provider === 'moneroo'
      ? await initiateMonerooPayment({
          amount: montant,
          currency: devise,
          description,
          reference: payment.id,
          returnUrl,
          cancelUrl: returnUrl,
          customerEmail: user.email || '',
        })
      : provider === 'chariow'
        ? await initiateChariowPayment({
            productId: chariowProductId!,
            montantAttendu: montant,
            reference: payment.id,
            phoneLocal: phoneLocal || '',
            countryCode: entreprise?.code_pays && entreprise.code_pays !== 'AUTRE' ? entreprise.code_pays : 'SN',
            customerEmail: user.email || '',
            returnUrl,
          })
        : provider === 'maketou'
          ? await initiateMaketouPayment({
              productId: maketouProductId!,
              reference: payment.id,
              phoneLocal: phoneLocal || '',
              countryCode: entreprise?.code_pays && entreprise.code_pays !== 'AUTRE' ? entreprise.code_pays : 'SN',
              customerEmail: user.email || '',
              customerName: entreprise?.nom || 'Mon Exploitation',
              returnUrl,
              montantAttendu: montant,
            })
        : await initiateBictorysPayment({
            amount: montant,
            currency: 'XOF',
            description,
            reference: payment.id,
            returnUrl,
            cancelUrl: returnUrl,
            customerEmail: user.email || '',
          })

  if (!result.ok) {
    await admin.from('abonnement_paiements').update({ statut: 'failed' }).eq('id', payment.id)
    return { ok: false, error: result.error }
  }

  await admin
    .from('abonnement_paiements')
    .update({ provider_reference: result.providerTransactionId, checkout_url: result.checkoutUrl })
    .eq('id', payment.id)

  return { ok: true, checkoutUrl: result.checkoutUrl }
}

// Au-delà, une page de paiement prestataire est considérée expirée : on en ouvre une nouvelle.
const DUREE_REUTILISATION_MS = 30 * 60 * 1000

/**
 * Paiement en cours du GIE (au plus un, cf. index unique de la migration 36) :
 * - même offre (forfait, moyen, montant) et encore récent → on le renvoie tel quel ;
 * - sinon il est marqué abandonné (il reste 'pending' : s'il est payé plus tard,
 *   le webhook le traite et le marque doublon si besoin) et on laisse en créer un neuf.
 */
async function paiementEnCoursReutilisable(
  supabase: any,
  gieId: string,
  niveau: string,
  moyenPaiement: MoyenPaiement,
  montant: number
): Promise<InitiateResult | null> {
  const { data: enCours } = await supabase
    .from('abonnement_paiements')
    .select('id, niveau, moyen_paiement, montant, checkout_url, created_at')
    .eq('gie_id', gieId)
    .eq('statut', 'pending')
    .is('abandonne_le', null)
    .maybeSingle()

  if (!enCours) return null

  const memeOffre = enCours.niveau === niveau && enCours.moyen_paiement === moyenPaiement && Number(enCours.montant) === montant
  if (memeOffre && moyenPaiement === 'virement') {
    // Virement déjà déclaré pour cette offre : il attend la confirmation de réception des fonds.
    return { ok: true, virement: true, paymentId: enCours.id }
  }
  const recent = enCours.created_at && Date.now() - new Date(enCours.created_at).getTime() < DUREE_REUTILISATION_MS
  if (memeOffre && recent && enCours.checkout_url) {
    return { ok: true, checkoutUrl: enCours.checkout_url }
  }

  await supabase
    .from('abonnement_paiements')
    .update({ abandonne_le: new Date().toISOString() })
    .eq('id', enCours.id)
  return null
}
