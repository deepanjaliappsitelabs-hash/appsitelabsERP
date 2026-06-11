/**
 * Exports rows to a properly formatted Excel-compatible CSV file.
 * Fixes:
 *  - Date values are pre-formatted as text (prefixed with tab or quoted)
 *    so Excel never converts them to ##### (column too narrow) or serial numbers.
 *  - File is named with .csv extension always.
 */

/** Format a single cell value safe for Excel */
function formatCell(value) {
  if (value === null || value === undefined) return "";

  const str = String(value).trim();

  // Detect date-like strings: YYYY-MM-DD or DD/MM/YYYY or MM/DD/YYYY
  const isDate =
    /^\d{4}-\d{2}-\d{2}/.test(str) ||   // ISO: 2026-05-10
    /^\d{2}[/-]\d{2}[/-]\d{4}/.test(str); // DD/MM/YYYY or MM-DD-YYYY

  if (isDate) {
    // Prefix with a tab so Excel treats it as plain text, not a date serial
    return `"\t${str.replaceAll('"', '""')}"`;
  }

  // Escape quotes and wrap in quotes
  return `"${str.replaceAll('"', '""')}"`;
}

/** Convert a camelCase or snake_case key to a readable header label */
function formatHeader(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

function exportToExcel(rows = [], fileName = "export") {
  if (!rows.length) {
    console.warn("exportToExcel: no rows to export");
    return;
  }

  const headers = Object.keys(rows[0]);

  const csv = [
    // Human-readable header row
    headers.map(formatHeader).map((h) => `"${h}"`).join(","),
    // Data rows
    ...rows.map((row) =>
      headers.map((header) => formatCell(row[header])).join(",")
    ),
  ].join("\n");

  // Add BOM for Excel to detect UTF-8 correctly (fixes special characters)
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;

  // Ensure .csv extension
  const baseName = fileName.replace(/\.(csv|xlsx|xls)$/i, "");
  link.download = `${baseName}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default exportToExcel;