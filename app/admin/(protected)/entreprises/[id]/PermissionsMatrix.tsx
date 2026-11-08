'use client'

import {
  ALL_ACTIONS,
  PERMISSION_ACTION_LABELS,
  PERMISSION_MODULES,
  fullPermissions,
  readOnlyPermissions,
  type PermissionAction,
  type PermissionMap,
} from '@/lib/permissions'

export default function PermissionsMatrix({
  value,
  onChange,
  disabled,
}: {
  value: PermissionMap
  onChange: (next: PermissionMap) => void
  disabled?: boolean
}) {
  const has = (key: string, action: PermissionAction) => value[key]?.includes(action) ?? false

  const toggle = (key: string, action: PermissionAction) => {
    const mod = PERMISSION_MODULES.find((m) => m.key === key)!
    const current = new Set(value[key] ?? [])
    if (current.has(action)) {
      current.delete(action)
      if (action === 'read') current.clear()
    } else {
      current.add(action)
      if (action !== 'read' && mod.actions.includes('read')) current.add('read')
    }
    const next = { ...value }
    if (current.size === 0) delete next[key]
    else next[key] = mod.actions.filter((a) => current.has(a))
    onChange(next)
  }

  const toggleRow = (key: string) => {
    const mod = PERMISSION_MODULES.find((m) => m.key === key)!
    const all = mod.actions.every((a) => has(key, a))
    const next = { ...value }
    if (all) delete next[key]
    else next[key] = [...mod.actions]
    onChange(next)
  }

  const toggleColumn = (action: PermissionAction) => {
    const mods = PERMISSION_MODULES.filter((m) => m.actions.includes(action))
    const all = mods.every((m) => has(m.key, action))
    const next: PermissionMap = { ...value }
    for (const m of mods) {
      const current = new Set(next[m.key] ?? [])
      if (all) {
        current.delete(action)
        if (action === 'read') current.clear()
      } else {
        current.add(action)
        if (action !== 'read' && m.actions.includes('read')) current.add('read')
      }
      if (current.size === 0) delete next[m.key]
      else next[m.key] = m.actions.filter((a) => current.has(a))
    }
    onChange(next)
  }

  const groups = Array.from(new Set(PERMISSION_MODULES.map((m) => m.group)))

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 text-xs">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(fullPermissions())}
          className="rounded-md bg-surface-border px-2 py-1 font-medium text-foreground hover:bg-surface-border/80"
        >
          Tout cocher
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(readOnlyPermissions())}
          className="rounded-md bg-surface-border px-2 py-1 font-medium text-foreground hover:bg-surface-border/80"
        >
          Lecture seule
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange({})}
          className="rounded-md bg-surface-border px-2 py-1 font-medium text-foreground hover:bg-surface-border/80"
        >
          Tout décocher
        </button>
      </div>

      <div className="max-h-80 overflow-auto rounded-md border border-surface-border bg-surface">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-background border-b border-surface-border">
            <tr>
              <th className="px-2 py-2 text-left font-medium text-foreground-muted">Module / Section</th>
              {ALL_ACTIONS.map((a) => (
                <th key={a} className="px-1 py-2 text-center font-medium text-foreground-muted">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleColumn(a)}
                    title="Cocher/décocher toute la colonne"
                    className="hover:text-foreground font-semibold"
                  >
                    {PERMISSION_ACTION_LABELS[a]}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {groups.map((grp) => {
              const grpMods = PERMISSION_MODULES.filter((m) => m.group === grp)
              return (
                <React.Fragment key={grp}>
                  <tr className="bg-background/40">
                    <td colSpan={5} className="px-2 py-1 font-bold text-[11px] uppercase tracking-wider text-primary">
                      {grp}
                    </td>
                  </tr>
                  {grpMods.map((mod) => (
                    <tr key={mod.key} className="hover:bg-surface-border/30">
                      <td className="px-2 py-1.5">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => toggleRow(mod.key)}
                          className="text-left font-medium hover:text-primary transition-colors"
                        >
                          {mod.label}
                        </button>
                      </td>
                      {ALL_ACTIONS.map((a) => {
                        const supported = mod.actions.includes(a)
                        const active = has(mod.key, a)
                        return (
                          <td key={a} className="px-1 py-1.5 text-center">
                            {supported ? (
                              <input
                                type="checkbox"
                                disabled={disabled}
                                checked={active}
                                onChange={() => toggle(mod.key, a)}
                                className="h-3.5 w-3.5 rounded border-surface-border text-primary focus:ring-primary cursor-pointer"
                              />
                            ) : (
                              <span className="text-foreground-muted/40 font-mono">-</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import React from 'react'

