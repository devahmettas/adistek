import { FormEvent, useState } from 'react'
import type { Category, Product } from '../api/types'
import { resolveMenuAssetUrl } from '../utils/menuAssetUrl'
import Button from './Button'
import ImageUploadField from './ImageUploadField'
import Input from './Input'

interface CategoryListProps {
  categories: Category[]
  products: Product[]
  onUpdate: (categoryId: number, payload: { name: string; image_path?: string | null }) => Promise<void>
  onDelete: (categoryId: number) => Promise<void>
}

export default function CategoryList({
  categories,
  products,
  onUpdate,
  onDelete,
}: CategoryListProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editImagePath, setEditImagePath] = useState<string | null>(null)
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null)
  const [submittingId, setSubmittingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const getProductCount = (categoryId: number) =>
    products.filter((product) => product.category_id === categoryId).length

  const startEdit = (category: Category) => {
    setEditingId(category.id)
    setEditName(category.name)
    setEditImagePath(category.image_path ?? null)
    setEditImageUrl(category.image_url ?? null)
    setError(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditImagePath(null)
    setEditImageUrl(null)
    setError(null)
  }

  const handleSave = async (event: FormEvent, categoryId: number) => {
    event.preventDefault()
    setError(null)

    if (!editName.trim()) {
      setError('Kategori adı zorunludur.')
      return
    }

    setSubmittingId(categoryId)

    try {
      await onUpdate(categoryId, {
        name: editName.trim(),
        image_path: editImagePath,
      })
      cancelEdit()
    } catch {
      setError('Kategori güncellenemedi.')
    } finally {
      setSubmittingId(null)
    }
  }

  const handleDelete = async (category: Category) => {
    if (!window.confirm(`${category.name} silinsin mi?`)) {
      return
    }

    setSubmittingId(category.id)
    setError(null)

    try {
      await onDelete(category.id)
    } catch (err) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message ===
          'string'
          ? (err as { response: { data: { message: string } } }).response.data.message
          : 'Kategori silinemedi. Kategoride ürün olmamalı.'
      setError(message)
    } finally {
      setSubmittingId(null)
    }
  }

  if (categories.length === 0) {
    return <p className="text-sm text-gray-500">Henüz kategori eklenmemiş.</p>
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <ul className="divide-y divide-gray-100">
        {categories.map((category) => {
          const isEditing = editingId === category.id
          const productCount = getProductCount(category.id)
          const canDelete = productCount === 0
          const previewUrl = resolveMenuAssetUrl(category.image_url, category.image_path)

          return (
            <li key={category.id} className="py-4">
              {isEditing ? (
                <form onSubmit={(event) => handleSave(event, category.id)} className="space-y-4">
                  <Input
                    label="Kategori Adı"
                    name={`editCategory-${category.id}`}
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                  />
                  <ImageUploadField
                    label="Kategori Görseli"
                    context="category"
                    imagePath={editImagePath}
                    imageUrl={editImageUrl}
                    onChange={({ path, url }) => {
                      setEditImagePath(path)
                      setEditImageUrl(url)
                    }}
                  />
                  <div className="flex gap-2">
                    <Button type="submit" disabled={submittingId === category.id}>
                      {submittingId === category.id ? 'Kaydediliyor...' : 'Kaydet'}
                    </Button>
                    <Button type="button" variant="secondary" onClick={cancelEdit}>
                      Vazgeç
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt={category.name}
                        className="h-14 w-14 shrink-0 rounded-lg border border-gray-200 object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-xs text-gray-400">
                        Görsel yok
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{category.name}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        {productCount > 0 ? `${productCount} ürün` : 'Ürün yok'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => startEdit(category)}
                      disabled={submittingId === category.id}
                    >
                      Düzenle
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleDelete(category)}
                      disabled={submittingId === category.id || !canDelete}
                      className="text-red-700 hover:bg-red-50 disabled:opacity-50"
                      title={canDelete ? undefined : 'Silmek için kategoride ürün olmamalı'}
                    >
                      Sil
                    </Button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <p className="text-xs text-gray-500">
        Yalnızca ürünü olmayan kategoriler silinebilir.
      </p>
    </div>
  )
}
