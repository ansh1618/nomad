/**
 * CSV Export Utility for Admin Analytics
 * Formats tabular data into CSV format and triggers a browser download.
 */

export function exportToCsv(filename: string, headers: string[], rows: (string | number | boolean | null | undefined)[][]): void {
  try {
    if (typeof window === "undefined") return;

    const escapeCsvField = (field: any): string => {
      if (field === null || field === undefined) return '""';
      const str = String(field);
      if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return `"${str}"`;
    };

    const headerLine = headers.map(escapeCsvField).join(",");
    const rowLines = rows.map((row) => row.map(escapeCsvField).join(","));
    const csvContent = [headerLine, ...rowLines].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename.endsWith('.csv') ? filename : `${filename}.csv`}`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("[CSV Export Error]:", err);
  }
}
