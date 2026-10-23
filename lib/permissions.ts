// Catalogue des pages/modules D-ELEVAGE et des actions qu'on peut autoriser sur chacun.
// Partagé entre l'UI de gestion des droits, le middleware, la barre latérale et les server actions.

export type PermissionAction = 'read' | 'create' | 'update' | 'delete'
export type PermissionMap = Record<string, PermissionAction[]>

export const PERMISSION_ACTION_LABELS: Record<PermissionAction, string> = {
  read: 'Lecture',
  create: 'Création',
  update: 'Modification',
  delete: 'Suppression',
}

export const ALL_ACTIONS: PermissionAction[] = ['read', 'create', 'update', 'delete']
const CRUD = ALL_ACTIONS

export type PermissionModule = {
  key: string
  label: string
  group: string
  paths: string[]
  actions: PermissionAction[]
  hint?: string
}

export const PERMISSION_MODULES: PermissionModule[] = [
  { key: 'dashboard', label: 'Tableau de bord', group: 'Général', paths: ['/dashboard'], actions: ['read'] },
  { key: 'bandes', label: 'Bandes & Volailles', group: 'Production', paths: ['/elevage/bandes'], actions: CRUD },
  { key: 'animaux', label: 'Bovins & Ruminants', group: 'Production', paths: ['/elevage/animaux'], actions: CRUD },
  { key: 'suivi', label: 'Suivi Quotidien & Mortalités', group: 'Production', paths: ['/elevage/suivi'], actions: CRUD },
  { key: 'sanitaire', label: 'Santé & Latence Médicale', group: 'Sécurité Sanitaire', paths: ['/elevage/sanitaire'], actions: CRUD },
  { key: 'stocks', label: 'Aliments & Intrants', group: 'Logistique', paths: ['/elevage/stocks'], actions: CRUD },
  { key: 'batiments', label: 'Bâtiments & Enclos', group: 'Infrastructures', paths: ['/elevage/batiments'], actions: CRUD },
  { key: 'finances', label: 'Finances, Compta & Budget', group: 'Gestion', paths: ['/elevage/finances', '/comptabilite'], actions: CRUD },
  { key: 'parametres', label: 'Paramètres', group: 'Administration', paths: ['/parametres'], actions: ['read', 'update'] },
]

const PATH_TO_MODULE: [string, string][] = PERMISSION_MODULES.flatMap((m) =>
  m.paths.map((p) => [p, m.key] as [string, string])
).sort((a, b) => b[0].length - a[0].length)

export function moduleForPath(pathname: string): string | null {
  for (const [prefix, key] of PATH_TO_MODULE) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return key
  }
  return null
}

export function hasPermission(
  role: string | null | undefined,
  permissions: PermissionMap | null | undefined,
  moduleKey: string,
  action: PermissionAction
): boolean {
  if (role === 'admin' || !permissions) return true
  return permissions[moduleKey]?.includes(action) ?? false
}

const DEFAULT_FIRST_PATHS: [string, string][] = [
  ['dashboard', '/dashboard'],
  ['bandes', '/elevage/bandes'],
  ['animaux', '/elevage/animaux'],
  ['suivi', '/elevage/suivi'],
  ['sanitaire', '/elevage/sanitaire'],
  ['stocks', '/elevage/stocks'],
  ['batiments', '/elevage/batiments'],
  ['finances', '/elevage/finances'],
  ['parametres', '/parametres'],
]

export function firstAllowedPath(
  role: string | null | undefined,
  permissions: PermissionMap | null | undefined
): string {
  if (role === 'admin' || !permissions) return '/dashboard'
  for (const [moduleKey, path] of DEFAULT_FIRST_PATHS) {
    if (hasPermission(role, permissions, moduleKey, 'read')) return path
  }
  return '/dashboard'
}
