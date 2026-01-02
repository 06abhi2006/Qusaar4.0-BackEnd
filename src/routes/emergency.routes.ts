import { Router } from 'express';
import { EmergencyController } from '../controllers/emergency.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Receptionist, Nurse, Admin, Doctor can all access emergency dashboard
router.get('/', requireRole('admin', 'doctor', 'nurse', 'receptionist'), EmergencyController.getActiveCases);

// Registration typically Receptionist or Nurse
router.post('/', requireRole('admin', 'nurse', 'receptionist'), EmergencyController.createCase);

// Triage updates - clinical staff only
router.put('/:id/triage', requireRole('admin', 'doctor', 'nurse'), EmergencyController.updateTriage);

// Status updates - clinical staff
router.put('/:id/status', requireRole('admin', 'doctor', 'nurse'), EmergencyController.updateStatus);

// Assign provider - admin or doctor
router.put('/:id/assign', requireRole('admin', 'doctor'), EmergencyController.assignProvider);

export default router;
