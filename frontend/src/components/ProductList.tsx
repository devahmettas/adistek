import { FormEvent, useState } from 'react'
import Button from './Button'
import Input from './Input'
import Select from './Select'
import Textarea from './Textarea'
import type { Category, Product } from '../api/types'

interface ProductListProps {
  products: Product[]
  categories: Category[]
  onUpdate: (
    id: number,
    payload: {
      category_id: number
      name: string
      price: number
      description?: string | null
      is_active: boolean
    },
  ) => Promise<void>
  onDelete: (id: number) => Promise<void>
  onToggleStatus: (product: Product) => Promise<void>
  showCategoryFilter?: boolean
}

export default function ProductList({
  products,
  categories,
  onUpdate,
  onDelete,
  onToggleStatus,
  showCategoryFilter = false,
}: ProductListProps) {
  const [filterCategoryId, setFilterCategoryId] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editCategoryId, setEditCategoryId] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)
  const [editError, setEditError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [actionId, setActionId] = useState<number | null>(null)

  const startEdit = (product: Product) => {
    setEditingId(product.id)
    setEditName(product.name)
    setEditCategoryId(String(product.category_id))
    setEditPrice(String(product.price))
    setEditDescription(product.description || '')
    setEditIsActive(product.is_active)
    setEditError(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditError(null)
  }

  const handleEditSubmit = async (event: FormEvent, productId: number) => {
    event.preventDefault()
    setEditError(null)

    if (!editCategoryId) {
      setEditError('Kategori seçimi zorunludur.')
      return
    }

    if (!editName.trim()) {
      setEditError('Ürün adı zorunludur.')
      return
    }

    const price = Number(editPrice)
    if (Number.isNaN(price) || price < 0) {
      setEditError('Geçerli bir fiyat girin.')
      return
    }

    setSubmitting(true)

    try {
      await onUpdate(productId, {
        category_id: Number(editCategoryId),
        name: editName.trim(),
        price,
        description: editDescription.trim() || null,
        is_active: editIsActive,
      })
      setEditingId(null)
    } catch {
      setEditError('Ürün güncellenemedi.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`"${product.name}" ürününü silmek istediğinize emin misiniz?`)) {
      return
    }

    setActionId(product.id)

    try {
      await onDelete(product.id)
    } catch {
      window.alert('Ürün silinemedi.')
    } finally {
      setActionId(null)
    }
  }

  const handleToggleStatus = async (product: Product) => {
    setActionId(product.id)

    try {
      await onToggleStatus(product)
    } catch {
      window.alert('Durum güncellenemedi.')
    } finally {
      setActionId(null)
    }
  }

  const filteredProducts =
    filterCategoryId === ''
      ? products
      : products.filter((product) => product.category_id === Number(filterCategoryId))

  if (products.length === 0) {
    return <p className="text-sm text-gray-500">Henüz ürün eklenmemiş.</p>
  }

  return (
    <div className="space-y-4">
      {showCategoryFilter && (
        <div className="max-w-xs">
          <Select
            label="Kategoriye göre filtrele"
            name="filterCategory"
            value={filterCategoryId}
            onChange={(event) => setFilterCategoryId(event.target.value)}
            options={[
              { value: '', label: 'Tüm kategoriler' },
              ...categories.map((category) => ({
                value: category.id,
                label: category.name,
              })),
            ]}
          />
        </div>
      )}

      {filteredProducts.length === 0 ? (
        <p className="text-sm text-gray-500">Bu kategoride ürün bulunamadı.</p>
      ) : (
        <>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-600">
              <th className="px-3 py-2 font-medium">Ürün</th>
              <th className="px-3 py-2 font-medium">Kategori</th>
              <th className="px-3 py-2 font-medium">Fiyat</th>
              <th className="px-3 py-2 font-medium">Durum</th>
              <th className="px-3 py-2 font-medium">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) =>
              editingId === product.id ? (
                <tr key={product.id} className="border-b border-gray-100 bg-blue-50/40">
                  <td colSpan={5} className="px-3 py-4">
                    <form
                      onSubmit={(event) => handleEditSubmit(event, product.id)}
                      className="grid gap-3 md:grid-cols-2"
                    >
                      <Input
                        label="Ürün Adı"
                        name={`editName-${product.id}`}
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                      />
                      <Select
                        label="Kategori"
                        name={`editCategory-${product.id}`}
                        value={editCategoryId}
                        onChange={(event) => setEditCategoryId(event.target.value)}
                        options={categories.map((category) => ({
                          value: category.id,
                          label: category.name,
                        }))}
                      />
                      <Input
                        label="Fiyat"
                        name={`editPrice-${product.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={editPrice}
                        onChange={(event) => setEditPrice(event.target.value)}
                      />
                      <Select
                        label="Durum"
                        name={`editStatus-${product.id}`}
                        value={editIsActive ? '1' : '0'}
                        onChange={(event) => setEditIsActive(event.target.value === '1')}
                        options={[
                          { value: '1', label: 'Aktif' },
                          { value: '0', label: 'Pasif' },
                        ]}
                      />
                      <div className="md:col-span-2">
                        <Textarea
                          label="Açıklama"
                          name={`editDescription-${product.id}`}
                          rows={2}
                          value={editDescription}
                          onChange={(event) => setEditDescription(event.target.value)}
                        />
                      </div>
                      {editError && (
                        <p className="text-sm text-red-600 md:col-span-2">{editError}</p>
                      )}
                      <div className="flex gap-2 md:col-span-2">
                        <Button type="submit" disabled={submitting}>
                          {submitting ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                        <Button type="button" variant="secondary" onClick={cancelEdit}>
                          İptal
                        </Button>
                      </div>
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={product.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-3 py-3">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    {product.description && (
                      <p className="mt-1 text-xs text-gray-500">{product.description}</p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-gray-600">
                    {product.category?.name || '-'}
                  </td>
                  <td className="px-3 py-3 font-medium text-blue-700">
                    {Number(product.price).toFixed(2)} ₺
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        product.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {product.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => startEdit(product)}
                        disabled={actionId === product.id}
                      >
                        Düzenle
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handleToggleStatus(product)}
                        disabled={actionId === product.id}
                      >
                        {product.is_active ? 'Pasif Yap' : 'Aktif Yap'}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handleDelete(product)}
                        disabled={actionId === product.id}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Sil
                      </Button>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {filteredProducts.map((product) =>
          editingId === product.id ? (
            <form
              key={product.id}
              onSubmit={(event) => handleEditSubmit(event, product.id)}
              className="space-y-3 rounded-lg border border-blue-100 bg-blue-50/40 p-4"
            >
              <Input
                label="Ürün Adı"
                name={`mobileEditName-${product.id}`}
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
              />
              <Select
                label="Kategori"
                name={`mobileEditCategory-${product.id}`}
                value={editCategoryId}
                onChange={(event) => setEditCategoryId(event.target.value)}
                options={categories.map((category) => ({
                  value: category.id,
                  label: category.name,
                }))}
              />
              <Input
                label="Fiyat"
                name={`mobileEditPrice-${product.id}`}
                type="number"
                min="0"
                step="0.01"
                value={editPrice}
                onChange={(event) => setEditPrice(event.target.value)}
              />
              <Select
                label="Durum"
                name={`mobileEditStatus-${product.id}`}
                value={editIsActive ? '1' : '0'}
                onChange={(event) => setEditIsActive(event.target.value === '1')}
                options={[
                  { value: '1', label: 'Aktif' },
                  { value: '0', label: 'Pasif' },
                ]}
              />
              <Textarea
                label="Açıklama"
                name={`mobileEditDescription-${product.id}`}
                rows={2}
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
              />
              {editError && <p className="text-sm text-red-600">{editError}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  Kaydet
                </Button>
                <Button type="button" variant="secondary" onClick={cancelEdit}>
                  İptal
                </Button>
              </div>
            </form>
          ) : (
            <article
              key={product.id}
              className="rounded-lg border border-gray-100 bg-gray-50 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-500">
                    {product.category?.name || 'Kategori yok'}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    product.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {product.is_active ? 'Aktif' : 'Pasif'}
                </span>
              </div>
              <p className="mt-2 font-semibold text-blue-700">
                {Number(product.price).toFixed(2)} ₺
              </p>
              {product.description && (
                <p className="mt-1 text-sm text-gray-600">{product.description}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => startEdit(product)}
                  disabled={actionId === product.id}
                >
                  Düzenle
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleToggleStatus(product)}
                  disabled={actionId === product.id}
                >
                  {product.is_active ? 'Pasif Yap' : 'Aktif Yap'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleDelete(product)}
                  disabled={actionId === product.id}
                  className="text-red-600"
                >
                  Sil
                </Button>
              </div>
            </article>
          ),
        )}
      </div>
        </>
      )}
    </div>
  )
}
