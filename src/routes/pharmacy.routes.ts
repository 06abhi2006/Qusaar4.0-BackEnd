import { Router } from 'express';
import { PharmacyController } from '../controllers/pharmacy.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Protect all routes
router.use(authenticate);

// List inventory: Pharmacist, Admin, Doctor (view only maybe?)
router.get('/inventory', requireRole('pharmacist', 'admin', 'doctor'), PharmacyController.getInventory);

// Low Stock: Pharmacist, Admin
router.get('/low-stock', requireRole('pharmacist', 'admin'), PharmacyController.getLowStock);

// Add Inventory: Pharmacist, Admin
router.post('/inventory', requireRole('pharmacist', 'admin'), PharmacyController.addInventory);

// Update Inventory: Pharmacist, Admin
router.put('/inventory/:id', requireRole('pharmacist', 'admin'), PharmacyController.updateInventory);

export default router;
