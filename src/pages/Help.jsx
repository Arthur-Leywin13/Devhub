const faqs = [
  { q: 'Comment publier un projet ?', a: "Connectez-vous, puis utilisez le bouton « Créer » dans la barre latérale pour publier un projet." },
  { q: 'Comment suivre un utilisateur ?', a: "Rendez-vous sur son profil et cliquez sur « Suivre »." },
  { q: 'Comment fonctionne la progression des cours ?', a: "Chaque leçon terminée met à jour votre progression, visible sur la page du cours." },
]

export default function Help() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-hi">Aide</h1>
        <p className="mt-1 text-sm text-text-mid">Questions fréquentes sur l'utilisation de DevHub.</p>
      </div>
      <div className="flex flex-col gap-3">
        {faqs.map((f) => (
          <div key={f.q} className="rounded-xl2 border border-line bg-surface p-5">
            <h3 className="font-display text-sm font-semibold text-text-hi">{f.q}</h3>
            <p className="mt-1 text-sm text-text-mid">{f.a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
