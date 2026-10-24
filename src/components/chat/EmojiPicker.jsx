import { emojis } from '../../lib/emojis'

export default function EmojiPicker({ onSelect }) {
  return (
    <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-20 grid grid-cols-8 gap-1 rounded-xl border border-line bg-surface-raised p-3 shadow-glow sm:right-auto sm:w-72">
      {emojis.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => onSelect(e)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors hover:bg-surface-hover"
        >
          {e}
        </button>
      ))}
    </div>
  )
}
