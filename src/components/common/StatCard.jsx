export default function StatCard({ label, value, color = 'bg-primary-500' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`h-10 w-10 rounded-lg ${color} flex items-center justify-center text-white font-bold`}>
        {value}
      </div>
      <div>
        <p className="text-2xl font-semibold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}
