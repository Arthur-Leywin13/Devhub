import { useState } from 'react'
import {
  User, Palette, Bell, Lock, ShieldCheck, Globe, Link2, Info, LogOut,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { usersApi } from '../api/users'
import { invalidateUserCache } from '../api/usersCache'
import Button from '../components/Button'

const sections = [
  { id: 'compte', label: 'Compte', icon: User },
  { id: 'apparence', label: 'Apparence', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'confidentialite', label: 'Confidentialité', icon: Lock },
  { id: 'securite', label: 'Sécurité', icon: ShieldCheck },
  { id: 'langue', label: 'Langue', icon: Globe },
  { id: 'connexions', label: 'Connexions', icon: Link2 },
  { id: 'apropos', label: 'À propos', icon: Info },
]

export default function Settings() {
  const { user, logout, refreshUser } = useAuth()
  const [active, setActive] = useState('compte')
  const [form, setForm] = useState({ name: user.name, bio: user.bio || '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    try {
      await usersApi.update(form)
      invalidateUserCache(user.id)
      await refreshUser()
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex flex-shrink-0 flex-col gap-1 lg:w-56">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
              active === s.id ? 'bg-surface-raised text-text-hi' : 'text-text-mid hover:bg-surface-raised hover:text-text-hi'
            }`}
          >
            <s.icon size={16} /> {s.label}
          </button>
        ))}
        <button onClick={logout} className="mt-2 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-state-danger hover:bg-state-danger/10">
          <LogOut size={16} /> Déconnexion
        </button>
      </div>

      <div className="flex-1 rounded-xl2 border border-line bg-surface p-6">
        {active === 'compte' && (
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <h2 className="font-display text-lg font-semibold text-text-hi">Compte</h2>
            <div className="flex items-center gap-4">
              <img src={user.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
              <Button type="button" variant="secondary" size="sm">Changer la photo</Button>
            </div>
            <Field label="Nom d'utilisateur" value={`@${user.username}`} disabled />
            <Field label="Nom complet" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field label="Bio" value={form.bio} onChange={(v) => setForm({ ...form, bio: v })} textarea />
            <div className="flex items-center gap-3">
              <Button type="submit" className="w-fit" disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </Button>
              {saved && <span className="text-xs text-state-success">Modifications enregistrées.</span>}
            </div>
          </form>
        )}
        {active !== 'compte' && (
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-lg font-semibold text-text-hi">
              {sections.find((s) => s.id === active)?.label}
            </h2>
            <p className="text-sm text-text-mid">Les réglages de cette section apparaîtront ici une fois le backend connecté.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, textarea, disabled }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-text-mid">
      {label}
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="input resize-none" disabled={disabled} />
      ) : (
        <input value={value} onChange={(e) => onChange && onChange(e.target.value)} className="input" disabled={disabled} />
      )}
    </label>
  )
}
