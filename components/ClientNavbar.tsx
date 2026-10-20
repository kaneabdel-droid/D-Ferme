'use client'

import Link from 'next/link'
import { Menu, X, Bird, Sparkles } from 'lucide-react'
import { useState } from 'react'
import LanguageSelector from '@/components/LanguageSelector'
import OfflineLandingBanner from './offline/OfflineLandingBanner'

export default function ClientNavbar({ dict, currentLang }: { dict?: any, currentLang: string }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const nav = dict?.landing_ferme?.nav || {}
  const brandName = dict?.landing_ferme?.brand || 'D-FERME'

  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-border bg-background/85 backdrop-blur-md">
      <OfflineLandingBanner appName="D-FERME" dashboardUrl="/dashboard" loginUrl="/login" />
      {/* Barre supérieure discrète vers Demba Solution */}
      <div className="border-b border-surface-border/60 bg-surface/80 text-xs py-1.5 px-4">
        <div className="container mx-auto flex items-center justify-between">
          <a
            href="https://dembasolution.com"
            title="Retour au portail Demba Solution"
            className="inline-flex items-center gap-1.5 font-medium text-foreground-muted hover:text-primary transition-colors"
          >
            ← <span className="font-semibold text-primary">Demba Solution</span>
            <span className="text-foreground-muted/70 hidden sm:inline">— Portail principal</span>
          </a>
          <span className="text-[11px] text-foreground-muted hidden md:inline">
            Gestion Agro-Pastorale Intégrée (Élevage & Cultures Végétales)
          </span>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo de marque D-FERME */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <span className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Bird className="w-5 h-5" />
            </span>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-bold font-heading text-primary leading-tight whitespace-nowrap">
                {brandName}
              </span>
              <span className="text-[10px] text-foreground-muted -mt-0.5 tracking-wider uppercase font-semibold hidden sm:inline whitespace-nowrap">
                Demba Solution
              </span>
            </div>
          </Link>

          {/* Navigation desktop (breakpoint lg pour éviter tout chevauchement) */}
          <nav className="hidden lg:flex gap-5 xl:gap-8 items-center shrink-0">
            <Link
              href="/#especes"
              className="text-sm font-medium text-foreground-muted hover:text-primary transition-colors whitespace-nowrap"
            >
              {nav.species || 'Espèces & Élevages'}
            </Link>
            <Link
              href="/tarifs"
              className="text-sm font-medium text-foreground-muted hover:text-primary transition-colors whitespace-nowrap"
            >
              {nav.pricing || 'Tarifs & Forfaits'}
            </Link>
            <Link
              href="/guide"
              className="text-sm font-medium text-foreground-muted hover:text-primary transition-colors whitespace-nowrap"
            >
              {nav.guide || "Guide d'utilisation"}
            </Link>
            <Link
              href="/demo"
              className="text-sm font-medium text-primary font-semibold hover:text-primary-hover transition-colors inline-flex items-center gap-1 whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" /> {nav.demo || 'Démo en direct'}
            </Link>
            <Link
              href="/#contact"
              className="text-sm font-medium text-foreground-muted hover:text-primary transition-colors whitespace-nowrap"
            >
              {nav.contact || 'Contact'}
            </Link>
          </nav>

          {/* Actions & sélecteur de langue */}
          <div className="flex gap-2 sm:gap-3 items-center shrink-0">
            <LanguageSelector currentLang={currentLang} />
            <Link
              href="/login"
              className="rounded-full border border-surface-border px-3.5 py-1.5 text-sm font-semibold text-foreground hover:border-primary hover:text-primary transition-all whitespace-nowrap"
            >
              {nav.login || 'Connexion'}
            </Link>
            <Link
              href="/signup?plan=medium&action=abonnement"
              className="hidden sm:inline-flex rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover transition-all whitespace-nowrap"
            >
              {nav.subscribe || "S'abonner"}
            </Link>
            <button
              type="button"
              className="lg:hidden p-2 text-foreground-muted hover:text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu de navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile rétractable */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-surface-border bg-background/95 backdrop-blur-md px-4 py-4 space-y-3">
          <a
            href="https://dembasolution.com"
            className="block text-sm font-medium text-primary pb-2 border-b border-surface-border/60"
          >
            ← Retour au portail Demba Solution
          </a>
          <Link
            href="/#especes"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-medium text-foreground hover:text-primary"
          >
            {nav.species || 'Espèces & Élevages'}
          </Link>
          <Link
            href="/tarifs"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-medium text-foreground hover:text-primary"
          >
            {nav.pricing || 'Tarifs & Forfaits'}
          </Link>
          <Link
            href="/guide"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-medium text-foreground hover:text-primary"
          >
            {nav.guide || "Guide d'utilisation"}
          </Link>
          <Link
            href="/demo"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-medium text-primary font-semibold"
          >
            {nav.demo || 'Démo en direct'}
          </Link>
          <Link
            href="/#contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-medium text-foreground hover:text-primary"
          >
            {nav.contact || 'Contact'}
          </Link>
          <div className="pt-3 border-t border-surface-border flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2 rounded-xl border border-surface-border font-semibold text-sm"
            >
              {nav.login || 'Connexion'}
            </Link>
            <Link
              href="/signup?plan=medium&action=abonnement"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2 rounded-xl bg-primary text-white font-semibold text-sm"
            >
              {nav.subscribe || "S'abonner"}
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
