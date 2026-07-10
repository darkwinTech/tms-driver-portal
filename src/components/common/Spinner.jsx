export default function Spinner({ full }) {
  const spinner = (
    <div className="h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
  );
  if (!full) return spinner;
  return <div className="min-h-screen flex items-center justify-center">{spinner}</div>;
}
