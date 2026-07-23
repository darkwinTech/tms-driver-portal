const STYLES = {
  error: 'bg-red-50 text-red-700 border-red-200',
  success: 'bg-green-50 text-green-700 border-green-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function Alert({ type = 'info', children }) {
  if (!children) return null;
  return <div className={`border rounded-md px-4 py-3 text-sm mb-4 ${STYLES[type]}`}>{children}</div>;
}
