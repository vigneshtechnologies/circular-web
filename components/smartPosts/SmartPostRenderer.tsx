'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { SmartPostData, SmartColumn } from '@/lib/types'
import {
  List,
  CheckSquare,
  Square,
  Table as TableIcon,
  GitCompare,
  Tag,
  Clock,
  Activity,
  Gauge,
  FileText,
  Search,
  ChevronUp,
  ChevronDown,
  ExternalLink,
} from 'lucide-react'

interface SmartPostRendererProps {
  postId: string
  smart: SmartPostData
  compact?: boolean
}

export function SmartPostRenderer({ postId, smart, compact = false }: SmartPostRendererProps) {
  // Checklist private toggle state in localStorage
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  const [filterText, setFilterText] = useState('')
  const [sortCol, setSortCol] = useState<string>('')
  const [sortAsc, setSortAsc] = useState<boolean>(true)

  useEffect(() => {
    if (smart.template === 'checklist') {
      try {
        const saved = localStorage.getItem(`circular_chk_${postId}`)
        if (saved) {
          setCheckedItems(JSON.parse(saved))
        }
      } catch {}
    }
  }, [postId, smart.template])

  const toggleChecklist = (itemId: string) => {
    const updated = { ...checkedItems, [itemId]: !checkedItems[itemId] }
    setCheckedItems(updated)
    try {
      localStorage.setItem(`circular_chk_${postId}`, JSON.stringify(updated))
    } catch {}
  }

  // 1. Render List / Checklist
  const renderList = () => {
    const items = smart.items || []
    if (items.length === 0) return null

    return (
      <div className="mt-3 space-y-2">
        {items.map((item, idx) => {
          const isChecked = Boolean(checkedItems[item.id || String(idx)])
          const isChecklist = smart.template === 'checklist'

          return (
            <div
              key={item.id || idx}
              onClick={() => isChecklist && toggleChecklist(item.id || String(idx))}
              className={`flex items-start gap-2.5 rounded-xl border border-border/80 bg-card p-2.5 text-xs transition-all ${
                isChecklist ? 'cursor-pointer hover:border-primary/50' : ''
              }`}
            >
              {isChecklist ? (
                <button type="button" className="mt-0.5 text-primary shrink-0">
                  {isChecked ? (
                    <CheckSquare className="size-4 text-emerald-600 fill-emerald-100" />
                  ) : (
                    <Square className="size-4 text-muted-foreground" />
                  )}
                </button>
              ) : (
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-[10px] font-bold text-teal-600 dark:text-teal-400">
                  {idx + 1}
                </span>
              )}
              <span
                className={`flex-1 leading-relaxed ${
                  isChecked ? 'line-through text-muted-foreground' : 'text-foreground font-medium'
                }`}
              >
                {item.text}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  // 2. Render Table / Comparison / PriceList / Schedule / Availability
  const renderTable = () => {
    const rawColumns = smart.columns || []
    const rawRows = smart.rows || []

    const columns: SmartColumn[] = [...rawColumns].sort((a, b) => (a.order || 0) - (b.order || 0))

    const normalizedFilter = filterText.toLowerCase().trim()
    let rows = [...rawRows].filter((row) => {
      if (!normalizedFilter) return true
      return Object.values(row.cells || {}).some((v) =>
        String(v || '').toLowerCase().includes(normalizedFilter)
      )
    })

    if (sortCol) {
      rows.sort((a, b) => {
        const valA = a.cells?.[sortCol] ?? ''
        const valB = b.cells?.[sortCol] ?? ''
        const numA = Number(valA)
        const numB = Number(valB)
        if (!isNaN(numA) && !isNaN(numB)) {
          return sortAsc ? numA - numB : numB - numA
        }
        return sortAsc
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA))
      })
    }

    return (
      <div className="mt-3 space-y-2">
        {/* Table filter if filterable */}
        {smart.settings?.filterable !== false && !compact && columns.length > 0 && (
          <div className="relative flex items-center">
            <Search className="absolute left-3 size-3.5 text-muted-foreground" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search table rows..."
              className="w-full rounded-xl border border-border bg-card py-1.5 pl-8 pr-3 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/60">
                {columns.map((col) => (
                  <th
                    key={col.id}
                    onClick={() => {
                      if (col.sortable !== false) {
                        if (sortCol === col.id) setSortAsc(!sortAsc)
                        else {
                          setSortCol(col.id)
                          setSortAsc(true)
                        }
                      }
                    }}
                    className={`px-3 py-2 font-bold text-slate-900 dark:text-white select-none ${
                      col.sortable !== false ? 'cursor-pointer hover:bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span>{col.title}</span>
                      {sortCol === col.id ? (
                        sortAsc ? (
                          <ChevronUp className="size-3 text-primary" />
                        ) : (
                          <ChevronDown className="size-3 text-primary" />
                        )
                      ) : null}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length || 1} className="py-4 text-center text-muted-foreground">
                    No rows match.
                  </td>
                </tr>
              ) : (
                rows.map((row, rIdx) => (
                  <tr
                    key={row.id || rIdx}
                    className={`border-b border-border/50 transition-colors hover:bg-muted/30 ${
                      rIdx % 2 === 1 ? 'bg-muted/15' : ''
                    }`}
                  >
                    {columns.map((col) => {
                      const val = row.cells?.[col.id] ?? ''
                      const isPrice = col.type === 'price'
                      const isStatus = col.type === 'status'
                      const isLink = col.type === 'link' && /^https?:\/\//i.test(String(val))

                      let formattedVal = String(val)
                      if (isPrice && !isNaN(Number(val))) {
                        formattedVal = `₹${Number(val).toLocaleString('en-IN')}`
                      }

                      let statusBadge = null
                      if (isStatus) {
                        const sLower = String(val).toLowerCase()
                        const colorClass =
                          sLower.includes('available') || sLower.includes('open')
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : sLower.includes('limited') || sLower.includes('delayed') || sLower.includes('pending')
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-rose-500/10 text-rose-600'
                        statusBadge = (
                          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${colorClass}`}>
                            {formattedVal}
                          </span>
                        )
                      }

                      return (
                        <td key={col.id} className="px-3 py-2 text-foreground">
                          {statusBadge ? (
                            statusBadge
                          ) : isLink ? (
                            <a
                              href={String(val)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                            >
                              <span>Link</span>
                              <ExternalLink className="size-3" />
                            </a>
                          ) : (
                            formattedVal || '—'
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // 3. Render Progress Tracker
  const renderProgress = () => {
    const current = Number(smart.progress?.current || 0)
    const target = Math.max(1, Number(smart.progress?.target || 1))
    const unit = smart.progress?.unit || ''
    const percentage = Math.min(100, Math.max(0, Math.round((current / target) * 100)))

    return (
      <div className="mt-3 space-y-2">
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted border border-border">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
          <span>
            {current.toLocaleString('en-IN')} / {target.toLocaleString('en-IN')} {unit}
          </span>
          <span className="text-orange-600 dark:text-orange-400 font-black">{percentage}%</span>
        </div>
      </div>
    )
  }

  // 4. Render Notice / Article
  const renderNotice = () => {
    return (
      <div className="mt-3 rounded-xl border-l-4 border-pink-500 bg-pink-500/10 p-3.5 text-xs text-foreground leading-relaxed">
        {smart.description}
      </div>
    )
  }

  const iconMap: Record<string, any> = {
    list: List,
    checklist: CheckSquare,
    table: TableIcon,
    comparison: GitCompare,
    priceList: Tag,
    schedule: Clock,
    availability: Activity,
    progress: Gauge,
    notice: FileText,
  }

  const IconComponent = iconMap[smart.template] || List

  return (
    <div className="mt-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <IconComponent className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{smart.title}</h3>
          {smart.template !== 'notice' && smart.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{smart.description}</p>
          )}
        </div>
      </div>

      {/* Content by Template */}
      {smart.template === 'list' || smart.template === 'checklist'
        ? renderList()
        : smart.template === 'progress'
        ? renderProgress()
        : smart.template === 'notice'
        ? renderNotice()
        : renderTable()}
    </div>
  )
}
