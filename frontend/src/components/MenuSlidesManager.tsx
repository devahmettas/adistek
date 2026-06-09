import { FormEvent, useEffect, useState } from 'react'
import {
  createMenuSlide,
  deleteMenuSlide,
  getMenuSlides,
  updateMenuSlide,
  type MenuSlide,
} from '../api/menuSlides'
import Button from './Button'
import ImageUploadField from './ImageUploadField'
import { resolveMenuAssetUrl } from '../utils/menuAssetUrl'
import Input from './Input'

export default function MenuSlidesManager() {
  const [slides, setSlides] = useState<MenuSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [sortOrder, setSortOrder] = useState('0')
  const [isActive, setIsActive] = useState(true)
  const [imagePath, setImagePath] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const resetForm = () => {
    setEditingId(null)
    setTitle('')
    setSubtitle('')
    setLinkUrl('')
    setSortOrder('0')
    setIsActive(true)
    setImagePath(null)
    setImageUrl(null)
  }

  const loadSlides = async () => {
    setLoading(true)
    try {
      setSlides(await getMenuSlides())
      setError(null)
    } catch {
      setError('Slaytlar yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSlides()
  }, [])

  const startEdit = (slide: MenuSlide) => {
    setEditingId(slide.id)
    setTitle(slide.title)
    setSubtitle(slide.subtitle ?? '')
    setLinkUrl(slide.link_url ?? '')
    setSortOrder(String(slide.sort_order))
    setIsActive(slide.is_active)
    setImagePath(slide.image_path)
    setImageUrl(slide.image_url)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!title.trim()) {
      setError('Slayt başlığı zorunludur.')
      return
    }

    setSubmitting(true)
    setError(null)

    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      link_url: linkUrl.trim() || null,
      sort_order: Number(sortOrder) || 0,
      is_active: isActive,
      image_path: imagePath,
    }

    try {
      if (editingId) {
        await updateMenuSlide(editingId, payload)
      } else {
        await createMenuSlide(payload)
      }
      resetForm()
      await loadSlides()
    } catch {
      setError('Slayt kaydedilemedi.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (slide: MenuSlide) => {
    if (!window.confirm(`"${slide.title}" slaytı silinsin mi?`)) {
      return
    }

    try {
      await deleteMenuSlide(slide.id)
      if (editingId === slide.id) {
        resetForm()
      }
      await loadSlides()
    } catch {
      window.alert('Slayt silinemedi.')
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <p className="text-sm font-semibold text-slate-900">
          {editingId ? 'Slaytı Düzenle' : 'Yeni Slayt Ekle'}
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Başlık"
            name="slideTitle"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Örn: Yaz Menüsü"
          />
          <Input
            label="Alt Başlık"
            name="slideSubtitle"
            value={subtitle}
            onChange={(event) => setSubtitle(event.target.value)}
            placeholder="Örn: Taze ve mevsimlik"
          />
          <Input
            label="Sıra"
            name="slideSort"
            type="number"
            min="0"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
          />
          <Input
            label="Bağlantı (opsiyonel)"
            name="slideLink"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            placeholder="https://..."
          />
        </div>

        <ImageUploadField
          label="Slayt Görseli"
          context="slide"
          imagePath={imagePath}
          imageUrl={imageUrl}
          onChange={({ path, url }) => {
            setImagePath(path)
            setImageUrl(url)
          }}
        />

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="rounded border-slate-300"
          />
          Müşteri menüsünde göster
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Kaydediliyor...' : editingId ? 'Güncelle' : 'Slayt Ekle'}
          </Button>
          {editingId && (
            <Button type="button" variant="secondary" onClick={resetForm}>
              İptal
            </Button>
          )}
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-slate-500">Slaytlar yükleniyor...</p>
      ) : slides.length === 0 ? (
        <p className="text-sm text-slate-500">Henüz slayt eklenmemiş. Menü üstünde varsayılan görünüm kullanılır.</p>
      ) : (
        <div className="space-y-3">
          {slides.map((slide) => (
            <article
              key={slide.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center"
            >
              <div className="h-20 w-full overflow-hidden rounded-xl bg-slate-100 sm:w-32">
                {resolveMenuAssetUrl(slide.image_url, slide.image_path) ? (
                  <img
                    src={resolveMenuAssetUrl(slide.image_url, slide.image_path)!}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                    Görsel yok
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{slide.title}</p>
                {slide.subtitle && <p className="text-sm text-slate-500">{slide.subtitle}</p>}
                <p className="mt-1 text-xs text-slate-400">
                  Sıra: {slide.sort_order} · {slide.is_active ? 'Aktif' : 'Pasif'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => startEdit(slide)}>
                  Düzenle
                </Button>
                <Button type="button" variant="secondary" onClick={() => void handleDelete(slide)}>
                  Sil
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
