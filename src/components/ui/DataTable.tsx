import type { ReactNode } from 'react';
import styles from './DataTable.module.css';

export interface Column<Row> {
  key: string;
  header: string;
  render: (row: Row) => ReactNode;
  /** Right-aligned numeric or short value. */
  align?: 'end';
}

export function DataTable<Row>({
  caption,
  columns,
  rows,
  rowKey,
  bare = false,
  headless = false,
}: {
  caption: string;
  columns: readonly Column<Row>[];
  rows: readonly Row[];
  rowKey: (row: Row) => string;
  /** Drop the outer border when the table already sits inside a card. */
  bare?: boolean;
  /** Hide the header row visually, as Vercel's deployment list does. Screen readers keep it. */
  headless?: boolean;
}) {
  return (
    <div
      className={bare ? `${styles.scroll} ${styles.bare}` : styles.scroll}
      tabIndex={0}
      role="region"
      aria-label={caption}
    >
      <table
        className={
          headless ? `${styles.table} ${styles.headless}` : styles.table
        }
      >
        <caption className={styles.caption}>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={column.align === 'end' ? styles.end : undefined}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={column.align === 'end' ? styles.end : undefined}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
