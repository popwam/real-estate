export function FormSuccessPlaceholder({ title = "Request received" }) {
  return (
    <div className="rounded border border-emerald-200 bg-emerald-50 p-5">
      <h3 className="text-lg font-semibold text-emerald-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-emerald-800">
        Thanks. Your public request has been captured for follow-up.
      </p>
    </div>
  );
}
