import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createRequest } from '../../api/requests.api'
import { getAreas } from '../../api/areas.api'
import { getCategories } from '../../api/categories.api'
import Button from '../../components/common/Button'

export default function CreateRequest() {
  const navigate = useNavigate()
  const [areas, setAreas] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({ title: '', description: '', area_id: '', category_id: '', priority: 'normal' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getAreas().then(setAreas)
    getCategories().then(setCategories)
  }, [])

  const filteredCategories = form.area_id
    ? categories.filter((c) => c.area_id === Number(form.area_id))
    : categories

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value, ...(name === 'area_id' ? { category_id: '' } : {}) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const created = await createRequest({
        ...form,
        area_id: Number(form.area_id),
        category_id: form.category_id ? Number(form.category_id) : null,
      })
      navigate(`/requests/${created.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Nueva solicitud</h1>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Título</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Descripción</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Área</label>
          <select
            name="area_id"
            value={form.area_id}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar área</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Categoría</label>
          <select
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sin categoría</option>
            {filteredCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Prioridad</label>
          <select
            name="priority"
            value={form.priority}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Baja</option>
            <option value="normal">Normal</option>
            <option value="high">Alta</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear solicitud'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/requests')}>Cancelar</Button>
        </div>
      </form>
    </div>
  )
}
