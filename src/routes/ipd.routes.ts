import { Router } from 'express';
import { IPDController } from '../controllers/ipd.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// --- Wards & Beds ---
router.get('/wards', IPDController.getAllWards);
router.get('/wards/:id', IPDController.getWardById);
router.post('/wards', requireRole('admin'), IPDController.createWard);

// --- Admissions ---
router.post('/admit', requireRole('doctor', 'admin', 'nurse'), IPDController.admitPatient);
router.get('/admissions/active', requireRole('doctor', 'admin', 'nurse', 'receptionist'), IPDController.getActiveAdmissions);
router.put('/discharge/:id', requireRole('doctor', 'admin'), IPDController.dischargePatient);

export default router;
