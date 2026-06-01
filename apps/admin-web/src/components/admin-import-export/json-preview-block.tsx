export function JsonPreviewBlock({ value }: { value: unknown }) {
  return (
    <pre className="max-h-[520px] overflow-auto rounded-md bg-zinc-950 p-4 text-xs leading-5 text-zinc-50">
      {JSON.stringify(value ?? {}, null, 2)}
    </pre>
  );
}
