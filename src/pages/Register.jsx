import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Chrome } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/Button'

export default function Register() {
  const navigate = useNavigate()
  const { register, loginWithProvider } = useAuth()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [providerLoading, setProviderLoading] = useState(null)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await register(form)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Inscription impossible.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleProvider = async (provider) => {
    setProviderLoading(provider)
    setError(null)
    try {
      const user = await loginWithProvider(provider)
      if (user) navigate('/')
    } catch (err) {
      setError(err.message || 'Inscription impossible.')
      setProviderLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h1 className="font-display text-xl font-semibold text-text-hi">Créer votre compte</h1>
        <p className="mt-1 text-sm text-text-mid">Rejoignez la communauté DevHub.</p>
        <p className="mt-2 text-xs text-text-low">Vous pouvez créer votre compte automatiquement avec Google.</p>
      </div>

      {error && <p className="rounded-lg bg-state-danger/10 px-3 py-2 text-center text-sm text-state-danger">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          required
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          placeholder="Nom d'utilisateur"
          className="input"
        />
        <input
          required
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="Email"
          className="input"
        />
        <input
          required
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Mot de passe"
          className="input"
        />
        <Button type="submit" className="mt-1 w-full" disabled={submitting}>
          {submitting ? 'Création...' : 'Créer mon compte'}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-text-low">
        <div className="h-px flex-1 bg-line" /> ou <div className="h-px flex-1 bg-line" />
      </div>

      <Button
        variant="secondary"
        icon={Chrome}
        className="w-full"
        onClick={() => handleProvider('google')}
        disabled={!!providerLoading}
      >
        {providerLoading === 'google' ? 'Connexion...' : 'Continuer avec Google'}
      </Button>

      <p className="text-center text-sm text-text-mid">
        Déjà un compte ?{' '}
        <Link to="/connexion" className="text-accent-blue hover:underline">Se connecter</Link>
      </p>
    </div>
  )
}
