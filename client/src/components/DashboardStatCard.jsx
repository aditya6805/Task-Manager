export default function DashboardStatCard({ title, value, icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  }

  return (
    <div className="bg-white border border-gray-200 rounded p-4 sm:p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color] || colorClasses.blue}`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="ml-4">
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  )
}
