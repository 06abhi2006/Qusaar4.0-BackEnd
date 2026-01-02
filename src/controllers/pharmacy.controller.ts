import { Request, Response } from 'express';
import { PharmacyService } from '../services/pharmacy.service';

export const PharmacyController = {
    async getInventory(_req: Request, res: Response) {
        try {
            const items = await PharmacyService.getAllInventory();
            res.json(items);
        } catch (error: any) {
            res.status(500).json({ message: error.message || 'Failed to fetch inventory' });
        }
    },

    async addInventory(req: Request, res: Response) {
        try {
            const item = await PharmacyService.addInventory(req.body);
            res.status(201).json(item);
        } catch (error: any) {
            res.status(400).json({ message: error.message || 'Failed to add inventory item' });
        }
    },

    async updateInventory(req: Request, res: Response) {
        try {
            const item = await PharmacyService.updateInventory(req.params.id, req.body);
            res.json(item);
        } catch (error: any) {
            res.status(400).json({ message: error.message || 'Failed to update inventory' });
        }
    },

    async getLowStock(req: Request, res: Response) {
        try {
            // Optional query param for threshold
            const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : 10;
            const items = await PharmacyService.getLowStockItems(threshold);
            res.json(items);
        } catch (error: any) {
            res.status(500).json({ message: error.message || 'Failed to fetch low stock items' });
        }
    }
};
