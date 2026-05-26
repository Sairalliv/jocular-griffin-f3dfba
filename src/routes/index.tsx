import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { getSessions, addSession, deleteSession } from '../lib/sessions'
import type { Session } from '../../db/schema'

ChartJS.register(ArcElement, Tooltip, Legend)

export const Route = createFileRoute('/')({
  component: SchedulerPage,
})

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6) // 6am–11pm

const CATEGORIES = {
  study:    { label: 'Study',    color: '#4f7cff' },
  work:     { label: 'Work',     color: '#f97316' },
  exercise: { label: 'Exercise', color: '#22c55e' },
  social:   { label: 'Social',   color: '#a855f7' },
  rest:     { label: 'Rest',     color: '#94a3b8' },
  hobby:    { label: 'Hobby',    color: '#f59e0b' },
  meal:     { label: 'Meal',     color: '#ec4899' },
} as const

type Category = keyof typeof CATEGORIES

function balanceScore(sessions: Session[]): number {
  const total = sessions.reduce((s, x) => s + x.durationHours, 0)
  if (total === 0) return 0
  const counts: Record<string, number> = {}
  for (const s of sessions) counts[s.category] = (counts[s.category] ?? 0) + s.durationHours
  const ideal = total / Object.keys(CATEGORIES).length
  const deviation = Object.values(counts).reduce((acc, v) => acc + Math.abs(v - ideal), 0)
  return Math.max(0, Math.round(100 - (deviation / total) * 100))
}

function ScoreRing({ score }: { score: number }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      <circle cx="48" cy="48" r={r} fill="none" stroke="#1e293b" strokeWidth="8" />
      <circle
        cx="48" cy="48" r={r} fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 48 48)"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x="48" y="52" textAnchor="middle" fontSize="18" fontWeight="700" fill={color}>{score}</text>
    </svg>
  )
}

function AddModal({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (data: { title: string; category: Category; day: number; startHour: number; durationHours: number }) => Promise<void>
}) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('study')
  const [day, setDay] = useState(0)
  const [startHour, setStartHour] = useState(9)
  const [duration, setDuration] = useState(1)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    await onAdd({ title: title.trim(), category, day, startHour, durationHours: duration })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <form
        className="relative z-10 w-full max-w-md rounded-2xl bg-[#0f172a] border border-white/10 p-6 space-y-5 shadow-2xl"
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 className="text-xl font-bold text-white tracking-tight">Add Session</h2>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Title</label>
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Linear Algebra lecture"
            className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Category</label>
          <div className="grid grid-cols-4 gap-2">
            {(Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][]).map(([key, cat]) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                className="rounded-lg py-2 text-xs font-semibold border transition"
                style={
                  category === key
                    ? { backgroundColor: cat.color, borderColor: 'transparent', color: '#fff' }
                    : { borderColor: 'rgba(255,255,255,0.1)', color: '#94a3b8' }
                }
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Day</label>
            <select
              value={day}
              onChange={e => setDay(Number(e.target.value))}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
            >
              {DAYS.map((d, i) => <option key={d} value={i} className="bg-slate-900">{d}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Start</label>
            <select
              value={startHour}
              onChange={e => setStartHour(Number(e.target.value))}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
            >
              {HOURS.map(h => (
                <option key={h} value={h} className="bg-slate-900">
                  {h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Hrs</label>
            <select
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
            >
              {[1,2,3,4,6,8].map(h => <option key={h} value={h} className="bg-slate-900">{h}h</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-slate-400 border border-white/10 hover:border-white/20 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition disabled:opacity-40"
            style={{ backgroundColor: CATEGORIES[category].color }}
          >
            {saving ? 'Adding…' : 'Add Session'}
          </button>
        </div>
      </form>
    </div>
  )
}

function WeekGrid({
  sessions,
  onDelete,
}: {
  sessions: Session[]
  onDelete: (id: number) => void
}) {
  const cellHeight = 48

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/8" style={{ backgroundColor: '#0a0f1e' }}>
      <div className="min-w-[700px]">
        {/* Header */}
        <div className="grid border-b border-white/8" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
          <div className="p-3" />
          {DAYS.map((d, i) => {
            const today = (new Date().getDay() + 6) % 7
            return (
              <div
                key={d}
                className="py-3 text-center text-xs font-bold tracking-widest uppercase"
                style={{ color: today === i ? '#60a5fa' : '#475569' }}
              >
                {d}
              </div>
            )
          })}
        </div>

        {/* Time rows */}
        <div className="relative">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="grid border-b border-white/5"
              style={{ height: cellHeight, gridTemplateColumns: '56px repeat(7, 1fr)' }}
            >
              <div className="flex items-start pt-1 px-2">
                <span className="text-[10px] text-slate-600 font-mono">
                  {hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`}
                </span>
              </div>
              {DAYS.map((_, di) => (
                <div key={di} className="border-l border-white/5" />
              ))}
            </div>
          ))}

          {/* Session blocks — absolutely positioned */}
          {sessions
            .filter(s => s.startHour >= HOURS[0] && s.startHour <= HOURS[HOURS.length - 1])
            .map(s => {
              const cat = CATEGORIES[s.category as Category] ?? CATEGORIES.study
              const top = (s.startHour - HOURS[0]) * cellHeight
              const height = Math.max(s.durationHours * cellHeight - 2, 20)
              return (
                <div
                  key={s.id}
                  className="absolute rounded-lg px-2 py-1 flex flex-col justify-between group cursor-pointer overflow-hidden"
                  style={{
                    top,
                    height,
                    left: `calc(56px + ${s.day} * ((100% - 56px) / 7) + 2px)`,
                    width: `calc((100% - 56px) / 7 - 4px)`,
                    backgroundColor: cat.color,
                    opacity: 0.88,
                  }}
                  title="Click to remove"
                  onClick={() => onDelete(s.id)}
                >
                  <span className="text-[11px] font-bold text-white leading-tight truncate">{s.title}</span>
                  {height > 36 && (
                    <span className="text-[10px] text-white/70">{s.durationHours}h</span>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 text-white text-xs font-bold rounded-lg transition-opacity">
                    Remove
                  </span>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}

function Sidebar({ sessions }: { sessions: Session[] }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const score = balanceScore(sessions)
  const totalHours = sessions.reduce((s, x) => s + x.durationHours, 0)

  const catTotals = Object.entries(CATEGORIES).map(([key, cat]) => ({
    key,
    label: cat.label,
    color: cat.color,
    hours: sessions.filter(s => s.category === key).reduce((a, b) => a + b.durationHours, 0),
  })).filter(c => c.hours > 0)

  const donutData = {
    labels: catTotals.map(c => c.label),
    datasets: [{
      data: catTotals.map(c => c.hours),
      backgroundColor: catTotals.map(c => c.color),
      borderWidth: 0,
      hoverOffset: 4,
    }],
  }

  const scoreLabel = score >= 70 ? 'Well balanced' : score >= 40 ? 'Getting there' : sessions.length === 0 ? 'No sessions yet' : 'Needs balance'
  const scoreColor = score >= 70 ? '#4ade80' : score >= 40 ? '#fbbf24' : '#f87171'

  return (
    <aside className="w-64 shrink-0 space-y-4">
      <div className="rounded-2xl border border-white/8 p-5" style={{ backgroundColor: '#0f172a' }}>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Balance Score</p>
        <div className="flex items-center gap-4">
          <ScoreRing score={score} />
          <div>
            <p className="text-base font-bold" style={{ color: scoreColor }}>{scoreLabel}</p>
            <p className="text-xs text-slate-500 mt-0.5">{totalHours}h scheduled</p>
          </div>
        </div>
      </div>

      {mounted && catTotals.length > 0 ? (
        <div className="rounded-2xl border border-white/8 p-5" style={{ backgroundColor: '#0f172a' }}>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Time Breakdown</p>
          <div className="max-w-[130px] mx-auto mb-4">
            <Doughnut
              data={donutData}
              options={{
                responsive: true,
                cutout: '70%',
                plugins: {
                  legend: { display: false },
                  tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}h` } },
                },
              }}
            />
          </div>
          <ul className="space-y-1.5">
            {catTotals.sort((a, b) => b.hours - a.hours).map(c => (
              <li key={c.key} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-slate-300 text-xs">{c.label}</span>
                </div>
                <span className="text-slate-500 font-mono text-xs">{c.hours}h</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/8 p-5 text-center" style={{ backgroundColor: '#0f172a' }}>
          <p className="text-slate-600 text-sm">Add sessions to see your breakdown</p>
        </div>
      )}

      <div className="rounded-2xl border border-white/8 p-5" style={{ backgroundColor: '#0f172a' }}>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Tips</p>
        <ul className="space-y-2">
          {[
            { color: CATEGORIES.exercise.color, tip: '3–5h exercise/week' },
            { color: CATEGORIES.rest.color,     tip: '7–8h sleep daily' },
            { color: CATEGORIES.social.color,   tip: 'Protect social time' },
            { color: CATEGORIES.study.color,    tip: 'Break study into 2h blocks' },
          ].map(({ color, tip }) => (
            <li key={tip} className="flex gap-2 text-xs text-slate-400">
              <span style={{ color }}>●</span> {tip}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}

function SchedulerPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchSessions = useCallback(async () => {
    const data = await getSessions()
    setSessions(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  const handleAdd = async (data: { title: string; category: Category; day: number; startHour: number; durationHours: number }) => {
    const session = await addSession({ data })
    setSessions(prev => [...prev, session])
  }

  const handleDelete = async (id: number) => {
    setSessions(prev => prev.filter(s => s.id !== id))
    await deleteSession({ data: { id } })
  }

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#060b18' }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-64 -left-64 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(79,124,255,0.08) 0%, transparent 70%)' }} />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.05) 0%, transparent 70%)' }} />
      </div>

      <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <header className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] mb-1" style={{ color: '#4f7cff' }}>WEEKLY PLANNER</p>
            <h1 className="text-4xl font-black tracking-tight">Study–Life Balance</h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #4f7cff 0%, #a855f7 100%)' }}
          >
            <span className="text-lg leading-none">+</span> Add Session
          </button>
        </header>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][]).map(([key, cat]) => (
            <span
              key={key}
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: cat.color + '20', color: cat.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
              {cat.label}
            </span>
          ))}
        </div>

        {/* Main layout */}
        <div className="flex gap-5 items-start">
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="rounded-2xl border border-white/8 h-96 flex items-center justify-center text-slate-600"
                style={{ backgroundColor: '#0a0f1e' }}>
                Loading schedule…
              </div>
            ) : (
              <WeekGrid sessions={sessions} onDelete={handleDelete} />
            )}
            <p className="mt-2 text-xs text-center" style={{ color: '#334155' }}>Click any session block to remove it</p>
          </div>
          <Sidebar sessions={sessions} />
        </div>
      </div>

      {showModal && (
        <AddModal onClose={() => setShowModal(false)} onAdd={handleAdd} />
      )}
    </div>
  )
}
