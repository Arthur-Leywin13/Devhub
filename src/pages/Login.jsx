import { useState } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Chrome } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/Button'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, loginWithProvider } = useAuth()
  const [form, setForm] = useState({ emailOrUsername: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [providerLoading, setProviderLoading] = useState(null)
  // Le backend redirige vers /connexion?error=... si le flux OAuth échoue.
  const [searchParams] = useSearchParams()
  const [error, setError] = useState(
    searchParams.get('error') ? "La connexion avec le service externe a échoué. Réessayez ou utilisez votre email." : null
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await login(form)
      navigate(location.state?.from?.pathname || '/')
    } catch (err) {
      setError(err.message || 'Connexion impossible.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleProvider = async (provider) => {
    setProviderLoading(provider)
    setError(null)
    try {
      const user = await loginWithProvider(provider, location.state?.from?.pathname || '/')
      // En mode live, loginWithProvider redirige la page entière : ce code
      // ne s'exécute jamais dans ce cas. En mode mock, on navigue normalement.
      if (user) navigate(location.state?.from?.pathname || '/')
    } catch (err) {
      setError(err.message || 'Connexion impossible.')
      setProviderLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h1 className="font-display text-xl font-semibold text-text-hi">Bienvenue</h1>
        <p className="mt-1 text-sm text-text-mid">Connectez-vous pour continuer sur DevHub.</p>
      </div>

      {error && <p className="rounded-lg bg-state-danger/10 px-3 py-2 text-center text-sm text-state-danger">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          required
          value={form.emailOrUsername}
          onChange={(e) => setForm({ ...form, emailOrUsername: e.target.value })}
          placeholder="Email ou nom d'utilisateur"
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
          {submitting ? 'Connexion...' : 'Se connecter'}
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

      <div className="flex flex-col items-center gap-2 text-sm">
        <a href="#" className="text-text-mid hover:text-accent-blue">Mot de passe oublié ?</a>
        <p className="text-text-mid">
          Pas encore de compte ?{' '}
          <Link to="/inscription" className="text-accent-blue hover:underline">Créer un compte</Link>
        </p>
      </div>
    </div>
  )
}
