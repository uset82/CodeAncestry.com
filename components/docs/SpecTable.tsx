export function SpecTable({
  columns,
  rows,
  caption,
}: {
  columns: readonly { key: string; label: string; mono?: boolean }[];
  rows: readonly Record<string, React.ReactNode>[];
  caption?: string;
}) {
  return (
    <div className="border-line overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-[14px]">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="bg-panel-2 border-line border-b">
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className="label text-muted px-4 py-3">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-line border-b last:border-0">
              {columns.map((column, columnIndex) => {
                const cell = row[column.key];
                const className = column.mono
                  ? 'px-4 py-3 align-top font-mono text-[13px]'
                  : 'text-text-soft px-4 py-3 align-top leading-relaxed';
                if (columnIndex === 0) {
                  return (
                    <th key={column.key} scope="row" className={`${className} font-medium`}>
                      {cell}
                    </th>
                  );
                }
                return (
                  <td key={column.key} className={className}>
                    {cell}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
