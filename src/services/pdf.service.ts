import PDFDocument from 'pdfkit';
import { Response } from 'express';

interface PrescriptionData {
    hospitalName: string;
    doctorName: string;
    patientName: string;
    patientAge: number;
    patientGender: string;
    date: string;
    diagnosis: string;
    treatment: string;
    prescription: string; // The text content
}

export class PDFService {
    static generatePrescription(res: Response, data: PrescriptionData) {
        const doc = new PDFDocument({ margin: 50 });

        // Set headers for download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=prescription-${data.date}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(20).text(data.hospitalName, { align: 'center' });
        doc.fontSize(10).text('123 Health Street, Medical District', { align: 'center' });
        doc.moveDown();
        doc.lineWidth(1).moveTo(50, 100).lineTo(550, 100).stroke();
        doc.moveDown();

        // Doctor & Patient Info
        doc.fontSize(12).font('Helvetica-Bold').text('Doctor Details:', 50, 120);
        doc.font('Helvetica').text(`Dr. ${data.doctorName}`);
        doc.text(`Date: ${data.date}`);

        doc.font('Helvetica-Bold').text('Patient Details:', 300, 120);
        doc.font('Helvetica').text(`Name: ${data.patientName}`);
        doc.text(`Age/Gender: ${data.patientAge} / ${data.patientGender}`);

        doc.moveDown(4);

        // Diagnosis
        doc.font('Helvetica-Bold').text('Diagnosis:', 50);
        doc.font('Helvetica').text(data.diagnosis);
        doc.moveDown();

        // Treatment
        doc.font('Helvetica-Bold').text('Treatment Plan:', 50);
        doc.font('Helvetica').text(data.treatment);
        doc.moveDown();

        // Prescription
        doc.font('Helvetica-Bold').text('Rx / Prescription:', 50);
        doc.font('Helvetica').text(data.prescription || 'No specific medication prescribed.');

        doc.moveDown(4);

        // Footer
        doc.fontSize(10).text('Signature: __________________________', 400, 650);
        doc.text('Dr. ' + data.doctorName, 400, 665);

        doc.end();
    }

    static generateBillPDF(data: any, writeCb: (chunk: any) => void, endCb: () => void) {
        const doc = new PDFDocument({ margin: 50 });

        doc.on('data', writeCb);
        doc.on('end', endCb);

        // Header
        doc.fontSize(24).text(data.hospitalName, { align: 'center' });
        doc.fontSize(10).text(data.address, { align: 'center' });
        doc.moveDown();
        doc.lineWidth(1).moveTo(50, 100).lineTo(550, 100).stroke();

        // Title
        doc.moveDown(2);
        doc.fontSize(18).text(data.status === 'PAID' ? 'RECEIPT' : 'INVOICE', { align: 'center' });
        doc.moveDown();

        // Details
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text(`Bill ID: ${data.billId}`, 50, 160);
        doc.text(`Date: ${new Date(data.date).toLocaleDateString()}`, 50, 180);

        doc.text(`Patient: ${data.patientName}`, 300, 160);
        doc.text(`Doctor: Dr. ${data.doctorName}`, 300, 180);

        // Status Badge
        doc.rect(450, 40, 100, 30).fill(data.status === 'PAID' ? '#dcfce7' : '#fee2e2');
        doc.fillColor(data.status === 'PAID' ? '#166534' : '#991b1b')
            .fontSize(14)
            .text(data.status, 475, 48, { width: 100 });

        doc.fillColor('black'); // Reset color

        // Items
        doc.moveDown(4);
        doc.lineWidth(1).moveTo(50, 250).lineTo(550, 250).stroke();
        doc.fontSize(12).font('Helvetica-Bold').text('Description', 60, 260);
        doc.text('Amount', 450, 260);
        doc.lineWidth(1).moveTo(50, 280).lineTo(550, 280).stroke();

        doc.font('Helvetica').text('Medical Consultation', 60, 300);
        doc.text(`$${data.amount.toFixed(2)}`, 450, 300);

        // Total
        doc.lineWidth(1).moveTo(350, 350).lineTo(550, 350).stroke();
        doc.font('Helvetica-Bold').fontSize(14).text('Total:', 350, 360);
        doc.text(`$${data.amount.toFixed(2)}`, 450, 360);

        // Footer
        doc.fontSize(10).font('Helvetica').text('Thank you for visiting.', 50, 700, { align: 'center' });
        if (data.cashierName) {
            doc.text(`Processed by: ${data.cashierName}`, 50, 720, { align: 'center' });
        }

        doc.end();
    }
}
