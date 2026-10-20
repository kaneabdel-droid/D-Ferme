import Link from 'next/link'
import {
  Bird,
  Beef,
  ShieldAlert,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Sprout,
  Mail,
  Phone,
  MessageSquare,
  MapPin
} from 'lucide-react'
import ClientNavbar from '@/components/ClientNavbar'
import { getDictionary, getLocale } from '@/dictionaries'

export default async function LandingPage() {
  const locale = await getLocale()
  const dict = await getDictionary(locale)
  const lf = dict.landing_ferme || {}
  const hero = lf.hero || {}
  const pillars = lf.pillars || {}
  const pricing = lf.pricing || {}

  return (
    <div className="min-h-screen flex flex-col">
      <ClientNavbar dict={dict} currentLang={locale} />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28 bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-6">
              <Sprout className="w-4 h-4" /> {hero.badge || 'Plateforme Agro-Pastorale Intégrée'}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading tracking-tight mb-6">
              {hero.title_1 || 'Pilotez la performance et la rentabilité de votre '}<span className="text-primary">{hero.title_highlight || 'Ferme Intégrée'}</span>
            </h1>
            <p className="text-lg sm:text-xl text-foreground-muted mb-8 leading-relaxed">
              {hero.desc || 'Élevage multi-espèces (chair, ponte, bovins lait & viande, ovins) et volet végétal intégré (cultures maraîchères, fruitières et fourragères). Suivez vos cheptels, récoltes, stocks et marges en temps réel.'}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/signup?plan=medium"
                className="px-6 py-3.5 rounded-xl bg-primary text-white font-semibold shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all flex items-center gap-2"
              >
                {hero.cta_start || 'Commencer maintenant'} <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
              </Link>
              <Link
                href="/demo"
                className="px-6 py-3.5 rounded-xl border border-surface-border bg-surface font-semibold hover:border-primary text-foreground transition-all"
              >
                {hero.cta_demo || 'Découvrir la démo en direct'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Piliers Multi-espèces */}
      <section id="especes" className="py-16 bg-surface border-y border-surface-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-background border border-surface-border hover:border-primary transition-all">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Bird className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">{pillars.poultry_title || 'Aviculture (Chair & Ponte)'}</h3>
              <p className="text-sm text-foreground-muted leading-relaxed">
                {pillars.poultry_desc || 'Gestion par bande : taux de ponte, ramassage des œufs, pesées régulières, indice de consommation (IC) et contrôle des pertes.'}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-background border border-surface-border hover:border-primary transition-all">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary mb-4">
                <Beef className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">{pillars.cattle_title || 'Bovins (Lait & Viande)'}</h3>
              <p className="text-sm text-foreground-muted leading-relaxed">
                {pillars.cattle_desc || 'Suivi individuel par boucle auriculaire : lactation quotidienne, pesées, cycles de reproduction et rations alimentaires.'}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-background border border-surface-border hover:border-primary transition-all">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center text-warning mb-4">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">{pillars.health_title || 'Sécurité & Latence Médicale'}</h3>
              <p className="text-sm text-foreground-muted leading-relaxed">
                {pillars.health_desc || 'Calcul automatique des délais d’attente après traitement. Blocage visuel anti-vente d\'animaux en rémanence médicamenteuse.'}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-background border border-surface-border hover:border-primary transition-all">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center text-success mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">{pillars.finance_title || 'Marges & Rentabilité'}</h3>
              <p className="text-sm text-foreground-muted leading-relaxed">
                {pillars.finance_desc || 'Bilan financier automatisé par bande et par sujet : coût de revient au kilo, dépenses en intrants et bénéfice net réalisé.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Grille Tarifs */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold font-heading mb-4">{pricing.title || 'Des forfaits adaptés à chaque éleveur'}</h2>
            <p className="text-foreground-muted">{pricing.desc || 'Évoluez en toute sérénité avec des forfaits sans engagement.'}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Standard */}
            <div className="rounded-2xl bg-surface border border-surface-border p-8 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">{pricing.standard_title || 'Standard'}</h3>
                <p className="text-sm text-foreground-muted mb-6">{pricing.standard_desc || 'Idéal pour démarrer un atelier de production'}</p>
                <div className="text-3xl font-bold mb-6">
                  5 000 <span className="text-sm font-normal text-foreground-muted">{pricing.month || 'FCFA / mois'}</span>
                </div>
                <ul className="space-y-3 text-sm text-foreground-muted mb-8">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Suivi Bandes & Sujets</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Stocks d'aliments & médicaments</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Calendrier de prophylaxie</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Achats, ventes & mortalités</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Jusqu'à 3 utilisateurs</li>
                </ul>
              </div>
              <Link href="/signup?plan=standard" className="w-full py-2.5 rounded-xl border border-primary text-primary font-semibold text-center hover:bg-primary hover:text-white transition-all">
                {pricing.standard_btn || 'Choisir Standard'}
              </Link>
            </div>

            {/* Medium */}
            <div className="rounded-2xl bg-surface border-2 border-primary p-8 shadow-md relative flex flex-col justify-between">
              <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-primary text-white text-xs font-bold uppercase tracking-wider">
                {pricing.medium_badge || 'Recommandé'}
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">{pricing.medium_title || 'Médium'}</h3>
                <p className="text-sm text-foreground-muted mb-6">{pricing.medium_desc || 'Pour exploitations en croissance'}</p>
                <div className="text-3xl font-bold mb-6 text-primary">
                  10 000 <span className="text-sm font-normal text-foreground-muted">{pricing.month || 'FCFA / mois'}</span>
                </div>
                <ul className="space-y-3 text-sm text-foreground-muted mb-8">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Tout le forfait Standard</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Gestion des équipements & matériels</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Suivi des investissements</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Prévisions de production</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Jusqu'à 5 utilisateurs</li>
                </ul>
              </div>
              <Link href="/signup?plan=medium" className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold text-center hover:bg-primary-hover transition-all">
                {pricing.medium_btn || 'Choisir Médium'}
              </Link>
            </div>

            {/* Premium */}
            <div className="rounded-2xl bg-surface border border-surface-border p-8 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">{pricing.premium_title || 'Prémium'}</h3>
                <p className="text-sm text-foreground-muted mb-6">{pricing.premium_desc || 'Gestion financière & comptable intégrée'}</p>
                <div className="text-3xl font-bold mb-6">
                  15 000 <span className="text-sm font-normal text-foreground-muted">{pricing.month || 'FCFA / mois'}</span>
                </div>
                <ul className="space-y-3 text-sm text-foreground-muted mb-8">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Tout le forfait Médium</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Comptabilité complète & Trésorerie</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Ratios financiers & Marges réelles</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Exports PDF & Rapports d'analyse</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Jusqu'à 7 utilisateurs</li>
                </ul>
              </div>
              <Link href="/signup?plan=premium" className="w-full py-2.5 rounded-xl border border-surface-border text-foreground font-semibold text-center hover:border-primary hover:text-primary transition-all">
                {pricing.premium_btn || 'Choisir Prémium'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section Contact */}
      <section id="contact" className="py-20 bg-surface border-t border-surface-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
              <MessageSquare className="w-4 h-4" /> Support & Assistance
            </div>
            <h2 className="text-3xl font-bold font-heading mb-4 text-foreground">
              Contactez l&apos;équipe D-Ferme & Demba Solution
            </h2>
            <p className="text-foreground-muted max-w-xl mx-auto">
              Une question sur la plateforme, besoin d&apos;un accompagnement pour votre exploitation ou d&apos;une démonstration personnalisée ? Nos conseillers sont à votre disposition.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* WhatsApp Direct */}
            <a
              href="https://wa.me/221708484298?text=Bonjour,%20je%20souhaite%20des%20informations%20sur%20D-Elevage"
              target="_blank"
              rel="noopener noreferrer"
              className="p-6 rounded-2xl bg-background border border-surface-border hover:border-primary hover:shadow-md transition-all text-center flex flex-col items-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Phone className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-foreground text-base mb-1">WhatsApp & Téléphone</h3>
              <p className="text-xs text-foreground-muted mb-3">Réponse rapide 7j/7</p>
              <span className="font-semibold text-primary text-sm">+221 70 848 42 98</span>
            </a>

            {/* Email */}
            <a
              href="mailto:support@dembasolution.com"
              className="p-6 rounded-2xl bg-background border border-surface-border hover:border-primary hover:shadow-md transition-all text-center flex flex-col items-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-foreground text-base mb-1">E-mail Officiel</h3>
              <p className="text-xs text-foreground-muted mb-3">Support commercial et technique</p>
              <span className="font-semibold text-primary text-sm">support@dembasolution.com</span>
            </a>

            {/* Localisation */}
            <div className="p-6 rounded-2xl bg-background border border-surface-border text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-foreground text-base mb-1">Siège & Déploiement</h3>
              <p className="text-xs text-foreground-muted mb-3">Sénégal & Sous-région UEMOA</p>
              <span className="font-semibold text-foreground text-sm">Dakar, Sénégal</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-surface-border py-8 bg-surface">
        <div className="container mx-auto px-4 text-center text-sm text-foreground-muted">
          &copy; {new Date().getFullYear()} {lf.footer || 'D-Ferme — Une solution de la suite DEMBA SOLUTION. Tous droits réservés.'}
        </div>
      </footer>
    </div>
  )
}
