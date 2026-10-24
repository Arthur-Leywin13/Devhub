import { useEffect, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Image as ImageIcon, Mic, Video, Send, X, Smile,
  Sticker as StickerIcon, Clapperboard, Palette, Loader2, Pencil, Trash2, Flag,
} from 'lucide-react'
import { useMessages } from '../hooks/useMessages'
import { messagesApi } from '../api/messages'
import { useAuth } from '../hooks/useAuth'
import { useAuthor } from '../hooks/useAuthor'
import { useStickers } from '../hooks/useStickers'
import { useGifs } from '../hooks/useGifs'
import { stickersApi } from '../api/stickers'
import { gifsApi } from '../api/gifs'
import { uploadAttachment, validateFile } from '../lib/attachments'
import EmojiPicker from '../components/chat/EmojiPicker'
import MediaPicker from '../components/chat/MediaPicker'
import WallpaperPicker from '../components/chat/WallpaperPicker'
import PickerButton from '../components/chat/PickerButton'
import MessageMenu from '../components/chat/MessageMenu'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ReportButton from '../components/ReportButton'
import Linkify from '../components/ui/Linkify'
import ErrorState from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { timeAgo } from '../lib/timeAgo'

function AttachmentView({ attachment }) {
  if (attachment.type === 'image') {
    return <img src={attachment.url} alt={attachment.name} className="max-h-64 rounded-lg object-cover" />
  }
  if (attachment.type === 'audio') {
    return <audio src={attachment.url} controls className="w-56 max-w-full" />
  }
  if (attachment.type === 'video') {
    return <video src={attachment.url} controls preload="metadata" className="max-h-64 rounded-lg" />
  }
  if (attachment.type === 'gif') {
    return <img src={attachment.url} alt={attachment.name} className="max-h-48 rounded-lg object-cover" />
  }
  if (attachment.type === 'sticker') {
    return attachment.stickerType === 'emoji' ? (
      <span className="text-5xl leading-none">{attachment.content}</span>
    ) : (
      <img src={attachment.content} alt="sticker" className="h-20 w-20 object-contain" />
    )
  }
  return null
}

const iconButton =
  'rounded-lg p-2 text-text-low transition-colors hover:bg-surface-raised hover:text-accent-blue disabled:opacity-40'

export default function Conversation() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const { data: messages, loading, error, refetch, setData } = useMessages(id)
  const [conversation, setConversation] = useState(null)
  const otherId = conversation?.participantIds.find((pId) => pId !== currentUser.id) || null
  const other = useAuthor(otherId)
  const wallpaperUrl = conversation?.wallpaperUrl || null

  const [draft, setDraft] = useState('')
  const [pendingAttachment, setPendingAttachment] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(null)
  const [wallpaperSaving, setWallpaperSaving] = useState(false)
  const [openPicker, setOpenPicker] = useState(null) // 'emoji' | 'sticker' | 'gif' | 'wallpaper' | null
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState('')
  const [editBusy, setEditBusy] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null) // message à supprimer
  const [confirmClear, setConfirmClear] = useState(false)
  const [reportMessageId, setReportMessageId] = useState(null)

  const bottomRef = useRef(null)
  const imageInputRef = useRef(null)
  const audioInputRef = useRef(null)
  const videoInputRef = useRef(null)

  const stickers = useStickers()
  const gifs = useGifs()

  const closePicker = () => setOpenPicker(null)
  const togglePicker = (name) => setOpenPicker((cur) => (cur === name ? null : name))

  useEffect(() => {
    messagesApi.markRead(id).catch(() => {})
    messagesApi
      .getConversation(id)
      .then(setConversation)
      .catch(() => {})
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const appendMessage = (message) => setData([...(messages || []), message])

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const problem = validateFile(file, ['image', 'audio', 'video'])
    if (problem) {
      setSendError(problem)
      return
    }
    setSendError(null)
    setUploading(true)
    try {
      const attachment = await uploadAttachment(file, 'chat-attachment')
      if (attachment) setPendingAttachment(attachment)
    } catch (err) {
      setSendError(err.message || "L'envoi du fichier a échoué.")
    } finally {
      setUploading(false)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if ((!draft.trim() && !pendingAttachment) || sending || uploading) return
    setSending(true)
    setSendError(null)
    try {
      const message = await messagesApi.sendMessage(id, {
        text: draft.trim(),
        attachments: pendingAttachment ? [pendingAttachment] : [],
      })
      appendMessage(message)
      setDraft('')
      setPendingAttachment(null)
    } catch (err) {
      setSendError(err.message || "Le message n'a pas pu être envoyé.")
    } finally {
      setSending(false)
    }
  }

  const sendSticker = async (sticker) => {
    closePicker()
    setSendError(null)
    try {
      const message = await messagesApi.sendMessage(id, {
        text: '',
        attachments: [{ type: 'sticker', stickerType: sticker.type, content: sticker.content, name: sticker.name }],
      })
      appendMessage(message)
    } catch (err) {
      setSendError(err.message || "Le sticker n'a pas pu être envoyé.")
    }
  }

  const sendGif = async (gif) => {
    closePicker()
    setSendError(null)
    try {
      const message = await messagesApi.sendMessage(id, {
        text: '',
        attachments: [{ type: 'gif', url: gif.url, name: gif.name }],
      })
      appendMessage(message)
    } catch (err) {
      setSendError(err.message || "Le GIF n'a pas pu être envoyé.")
    }
  }

  const createSticker = async (file) => {
    const problem = validateFile(file, ['image'])
    if (problem) {
      setSendError(problem)
      return
    }
    try {
      const attachment = await uploadAttachment(file, 'sticker')
      await stickersApi.create({ type: 'image', content: attachment.url, name: file.name })
      stickers.refetch()
    } catch (err) {
      setSendError(err.message || 'Le sticker n\'a pas pu être créé.')
    }
  }

  const createGif = async (file) => {
    if (file.type !== 'image/gif') {
      setSendError('Seuls les fichiers .gif sont acceptés.')
      return
    }
    const problem = validateFile(file, ['image'])
    if (problem) {
      setSendError(problem)
      return
    }
    try {
      const attachment = await uploadAttachment(file, 'gif')
      await gifsApi.create({ url: attachment.url, name: file.name })
      gifs.refetch()
    } catch (err) {
      setSendError(err.message || "Le GIF n'a pas pu être ajouté.")
    }
  }

  const applyWallpaper = async (url) => {
    const previous = conversation?.wallpaperUrl ?? null
    setSendError(null)
    setConversation((c) => ({ ...c, wallpaperUrl: url }))
    setWallpaperSaving(true)
    try {
      await messagesApi.setWallpaper(id, url)
    } catch (err) {
      setConversation((c) => ({ ...c, wallpaperUrl: previous }))
      setSendError(err.message || "Le fond d'écran n'a pas pu être modifié.")
    } finally {
      setWallpaperSaving(false)
    }
  }

  const uploadWallpaper = async (file) => {
    const problem = validateFile(file, ['image'])
    if (problem) {
      setSendError(problem)
      return
    }
    try {
      const attachment = await uploadAttachment(file, 'wallpaper')
      await applyWallpaper(attachment.url)
      closePicker()
    } catch (err) {
      setSendError(err.message || "L'image n'a pas pu être importée.")
    }
  }

  const startEdit = (m) => {
    setSendError(null)
    setEditingId(m.id)
    setEditDraft(m.text)
  }

  const saveEdit = async () => {
    const text = editDraft.trim()
    if (!text || editBusy) return
    setEditBusy(true)
    setSendError(null)
    try {
      const updated = await messagesApi.editMessage(id, editingId, text)
      setData((messages || []).map((m) => (m.id === updated.id ? updated : m)))
      setEditingId(null)
    } catch (err) {
      setSendError(err.message || "Le message n'a pas pu être modifié.")
    } finally {
      setEditBusy(false)
    }
  }

  const removeMessage = async () => {
    await messagesApi.deleteMessage(id, pendingDelete.id)
    setData(
      (messages || []).map((m) =>
        m.id === pendingDelete.id ? { ...m, text: '', attachments: [], deletedAt: new Date().toISOString() } : m
      )
    )
  }

  const clearConversation = async () => {
    await messagesApi.deleteConversation(id)
    navigate('/messages')
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }
  if (error) return <ErrorState error={error} onRetry={refetch} />

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-xl flex-col gap-3">
      <div className="flex items-center gap-3 border-b border-line pb-3">
        <Link to="/messages" aria-label="Retour" className="rounded-lg p-1 text-text-mid hover:text-accent-blue">
          <ArrowLeft size={18} />
        </Link>
        {other ? (
          <>
            <img src={other.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
            <Link to={`/profil/${other.username}`} className="font-display text-sm font-semibold text-text-hi hover:text-accent-blue">
              @{other.username}
            </Link>
          </>
        ) : (
          <span className="text-sm text-text-low">Conversation</span>
        )}

        <div className="ml-auto flex items-center gap-1">
          <PickerButton
            icon={Palette}
            label="Fond d'écran"
            anchor="button"
            open={openPicker === 'wallpaper'}
            onToggle={() => togglePicker('wallpaper')}
            onClose={closePicker}
          >
            <WallpaperPicker current={wallpaperUrl} busy={wallpaperSaving} onSelect={applyWallpaper} onUpload={uploadWallpaper} />
          </PickerButton>
          <MessageMenu
            align="right"
            actions={[{ label: 'Supprimer la conversation', icon: Trash2, danger: true, onClick: () => setConfirmClear(true) }]}
          />
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-xl2 border border-line bg-surface">
        {wallpaperUrl && (
          <>
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${wallpaperUrl}")` }} />
            <div className="absolute inset-0 bg-ink/40" />
          </>
        )}
        <div className="relative flex h-full flex-col gap-3 overflow-y-auto p-4">
          {messages?.length === 0 && (
            <p className="m-auto rounded-lg bg-ink/60 px-3 py-1.5 text-xs text-text-mid">Aucun message. Dites bonjour !</p>
          )}
          {messages?.map((m) => {
            const isMine = m.senderId === currentUser.id
            const deleted = !!m.deletedAt
            const editing = editingId === m.id
            const isBareMedia =
              !deleted && m.attachments?.length > 0 && !m.text && (m.attachments[0].type === 'sticker' || m.attachments[0].type === 'gif')
            const actions = deleted
              ? []
              : [
                  ...(isMine && m.text ? [{ label: 'Modifier', icon: Pencil, onClick: () => startEdit(m) }] : []),
                  ...(isMine ? [{ label: 'Supprimer', icon: Trash2, danger: true, onClick: () => setPendingDelete(m) }] : []),
                  ...(!isMine ? [{ label: 'Signaler', icon: Flag, onClick: () => setReportMessageId(m.id) }] : []),
                ]
            const bubbleClass = deleted
              ? 'rounded-xl2 border border-line bg-surface-raised/70 px-3 py-2 text-sm italic text-text-low'
              : isBareMedia
              ? 'flex flex-col gap-2'
              : `flex flex-col gap-2 rounded-xl2 px-3 py-2 text-sm ${isMine ? 'bg-accent-blue text-white' : 'bg-surface-raised text-text-hi'}`
            return (
              <div key={m.id} className={`flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
                <div className={`flex max-w-[88%] items-start gap-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                  <div className={bubbleClass}>
                    {deleted ? (
                      'Message supprimé'
                    ) : editing ? (
                      <div className="flex min-w-[12rem] flex-col gap-2">
                        <textarea
                          autoFocus
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') setEditingId(null)
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              saveEdit()
                            }
                          }}
                          maxLength={4000}
                          rows={2}
                          className="input resize-none"
                        />
                        <div className="flex justify-end gap-2 text-xs">
                          <button type="button" onClick={() => setEditingId(null)} className="rounded-lg px-2 py-1 text-white/80 hover:bg-white/10">
                            Annuler
                          </button>
                          <button
                            type="button"
                            onClick={saveEdit}
                            disabled={editBusy || !editDraft.trim()}
                            className="rounded-lg bg-white/20 px-2 py-1 font-medium text-white disabled:opacity-50"
                          >
                            {editBusy ? 'Enregistrement...' : 'Enregistrer'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {m.attachments?.map((a, i) => <AttachmentView key={i} attachment={a} />)}
                        {m.text && (
                          <p className="whitespace-pre-wrap break-words">
                            <Linkify text={m.text} linkClassName={isMine ? 'text-white' : 'text-accent-blue'} />
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  {!editing && <MessageMenu actions={actions} align={isMine ? 'left' : 'right'} />}
                </div>
                <span className={`rounded px-1 text-xs ${wallpaperUrl ? 'bg-ink/50 text-text-mid' : 'text-text-low'}`}>
                  {timeAgo(m.createdAt)}
                  {m.editedAt && !deleted ? ' · modifié' : ''}
                </span>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {sendError && <p className="rounded-lg bg-state-danger/10 px-3 py-2 text-sm text-state-danger">{sendError}</p>}

      {(pendingAttachment || uploading) && (
        <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-raised px-3 py-2">
          {uploading ? (
            <span className="flex items-center gap-2 text-sm text-text-mid">
              <Loader2 size={16} className="animate-spin" /> Envoi du fichier...
            </span>
          ) : (
            <>
              <AttachmentView attachment={pendingAttachment} />
              <button type="button" aria-label="Retirer la pièce jointe" onClick={() => setPendingAttachment(null)} className="ml-auto text-text-low hover:text-state-danger">
                <X size={16} />
              </button>
            </>
          )}
        </div>
      )}

      <form onSubmit={handleSend} className="relative flex flex-wrap items-center gap-1 rounded-xl border border-line bg-surface p-2 sm:flex-nowrap">
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
        <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />

        <button type="button" aria-label="Envoyer une image" onClick={() => imageInputRef.current?.click()} disabled={uploading} className={iconButton}>
          <ImageIcon size={18} />
        </button>
        <button type="button" aria-label="Envoyer un audio" onClick={() => audioInputRef.current?.click()} disabled={uploading} className={iconButton}>
          <Mic size={18} />
        </button>
        <button type="button" aria-label="Envoyer une vidéo" onClick={() => videoInputRef.current?.click()} disabled={uploading} className={iconButton}>
          <Video size={18} />
        </button>

        <PickerButton icon={Smile} label="Emoji" open={openPicker === 'emoji'} onToggle={() => togglePicker('emoji')} onClose={closePicker}>
          <EmojiPicker onSelect={(e) => setDraft((d) => d + e)} />
        </PickerButton>

        <PickerButton icon={StickerIcon} label="Stickers" open={openPicker === 'sticker'} onToggle={() => togglePicker('sticker')} onClose={closePicker}>
          <MediaPicker
            items={stickers.data || []}
            loading={stickers.loading}
            onSelect={sendSticker}
            onCreateFile={createSticker}
            accept="image/*"
            emptyLabel="Aucun sticker. Créez-en un à partir d'une image."
            renderItem={(s) =>
              s.type === 'emoji' ? (
                <span className="text-2xl">{s.content}</span>
              ) : (
                <img src={s.content} alt={s.name} className="h-full w-full object-contain" />
              )
            }
          />
        </PickerButton>

        <PickerButton icon={Clapperboard} label="GIFs" open={openPicker === 'gif'} onToggle={() => togglePicker('gif')} onClose={closePicker}>
          <MediaPicker
            items={gifs.data || []}
            loading={gifs.loading}
            onSelect={sendGif}
            onCreateFile={createGif}
            accept="image/gif"
            emptyLabel="Aucun GIF. Ajoutez-en un depuis vos fichiers."
            renderItem={(g) => <img src={g.url} alt={g.name} className="h-full w-full object-cover" />}
          />
        </PickerButton>

        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={4000}
          placeholder="Écrire un message..."
          className="order-first w-full bg-transparent px-1 py-1.5 text-sm text-text-hi placeholder:text-text-low outline-none sm:order-none sm:w-auto sm:flex-1"
        />

        <button
          type="submit"
          aria-label="Envoyer"
          disabled={(!draft.trim() && !pendingAttachment) || sending || uploading}
          className="ml-auto flex items-center justify-center rounded-lg bg-accent-blue p-2 text-white disabled:opacity-40 sm:ml-0"
        >
          <Send size={16} />
        </button>
      </form>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Supprimer ce message ?"
        message="Le message sera effacé pour vous et pour votre interlocuteur. Cette action est définitive."
        confirmLabel="Supprimer"
        danger
        onConfirm={removeMessage}
        onClose={() => setPendingDelete(null)}
      />
      <ConfirmDialog
        open={confirmClear}
        title="Supprimer la conversation ?"
        message="La conversation disparaît de votre liste et votre historique est effacé. Votre interlocuteur conserve la sienne."
        confirmLabel="Supprimer"
        danger
        onConfirm={clearConversation}
        onClose={() => setConfirmClear(false)}
      />
      <ReportButton
        targetType="message"
        targetId={reportMessageId}
        context={{ conversationId: id }}
        open={!!reportMessageId}
        onClose={() => setReportMessageId(null)}
      />
    </div>
  )
}
