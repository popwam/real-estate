export function FormSuccessPlaceholder({ title = "Request received" }) {
  return (
    <div className="ui-feedback ui-feedback-success p-5" role="status">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6">
        Thanks. Your request was sent and the relevant team can follow up.
      </p>
    </div>
  );
}
