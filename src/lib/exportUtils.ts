import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Question } from '@/hooks/useQuestionsList';
import { getCategoryLabel } from '@/lib/categories';

export function exportToExcel(questions: Question[], filename: string = 'questions') {
  const data = questions.map((q, index) => ({
    '#': index + 1,
    'التصنيف': getCategoryLabel(q.category),
    'السؤال': q.question_text,
    'التاريخ': new Date(q.created_at).toLocaleDateString('ar-SA'),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'الأسئلة');

  // Set RTL and column widths
  ws['!cols'] = [
    { wch: 5 },
    { wch: 20 },
    { wch: 60 },
    { wch: 15 },
  ];

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToPDF(questions: Question[], filename: string = 'questions') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Add Arabic font support
  doc.setFont('helvetica');

  // Title
  doc.setFontSize(18);
  doc.text('صندوق الفتوى مسجد الإيمان - الأسئلة المستلمة', doc.internal.pageSize.width / 2, 20, { align: 'center' });

  // Date
  doc.setFontSize(10);
  doc.text(`تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}`, doc.internal.pageSize.width / 2, 30, { align: 'center' });

  // Table data
  const tableData = questions.map((q, index) => [
    new Date(q.created_at).toLocaleDateString('ar-SA'),
    q.question_text.length > 80 ? q.question_text.substring(0, 80) + '...' : q.question_text,
    getCategoryLabel(q.category),
    (index + 1).toString(),
  ]);

  autoTable(doc, {
    head: [['التاريخ', 'السؤال', 'التصنيف', '#']],
    body: tableData,
    startY: 40,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 3,
      halign: 'right',
    },
    headStyles: {
      fillColor: [46, 125, 50],
      textColor: 255,
      halign: 'right',
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 30 },
      3: { cellWidth: 10 },
    },
  });

  doc.save(`${filename}.pdf`);
}
