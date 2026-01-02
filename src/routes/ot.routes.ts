import { Router } from 'express';
import { OTController } from '../controllers/ot.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// View: Admin, Doctor, Nurse, Staff
router.get('/', requireRole('admin', 'doctor', 'nurse', 'receptionist'), OTController.getOperations);

// Schedule: Admin, Doctor
router.post('/schedule', requireRole('admin', 'doctor'), OTController.scheduleOperation);

// Update Status: Admin, Doctor, Nurse
router.put('/:id/status', requireRole('admin', 'doctor', 'nurse'), OTController.updateStatus);

export default router;
