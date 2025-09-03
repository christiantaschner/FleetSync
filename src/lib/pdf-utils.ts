
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import type { Job, Company } from '@/types';
import { format } from 'date-fns';

export const generateInvoicePdf = (job: Job, company: Company) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text(company.name, 14, 22);
    doc.setFontSize(10);
    doc.text(company.settings?.address || '', 14, 30);

    doc.setFontSize(12);
    doc.text("INVOICE", 190, 22, { align: 'right' });
    doc.text(`Job ID: ${job.id}`, 190, 30, { align: 'right' });
    doc.text(`Date: ${format(new Date(), 'PP')}`, 190, 36, { align: 'right' });

    // Bill To
    doc.setFontSize(10);
    doc.text("BILL TO:", 14, 50);
    doc.text(job.customerName, 14, 56);
    doc.text(job.location.address || '', 14, 62);
    doc.text(job.customerEmail || '', 14, 68);
    doc.text(job.customerPhone, 14, 74);
    
    // Table of services
    const tableData = [
        ['Service Description', 'Amount'],
        [job.title, `$${(job.quotedValue || 0).toFixed(2)}`],
        ...(job.requiredParts || []).map(part => [part, 'See materials cost']),
    ];
    
    if (job.expectedPartsCost) {
        tableData.push(['Materials Cost', `$${job.expectedPartsCost.toFixed(2)}`]);
    }
    
    const total = (job.quotedValue || 0) + (job.expectedPartsCost || 0);

    autoTable(doc, {
        startY: 90,
        head: [['Item', 'Amount']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [52, 73, 94] },
    });

    // Total
    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Total:", 150, finalY + 10, { align: 'right' });
    doc.text(`$${total.toFixed(2)}`, 190, finalY + 10, { align: 'right' });

    // Footer
    doc.setFontSize(8);
    doc.text("Thank you for your business!", 14, 280);
    doc.text("Please contact us with any questions regarding this invoice.", 14, 285);

    // Save the PDF
    doc.save(`Invoice_${job.id}.pdf`);
};
