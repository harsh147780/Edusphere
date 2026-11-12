export default function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="card flex flex-col items-center py-12 text-center">
      <p className="font-medium text-slate-800">{message}</p>
      {onRetry && (
        <button className="btn-primary mt-4" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
