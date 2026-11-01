import { useEffect, useState } from 'react'
import {
  User, Palette, Bell, Lock, ShieldCheck, Globe, Link2, Info, LogOut,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { usersApi } from '../api/users'
import { invalidateUserCache } from '../api/usersCache'
import Button from '../components/Button'
import { settingsApi } from '../api/settings'

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
  const [preferences, setPreferences] = useState({ theme: 'dark', language: 'fr', emailNotifications: true, inAppNotifications: true, profileVisibility: 'public', showActivity: true })
  const [loadingPreferences, setLoadingPreferences] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { settingsApi.get().then(setPreferences).catch((e) => setError(e.message)).finally(() => setLoadingPreferences(false)) }, [])

  const savePreferences = async (patch) => {
    setError('')
    const next = { ...preferences, ...patch }
    setPreferences(next)
    try { const result = await settingsApi.update(patch); setPreferences(result); setSaved(true) }
    catch (e) { setError(e.message); setPreferences(preferences) }
  }

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
          <section className="flex flex-col gap-5">
            <h2 className="font-display text-lg font-semibold text-text-hi">{sections.find((s) => s.id === active)?.label}</h2>
            {loadingPreferences && <p className="text-sm text-text-mid">Chargement des préférences…</p>}
            {error && <p role="alert" className="text-sm text-state-danger">{error}</p>}
            {active === 'apparence' && <SettingSelect label="Thème" value={preferences.theme} options={['dark','light','system']} labels={['Sombre','Clair','Système']} onChange={(v) => savePreferences({ theme: v })} />}
            {active === 'langue' && <SettingSelect label="Langue préférée" value={preferences.language} options={['fr','en','es','pt']} labels={['Français','English','Español','Português']} onChange={(v) => savePreferences({ language: v })} />}
            {active === 'notifications' && <><SettingToggle label="Notifications dans DevHub" checked={preferences.inAppNotifications} onChange={(v) => savePreferences({ inAppNotifications: v })} /><SettingToggle label="Notifications par e-mail" checked={preferences.emailNotifications} onChange={(v) => savePreferences({ emailNotifications: v })} /></>}
            {active === 'confidentialite' && <><SettingSelect label="Visibilité du profil" value={preferences.profileVisibility} options={['public','private']} labels={['Public','Privé']} onChange={(v) => savePreferences({ profileVisibility: v })} /><SettingToggle label="Afficher mon activité" checked={preferences.showActivity} onChange={(v) => savePreferences({ showActivity: v })} /></>}
            {active === 'securite' && <p className="text-sm text-text-mid">La modification du mot de passe et la gestion des sessions ne sont pas encore disponibles.</p>}
            {active === 'connexions' && <p className="text-sm text-text-mid">La connexion Google est disponible lors de la connexion avec Google. La gestion des fournisseurs liés sera ajoutée séparément.</p>}
            {active === 'apropos' && <div className="text-sm text-text-mid"><p>DevHub — plateforme communautaire pour développeurs.</p><p className="mt-2">Projets, articles, discussions et apprentissage.</p></div>}
            {saved && <p className="text-xs text-state-success">Préférences enregistrées.</p>}
          </section>
        )}
      </div>
    </div>
  )
}

function SettingSelect({ label, value, options, labels, onChange }) { return <label className="flex max-w-md flex-col gap-1.5 text-sm text-text-mid">{label}<select className="input" value={value} onChange={(e) => onChange(e.target.value)}>{options.map((v, i) => <option key={v} value={v}>{labels[i]}</option>)}</select></label> }\n\nfunction SettingToggle({ label, checked, onChange }) { return <label className="flex max-w-md items-center justify-between gap-4 text-sm text-text-mid">{label}<input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /></label> }\n\nfunction Field({ label, value, onChange, textarea, disabled }) {
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
