const styles = {
  low:    'bg-gray-100 text-gray-600',
  normal: 'bg-blue-100 text-blue-800',
  high:   'bg-red-100 text-red-800',
}

const labels = {
  low:    'Baja',
  normal: 'Normal',
  high:   'Alta',
}

export default function PriorityBadge({ priority }) {
  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${styles[priority] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[priority] ?? priority}
    </span>
  )
}
