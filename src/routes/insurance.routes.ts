import { Router } from 'express';
import { InsuranceController } from '../controllers/insurance.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// --- Policies ---
// View: Admin, Insurance Officer, Doctor, Receptionist
router.get('/policies', requireRole('admin', 'insurance_officer', 'doctor', 'receptionist'), InsuranceController.getPolicies);
// Add: Admin, Insurance Officer
router.post('/policies', requireRole('admin', 'insurance_officer'), InsuranceController.addPolicy);

// --- Claims ---
// View: Admin, Insurance Officer
router.get('/claims', requireRole('admin', 'insurance_officer'), InsuranceController.getClaims);
// Submit: Admin, Insurance Officer, Cashier (maybe initiated from billing)
router.post('/claims', requireRole('admin', 'insurance_officer', 'cashier'), InsuranceController.submitClaim);
// Process: Admin, Insurance Officer
router.put('/claims/:id/status', requireRole('admin', 'insurance_officer'), InsuranceController.processClaim);

export default router;
