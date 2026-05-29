import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useRequests } from '../hooks/useRequests'
import StatusBadge from '../components/common/StatusBadge'
import PriorityBadge from '../components/common/PriorityBadge'

export default function Dashboard() {
  const { user } = useAuth()
  const { requests, loading } = useRequests()

  const recent = requests.slice(0, 5)

  const counts = requests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, {})

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Bienvenido, {user?.name}
      </h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: 'Pendientes',   key: 'pending',   color: 'text-yellow-700' },
          { label: 'En revisión',  key: 'in_review', color: 'text-blue-700' },
          { label: 'Aprobadas',    key: 'approved',  color: 'text-green-700' },
          { label: 'Rechazadas',   key: 'rejected',  color: 'text-red-700' },
        ].map(({ label, key, color }) => (
          <div key={key} className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{counts[key] || 0}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-medium text-gray-700">Solicitudes recientes</h2>
          <Link to="/requests" className="text-sm text-blue-600 hover:underline">Ver todas</Link>
        </div>
        {loading ? (
          <p className="p-4 text-sm text-gray-500">Cargando...</p>
        ) : recent.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No hay solicitudes.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <Link to={`/requests/${r.id}`} className="text-sm font-medium text-gray-800 hover:text-blue-600">
                    {r.title}
                  </Link>
                  <p className="text-xs text-gray-400">{r.area_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={r.priority} />
                  <StatusBadge status={r.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
