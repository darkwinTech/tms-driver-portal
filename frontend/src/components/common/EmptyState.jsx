export default function EmptyState({ message = 'No data to display', icon = '📭' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <span className="text-4xl mb-2">{icon}</span>
      <p className="text-sm">{message}</p>
    </div>
  );
}
