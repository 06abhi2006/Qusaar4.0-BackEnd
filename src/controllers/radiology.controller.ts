import { Request, Response } from 'express';
import { RadiologyService } from '../services/radiology.service';
import { RadiologyStatus } from '@prisma/client';

export const RadiologyController = {
    async getRequests(req: Request, res: Response) {
        try {
            const status = req.query.status as RadiologyStatus;
            const requests = await RadiologyService.getRequests(status);
            res.json(requests);
        } catch (error: any) {
            res.status(500).json({ message: error.message || 'Failed to fetch radiology requests' });
        }
    },

    async createRequest(req: Request, res: Response) {
        try {
            const request = await RadiologyService.createRequest(req.body);
            res.status(201).json(request);
        } catch (error: any) {
            res.status(400).json({ message: error.message || 'Failed to create radiology request' });
        }
    },

    async updateRequest(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const request = await RadiologyService.updateRequest(id, req.body);
            res.json(request);
        } catch (error: any) {
            res.status(400).json({ message: error.message || 'Failed to update radiology request' });
        }
    }
};
