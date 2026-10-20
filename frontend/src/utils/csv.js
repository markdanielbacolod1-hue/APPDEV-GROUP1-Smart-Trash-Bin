export function downloadDetectionsCsv(rows, filename) {
    const header = 'day,plastic,metal,paper,residual,total';
    const body = rows.map((r) => [r.day, r.plastic, r.metal, r.paper, r.residual, r.plastic + r.metal + r.paper + r.residual].join(','));
    const blob = new Blob([[header, ...body].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
