import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Presentation } from '../types';

/**
 * Builds a base64 Data URL for a Presentation using jsPDF
 */
export function createPresentationPdfDataUrl(presentation: Presentation): string {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const slidesToRender = presentation.slides && presentation.slides.length > 0
    ? presentation.slides
    : [{
        id: 'default',
        title: presentation.title || presentation.code,
        subtitle: presentation.description || 'MAMUTHUB Kurumsal Sunum',
        content: 'MAMUTHUB Yönetim Paneli üzerinden yüklenen kurumsal PDF belgesi.',
        layout: 'title' as const,
      }];

  slidesToRender.forEach((slide, index) => {
    if (index > 0) {
      doc.addPage();
    }

    doc.setFillColor(15, 23, 42); // Dark Slate (#0f172a)
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setFillColor(37, 99, 235); // MAMUTHUB Primary Blue
    doc.rect(0, 0, pageWidth, 6, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text('MAMUTHUB KURUMSAL YÖNETİM PANELİ', 15, 16);
    doc.text(`${presentation.code}`, pageWidth - 15, 16, { align: 'right' });

    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.5);
    doc.line(15, 20, pageWidth - 15, 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text(slide.title || presentation.title, 15, 36);

    if (slide.subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(13);
      doc.setTextColor(96, 165, 250);
      doc.text(slide.subtitle, 15, 46);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(226, 232, 240);

    const contentStartY = slide.subtitle ? 58 : 48;
    const splitContent = doc.splitTextToSize(slide.content || presentation.description || '', pageWidth - 30);
    doc.text(splitContent, 15, contentStartY);

    let currentY = contentStartY + (splitContent.length * 6) + 6;

    if (slide.bulletPoints && slide.bulletPoints.length > 0) {
      doc.setFontSize(11);
      slide.bulletPoints.forEach((bp) => {
        if (currentY < pageHeight - 30) {
          doc.setFillColor(37, 99, 235);
          doc.circle(18, currentY - 1.5, 1.2, 'F');
          doc.setTextColor(241, 245, 249);
          doc.text(bp, 23, currentY);
          currentY += 8;
        }
      });
    }

    doc.setDrawColor(30, 41, 59);
    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('MAMUTHUB Digital Presentation Deck', 15, pageHeight - 9);
    doc.text(`Sayfa ${index + 1} / ${slidesToRender.length}`, pageWidth - 15, pageHeight - 9, { align: 'right' });
  });

  return doc.output('datauristring');
}

/**
 * Generates a high quality PDF presentation deck or downloads existing pdfUrl
 */
export async function generatePresentationPDF(presentation: Presentation): Promise<void> {
  if (presentation.pdfUrl) {
    const a = document.createElement('a');
    a.href = presentation.pdfUrl;
    a.download = presentation.pdfFileName || `${presentation.code}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  presentation.slides.forEach((slide, index) => {
    if (index > 0) {
      doc.addPage();
    }

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 6, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text('MAMUTHUB KURUMSAL YÖNETİM PANELİ', 15, 16);
    doc.text(`${presentation.code}`, pageWidth - 15, 16, { align: 'right' });

    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.5);
    doc.line(15, 20, pageWidth - 15, 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text(slide.title, 15, 36);

    if (slide.subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(13);
      doc.setTextColor(96, 165, 250);
      doc.text(slide.subtitle, 15, 46);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(226, 232, 240);

    const contentStartY = slide.subtitle ? 58 : 48;
    const splitContent = doc.splitTextToSize(slide.content || '', pageWidth - 30);
    doc.text(splitContent, 15, contentStartY);

    let currentY = contentStartY + (splitContent.length * 6) + 6;

    if (slide.bulletPoints && slide.bulletPoints.length > 0) {
      doc.setFontSize(11);
      slide.bulletPoints.forEach((bp) => {
        if (currentY < pageHeight - 30) {
          doc.setFillColor(37, 99, 235);
          doc.circle(18, currentY - 1.5, 1.2, 'F');
          doc.setTextColor(241, 245, 249);
          doc.text(bp, 23, currentY);
          currentY += 8;
        }
      });
    }

    if (slide.stats && slide.stats.length > 0) {
      currentY += 4;
      const boxWidth = (pageWidth - 30 - (slide.stats.length - 1) * 8) / slide.stats.length;
      slide.stats.forEach((stat, sIdx) => {
        const xPos = 15 + sIdx * (boxWidth + 8);
        doc.setFillColor(30, 41, 59);
        doc.roundedRect(xPos, currentY, boxWidth, 22, 3, 3, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(59, 130, 246);
        doc.text(stat.value, xPos + 10, currentY + 10);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text(stat.label, xPos + 10, currentY + 17);
      });
    }

    doc.setDrawColor(30, 41, 59);
    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('MAMUTHUB Digital Presentation Deck', 15, pageHeight - 9);
    doc.text(`Sayfa ${index + 1} / ${presentation.slides.length}`, pageWidth - 15, pageHeight - 9, { align: 'right' });
  });

  const cleanFileName = presentation.code.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${cleanFileName}_Sunum.pdf`);
}

/**
 * Safely opens a PDF in a new browser tab even if it's a Base64 data URL
 */
export function openPdfInNewTab(pdfUrl: string, fileName?: string): void {
  if (!pdfUrl) return;

  if (pdfUrl.startsWith('data:application/pdf;base64,')) {
    try {
      const base64Data = pdfUrl.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const win = window.open(blobUrl, '_blank');
      if (!win) {
        // Fallback if popup blocked
        downloadPdfUrl(pdfUrl, fileName || 'Sunum.pdf');
      }
      return;
    } catch (e) {
      console.error('Blob conversion error:', e);
    }
  }

  window.open(pdfUrl, '_blank');
}

/**
 * Downloads a PDF URL directly to the user's computer
 */
export function downloadPdfUrl(pdfUrl: string, fileName: string): void {
  const a = document.createElement('a');
  a.href = pdfUrl;
  a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Alternative function that converts DOM element directly to PDF
 */
export async function exportElementToPDF(elementId: string, fileName: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element bulunamadı');
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#0f172a',
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const imgWidth = pdf.internal.pageSize.getWidth();
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  pdf.save(`${fileName.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
}
