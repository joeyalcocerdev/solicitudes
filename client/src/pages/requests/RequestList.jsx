import { Link } from 'react-router-dom'
import { useRequests } from '../../hooks/useRequests'
import StatusBadge from '../../components/common/StatusBadge'
import PriorityBadge from '../../components/common/PriorityBadge'
import Button from '../../components/common/Button'

export default function RequestList() {
  const { requests, loading, error } = useRequests()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Solicitudes</h1>
        <Link to="/requests/new">
          <Button>Nueva solicitud</Button>
        </Link>
      </div>

      {loading && <p className="text-sm text-gray-500">Cargando...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {requests.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">No hay solicitudes.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Título</th>
                  <th className="px-4 py-3 font-medium">Área</th>
                  <th className="px-4 py-3 font-medium">Prioridad</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/requests/${r.id}`} className="text-blue-600 hover:underline font-medium">
                        {r.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.area_name}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={r.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(r.created_at).toLocaleDateString('es-MX')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
