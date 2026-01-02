import { Router, Request, Response } from 'express';
import { BillService } from '../services/bill.service';
import { PDFService } from '../services/pdf.service';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Middleware: Authenticate and ensure role is 'cashier' (or admin)
router.use(authenticate);
router.use(requireRole('cashier', 'admin'));

/**
 * GET /api/cashier/bills
 * Search Pending Bills
 */
router.get('/bills', async (req: Request, res: Response) => {
    try {
        const { search } = req.query;
        const bills = await BillService.getPendingBills(search as string);
        return res.json(bills);
    } catch (error: any) {
        return res.status(500).json({ message: error.message || 'Failed to fetch bills' });
    }
});

/**
 * POST /api/cashier/bills/:id/pay
 * Mark Bill as Paid
 */
router.post('/bills/:id/pay', async (req: Request, res: Response) => {
    try {
        // req.user.id is the User ID (from JWT)
        const bill = await BillService.markAsPaid(req.params.id, req.user!.id);
        return res.json({ message: 'Payment successful', bill });
    } catch (error: any) {
        return res.status(400).json({ message: error.message || 'Payment failed' });
    }
});

/**
 * GET /api/cashier/bills/:id/pdf
 * Generate Bill PDF
 */
router.get('/bills/:id/pdf', async (req: Request, res: Response) => {
    try {
        const bill = await BillService.getBillById(req.params.id);
        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }

        // Only allow download if PAID? Or allow viewing UNPAID?
        // Usually a "Receipt" is for PAID, "Invoice" is for UNPAID.
        // For now, let's generate it regardless, but label it based on status.

        const stream = res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment;filename=bill_${bill.id}.pdf`,
        });

        return PDFService.generateBillPDF(
            {
                hospitalName: 'Qusaar Hospital',
                address: '123 Health St, Wellness City',
                billId: bill.id,
                date: bill.paymentDate || bill.createdAt,
                patientName: bill.patient.user.name,
                doctorName: bill.doctor.user.name,
                amount: bill.amount,
                status: bill.status,
                cashierName: bill.cashier?.user.name
            },
            (chunk) => stream.write(chunk),
            () => stream.end()
        );

    } catch (error: any) {
        console.error('PDF Generation Error:', error);
        if (!res.headersSent) {
            return res.status(500).json({ message: 'Failed to generate PDF' });
        }
    }
});

export default router;
