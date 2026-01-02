import { Router } from 'express';
import { RadiologyController } from '../controllers/radiology.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// View: Admin, Doctor, Radiologist
router.get('/requests', requireRole('admin', 'doctor', 'radiologist'), RadiologyController.getRequests);

// Create: Doctor
router.post('/requests', requireRole('admin', 'doctor'), RadiologyController.createRequest);

// Update: Radiologist
router.put('/requests/:id', requireRole('admin', 'radiologist'), RadiologyController.updateRequest);

export default router;
