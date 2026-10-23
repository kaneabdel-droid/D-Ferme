'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LanguageSelector from '@/components/LanguageSelector'
import { OfflineSyncBar } from '@/components/offline/OfflineSyncBar'
import { 
  LayoutDashboard, 
  Menu,
  X,
  LogOut,
  LifeBuoy,
  Shield,
  Settings,
  Boxes,
  Activity,
  DollarSign,
  Bird,
  Beef,
  ShieldAlert,
  Warehouse,
  Sprout,
  Wheat,
  Apple,
  Store,
  Layers,
  Crown,
  UploadCloud,
  BookOpen,
  FileSpreadsheet,
  BarChart3,
  Scale,
  Database
} from 'lucide-react'
import { DeviseProvider } from '@/components/DeviseProvider'

type NavItem = {
  key: string
  label: string
  href: string
  icon: any
  isPremiumLocked?: boolean
}

type MenuSection = {
  titre: string
  isPremiumOnly?: boolean
  items: NavItem[]
}

export default function ClientLayout({
  children,
  subscriptionTier = 'standard',
  role,
  permissions,
  entrepriseNom,
  devise = 'FCFA',
  typesActivite = ['volaille', 'ruminants', 'lait', 'production_vegetale'],
  menuLayout = 'sidebar',
  dict,
  locale
}: {
  children: React.ReactNode
  subscriptionTier: string
  role: string
  permissions: any
  entrepriseNom: string
  devise?: string
  typesActivite?: string[]
  menuLayout?: 'sidebar' | 'horizontal'
  dict: any
  locale: string
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [menuOuvert, setMenuOuvert] = useState<string | null>(null)
  const navHorizontalRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    // S'assurer que le cookie hors-ligne est actif pour le Service Worker
    document.cookie = 'demba_offline_active=1; path=/; max-age=2592000; SameSite=Lax'

    // Si en ligne, rafraîchir en tâche de fond le shell du dashboard
    if (typeof navigator !== 'undefined' && navigator.onLine && 'caches' in window) {
      caches.open('demba-offline-dferme-v3').then((cache) => {
        fetch('/dashboard').then((res) => {
          if (res && res.ok) cache.put('/dashboard', res)
        }).catch(() => {})
      }).catch(() => {})
    }
  }, [])

  const isPremium = subscriptionTier === 'premium'
  const aVolaille = typesActivite.includes('volaille')
  const aRuminants = typesActivite.includes('ruminants')
  const aLait = typesActivite.includes('lait')
  const aVegetal = typesActivite.includes('production_vegetale')

  // Catégories de navigation structurées
  const menuSections: MenuSection[] = [
    {
      titre: dict.sidebar?.section_pilotage || 'Pilotage',
      items: [
        { 
          key: 'dashboard', 
          label: dict.sidebar?.dashboard || 'Tableau de bord', 
          href: '/dashboard', 
          icon: LayoutDashboard 
        },
      ],
    },
    ...(aVegetal ? [{
      titre: dict.sidebar?.section_vegetal || 'Volet Végétal',
      isPremiumOnly: true,
      items: [
        { 
          key: 'vegetal_parcelles', 
          label: dict.sidebar?.parcelles || 'Cultures & Parcelles', 
          href: '/vegetal', 
          icon: Sprout,
          isPremiumLocked: !isPremium
        },
        { 
          key: 'vegetal_recoltes', 
          label: dict.sidebar?.recoltes || 'Récoltes & Productions', 
          href: '/vegetal?tab=recoltes', 
          icon: Wheat,
          isPremiumLocked: !isPremium
        },
        { 
          key: 'vegetal_stocks', 
          label: dict.sidebar?.stocks_vegetaux || 'Stocks Végétaux', 
          href: '/vegetal?tab=stocks', 
          icon: Apple,
          isPremiumLocked: !isPremium
        },
        { 
          key: 'vegetal_ventes', 
          label: dict.sidebar?.ventes_vegetales || 'Ventes Végétales', 
          href: '/vegetal?tab=ventes', 
          icon: Store,
          isPremiumLocked: !isPremium
        },
      ],
    }] : []),
    ...((aVolaille || aRuminants || aLait) ? [{
      titre: dict.sidebar?.section_elevage || 'Élevage & Cheptel',
      items: [
        ...(aVolaille ? [{ 
          key: 'bandes', 
          label: dict.sidebar?.bandes || 'Bandes & Volailles', 
          href: '/elevage/bandes', 
          icon: Bird 
        }] : []),
        ...(aRuminants ? [{ 
          key: 'animaux', 
          label: dict.sidebar?.animaux || 'Bovins & Ruminants', 
          href: '/elevage/animaux', 
          icon: Beef 
        }] : []),
        { 
          key: 'suivi', 
          label: dict.sidebar?.suivi || 'Suivi Quotidien', 
          href: '/elevage/suivi', 
          icon: Activity 
        },
        { 
          key: 'prophylaxie', 
          label: dict.sidebar?.sanitaire || 'Santé & Latence', 
          href: '/elevage/sanitaire', 
          icon: ShieldAlert 
        },
        { 
          key: 'batiments', 
          label: dict.sidebar?.batiments || 'Bâtiments & Enclos', 
          href: '/elevage/batiments', 
          icon: Warehouse 
        },
      ],
    }] : []),
    {
      titre: dict.sidebar?.section_stocks_finances || 'Stocks & Finances',
      items: [
        { 
          key: 'intrants', 
          label: dict.sidebar?.stocks || 'Aliments & Intrants', 
          href: '/elevage/stocks', 
          icon: Boxes 
        },
        { 
          key: 'finances', 
          label: dict.sidebar?.finances || 'Finances & Marges', 
          href: '/elevage/finances', 
          icon: DollarSign 
        },
      ],
    },
    {
      titre: 'Comptabilité & Trésorerie',
      items: [
        { 
          key: 'journaux', 
          label: 'Journaux de Saisie', 
          href: '/comptabilite', 
          icon: BookOpen 
        },
        { 
          key: 'bilan', 
          label: 'Bilan Comptable', 
          href: '/comptabilite/bilan', 
          icon: FileSpreadsheet,
          isPremiumLocked: !isPremium
        },
        { 
          key: 'resultat', 
          label: 'Compte de Résultat', 
          href: '/comptabilite/resultat', 
          icon: BarChart3,
          isPremiumLocked: !isPremium
        },
        { 
          key: 'balance', 
          label: 'Grand Livre & Balance', 
          href: '/comptabilite/balance', 
          icon: Scale,
          isPremiumLocked: !isPremium
        },
        { 
          key: 'plan_comptable', 
          label: 'Plan Comptable SYSCOHADA', 
          href: '/comptabilite/plan-comptable', 
          icon: BookOpen 
        },
      ],
    },
    {
      titre: dict.sidebar?.section_admin || 'Administration',
      items: [
        { 
          key: 'referentiel', 
          label: 'Référentiel Espèces & Intrants', 
          href: '/parametres/referentiel', 
          icon: Database 
        },
        { 
          key: 'import_donnees', 
          label: dict.sidebar?.import_donnees || 'Importer des données', 
          href: '/parametres/import', 
          icon: UploadCloud 
        },
        { 
          key: 'parametres', 
          label: dict.sidebar?.parametres || 'Paramètres Ferme', 
          href: '/parametres', 
          icon: Settings 
        },
        { 
          key: 'abonnement', 
          label: dict.sidebar?.abonnement || 'Abonnement', 
          href: '/abonnement', 
          icon: Shield 
        },
        { 
          key: 'support', 
          label: dict.sidebar?.support || 'Aide & Support', 
          href: '/support', 
          icon: LifeBuoy 
        },
      ],
    },
  ]

  // Liste plate pour la sidebar
  const flatNavigation = menuSections.flatMap(section => section.items)

  useEffect(() => {
    setSidebarOpen(false)
    setMenuOuvert(null)
  }, [pathname])

  useEffect(() => {
    function handleClickDehors(event: MouseEvent) {
      if (navHorizontalRef.current && !navHorizontalRef.current.contains(event.target as Node)) {
        setMenuOuvert(null)
      }
    }
    function handleToucheClavier(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOuvert(null)
      }
    }
    document.addEventListener('mousedown', handleClickDehors)
    document.addEventListener('keydown', handleToucheClavier)
    return () => {
      document.removeEventListener('mousedown', handleClickDehors)
      document.removeEventListener('keydown', handleToucheClavier)
    }
  }, [])

  const estActif = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const contenuSidebar = (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-[var(--sidebar)] px-5 pb-4">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-surface-border">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-xs">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold text-primary font-heading tracking-wide">D-FERME</span>
            <p className="text-[10px] text-foreground-muted -mt-1">Agro-Pastoral SaaS</p>
          </div>
        </div>
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
          isPremium ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30' : 'bg-primary/10 text-primary'
        }`}>
          {subscriptionTier}
        </span>
      </div>

      <div className="rounded-xl border border-surface-border bg-surface/50 p-2.5">
        <p className="text-xs font-semibold text-foreground truncate" title={entrepriseNom}>
          {entrepriseNom}
        </p>
        <p className="text-[11px] text-foreground-muted mt-0.5 capitalize">
          {role} • {devise}
        </p>
      </div>

      <nav className="flex flex-1 flex-col space-y-5">
        {menuSections.map((section) => (
          <div key={section.titre}>
            <div className="flex items-center justify-between px-2 pb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted/70">
                {section.titre}
              </span>
              {section.isPremiumOnly && !isPremium && (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-500">
                  <Crown className="w-2.5 h-2.5" /> Prémium
                </span>
              )}
            </div>
            <ul role="list" className="space-y-1">
              {section.items.map((item) => {
                const actif = estActif(item.href)
                const Icon = item.icon
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold transition-all
                        ${actif
                          ? 'bg-primary text-white shadow-xs'
                          : 'text-foreground-muted hover:text-foreground hover:bg-black/5'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`h-4 w-4 shrink-0 ${actif ? 'text-white' : 'text-foreground-muted group-hover:text-foreground'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.isPremiumLocked && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold shrink-0">
                          PRO
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="pt-3 border-t border-surface-border flex items-center justify-between text-xs text-foreground-muted">
        <LanguageSelector currentLang={locale} />
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="flex items-center gap-1.5 font-medium text-danger hover:text-danger/80 py-1.5 px-2 rounded-lg hover:bg-danger/10 transition-colors cursor-pointer"
            title={dict.sidebar?.logout || 'Déconnexion'}
          >
            <LogOut className="h-4 w-4 rtl:-scale-x-100" />
            <span>{dict.sidebar?.logout || 'Déconnexion'}</span>
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <DeviseProvider devise={devise}>
      <div className="min-h-screen bg-background">
        {/* Tiroir Mobile */}
        {sidebarOpen && (
          <div className="relative z-50 lg:hidden">
            <div className="fixed inset-0 bg-background/80 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
            <div className="fixed inset-0 flex">
              <div className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                  <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                    <X className="h-6 w-6 text-foreground" />
                  </button>
                </div>
                {contenuSidebar}
              </div>
            </div>
          </div>
        )}

        {/* Mode Horizontal Desktop */}
        {menuLayout === 'horizontal' ? (
          <header className="sticky top-0 z-40 hidden w-full border-b border-surface-border bg-surface lg:block shadow-xs">
            {/* Barre haute */}
            <div className="flex h-16 items-center justify-between px-6 border-b border-surface-border">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-xs">
                  <Sprout className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary font-heading tracking-wide">D-FERME</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.2 rounded-full ${
                      isPremium ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30' : 'bg-primary/10 text-primary'
                    }`}>
                      {subscriptionTier}
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground-muted truncate max-w-xs">{entrepriseNom}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <OfflineSyncBar />
                <LanguageSelector currentLang={locale} />
                <div className="text-xs font-medium text-foreground-muted">
                  <span className="capitalize">{role}</span>
                </div>
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 text-xs font-semibold text-danger hover:text-danger/80 p-2 rounded-lg hover:bg-danger/10 transition-colors cursor-pointer"
                    title={dict.sidebar?.logout || 'Déconnexion'}
                  >
                    <LogOut className="h-4 w-4 rtl:-scale-x-100" />
                    <span>{dict.sidebar?.logout || 'Déconnexion'}</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Barre de navigation horizontale avec dropdowns */}
            <nav ref={navHorizontalRef} className="flex items-center gap-2 px-6 py-2 flex-wrap text-xs relative bg-surface/50">
              {menuSections.map((section) => {
                const aUnItemActif = section.items.some((item) => estActif(item.href))
                const estOuvert = menuOuvert === section.titre

                return (
                  <div
                    key={section.titre}
                    className="relative group"
                    onMouseEnter={() => setMenuOuvert(section.titre)}
                    onMouseLeave={() => setMenuOuvert((actuel) => (actuel === section.titre ? null : actuel))}
                  >
                    <button
                      type="button"
                      onClick={() => setMenuOuvert((actuel) => (actuel === section.titre ? null : section.titre))}
                      aria-expanded={estOuvert}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                        aUnItemActif || estOuvert
                          ? 'bg-primary text-white shadow-xs'
                          : 'text-foreground-muted hover:text-foreground hover:bg-black/5'
                      }`}
                    >
                      <span>{section.titre}</span>
                      {section.isPremiumOnly && !isPremium && (
                        <Crown className="w-3 h-3 text-amber-300" />
                      )}
                      <span className={`text-[9px] opacity-70 transition-transform duration-150 ${estOuvert ? 'rotate-180' : ''}`}>▼</span>
                    </button>

                    <div
                      className={`absolute left-0 top-full pt-1.5 z-50 transition-all duration-150 ${
                        estOuvert ? 'block opacity-100 scale-100 pointer-events-auto' : 'hidden group-hover:block'
                      }`}
                    >
                      <div className="min-w-56 rounded-xl border border-surface-border bg-surface p-1.5 shadow-xl">
                        {section.items.map((item) => {
                          const actif = estActif(item.href)
                          const Icon = item.icon
                          return (
                            <Link
                              key={item.key}
                              href={item.href}
                              onClick={() => setMenuOuvert(null)}
                              className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                                actif
                                  ? 'bg-primary text-white font-semibold'
                                  : 'text-foreground hover:bg-black/5'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <Icon className="h-4 w-4 shrink-0" />
                                <span>{item.label}</span>
                              </div>
                              {item.isPremiumLocked && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">
                                  PREMIUM
                                </span>
                              )}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </nav>
          </header>
        ) : (
          /* Sidebar Classique Fixe Desktop */
          <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col border-r border-surface-border bg-[var(--sidebar)]">
            {contenuSidebar}
          </div>
        )}

        {/* Contenu principal */}
        <div className={`flex flex-col min-h-screen ${menuLayout === 'horizontal' ? 'w-full' : 'lg:pl-72'}`}>
          <header className={`sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-surface-border bg-surface/90 px-4 backdrop-blur-md sm:gap-x-6 sm:px-6 lg:px-8 ${
            menuLayout === 'horizontal' ? 'lg:hidden' : ''
          }`}>
            <button
              type="button"
              className="-m-2.5 p-2.5 text-foreground lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex flex-1 gap-x-4 self-stretch justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-primary lg:hidden">D-FERME</span>
                <span className="text-xs text-foreground-muted hidden sm:inline">• {entrepriseNom}</span>
              </div>
              <div className="flex items-center gap-x-3">
                <OfflineSyncBar />
                <LanguageSelector currentLang={locale} />
                <form action="/auth/signout" method="post" className="lg:hidden">
                  <button type="submit" className="text-danger p-2">
                    <LogOut className="h-5 w-5 rtl:-scale-x-100" />
                  </button>
                </form>
              </div>
            </div>
          </header>

          <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
    </DeviseProvider>
  )
}
