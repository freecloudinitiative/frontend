import { useState } from 'react'

interface MissingTableNoticeProps {
  tableName: string
  /** CREATE TABLE statement inferred by the service from the uploaded CSV. */
  ddl: string
  onOpenInSqlEditor: () => void
}

/**
 * Shown when an import names a table that does not exist.
 *
 * Data Import loads rows into a table; it does not create one. That is a
 * reasonable contract, but on its own it left the customer holding Postgres's
 * `relation "users" does not exist` and no next step. This panel supplies the
 * step: the statement the service inferred from the file, for the customer to
 * read and run.
 *
 * The statement is deliberately shown rather than executed. Inferring column
 * types from a sample is a guess, and a guess a person approves is a line they
 * can edit; a guess executed for them is a table they have to drop.
 */
export function MissingTableNotice({ tableName, ddl, onOpenInSqlEditor }: MissingTableNoticeProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(ddl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be refused (permissions, insecure origin). The
      // statement is on screen and selectable either way, so this is not worth
      // an error state -- just leave the label alone.
    }
  }

  return (
    <section className="fci-tab-content" style={{ marginTop: 4 }} aria-label="Missing table">
      <div className="fci-section-title">Table Does Not Exist</div>
      <p style={{ margin: '0 0 10px' }}>
        Import writes rows into an existing table, and{' '}
        <code>{tableName}</code> is not in this database yet. Below is a table inferred from your
        file — review the column types, then create it and run the import again.
      </p>
      <pre
        style={{
          margin: 0,
          padding: 10,
          overflowX: 'auto',
          border: '1px solid var(--dash-border-subtle)',
          color: 'var(--dash-text)',
        }}
      >
        <code>{ddl}</code>
      </pre>
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <button
          type="button"
          className="fci-linkbtn fci-action-add"
          style={{ padding: '6px 14px' }}
          onClick={onOpenInSqlEditor}
        >
          Open in SQL Editor
        </button>
        <button
          type="button"
          className="fci-linkbtn fci-action-edit"
          style={{ padding: '6px 14px' }}
          onClick={handleCopy}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </section>
  )
}
