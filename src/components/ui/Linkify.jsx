import { isSafeUrl } from '../../lib/url'

const URL_PATTERN = /(https?:\/\/[^\s<]+)/g
const TRAILING_PUNCTUATION = /[.,;:!?)\]}'"»]+$/

// Transforme les URLs d'un texte saisi par un utilisateur en liens cliquables.
// Seuls les liens http(s) deviennent cliquables (protection contre javascript:,
// data:...), ouverts dans un nouvel onglet avec rel="noopener noreferrer nofollow".
// Le reste du texte est rendu tel quel (jamais interprété comme du HTML).
export default function Linkify({ text, linkClassName = 'text-accent-blue' }) {
  if (!text) return null
  return (
    <>
      {text.split(URL_PATTERN).map((part, i) => {
        if (i % 2 === 0) return part
        const trailing = part.match(TRAILING_PUNCTUATION)?.[0] || ''
        const url = trailing ? part.slice(0, -trailing.length) : part
        if (!isSafeUrl(url)) return part
        return (
          <span key={i}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className={`break-all underline underline-offset-2 hover:opacity-80 ${linkClassName}`}
            >
              {url}
            </a>
            {trailing}
          </span>
        )
      })}
    </>
  )
}
