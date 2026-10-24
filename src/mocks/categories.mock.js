// MOCK TEMPORAIRE — à supprimer lorsque le backend réel est branché.
// Structure alignée sur : GET /technologies (catégories encyclopédie)
// L'administrateur pourra ajouter de nouvelles catégories via le backend — cette liste n'est pas définitive.

export const categoriesMock = [
  { id: 'prog', name: 'Programmation', icon: 'Code2', articleCount: 0, description: 'Langages, paradigmes, algorithmes.' },
  { id: 'web', name: 'Web', icon: 'Globe', articleCount: 0, description: 'Frontend, backend, standards du web.' },
  { id: 'mobile', name: 'Mobile', icon: 'Smartphone', articleCount: 0, description: 'Android, iOS, cross-platform.' },
  { id: 'ia', name: 'IA', icon: 'BrainCircuit', articleCount: 0, description: 'Machine learning, LLM, vision.' },
  { id: 'cyber', name: 'Cybersécurité', icon: 'ShieldHalf', articleCount: 0, description: 'Pentest, cryptographie, défense.' },
  { id: 'linux', name: 'Linux', icon: 'Terminal', articleCount: 0, description: 'Distributions, shell, administration.' },
  { id: 'db', name: 'Bases de données', icon: 'Database', articleCount: 0, description: 'SQL, NoSQL, modélisation.' },
  { id: 'net', name: 'Réseaux', icon: 'Network', articleCount: 0, description: 'Protocoles, infrastructure, sécurité réseau.' },
  { id: 'devops', name: 'DevOps', icon: 'Workflow', articleCount: 0, description: 'CI/CD, conteneurs, orchestration.' },
  { id: 'games', name: 'Jeux', icon: 'Gamepad2', articleCount: 0, description: 'Moteurs de jeu, gameplay, physique.' },
  { id: 'sciences', name: 'Sciences', icon: 'FlaskConical', articleCount: 0, description: 'Maths appliquées, physique computationnelle.' },
]
