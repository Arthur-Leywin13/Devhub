// MOCK TEMPORAIRE — à supprimer lorsque le backend réel est branché.
// Structure alignée sur : GET /gifs, POST /gifs
// Contrairement aux stickers, aucun GIF n'est fourni par défaut : la
// bibliothèque se remplit au fur et à mesure que les utilisateurs en
// ajoutent (upload). Un vrai backend pourra aussi proposer une recherche
// GIF externe (Giphy/Tenor) en plus de cette bibliothèque "créée maison".

let gifs = []
let nextId = 1

export const gifsMock = {
  listAvailableFor: (userId) => gifs.filter((g) => g.authorId === null || g.authorId === userId),

  create: (authorId, { url, name }) => {
    const gif = { id: `gif${nextId++}`, authorId, url, name, createdAt: new Date().toISOString() }
    gifs.push(gif)
    return gif
  },

  remove: (id, authorId) => {
    gifs = gifs.filter((g) => !(g.id === id && g.authorId === authorId))
  },
}
