import { Request, Response } from 'express';
import { LabService } from '../services/lab.service';
import { LabStatus } from '@prisma/client';

export const LabController = {
    // --- Tests ---
    async getTests(_req: Request, res: Response) {
        try {
            const tests = await LabService.getAllTests();
            res.json(tests);
        } catch (error: any) {
            res.status(500).json({ message: error.message || 'Failed to fetch tests' });
        }
    },

    async createTest(req: Request, res: Response) {
        try {
            const test = await LabService.createTest(req.body);
            res.status(201).json(test);
        } catch (error: any) {
            res.status(400).json({ message: error.message || 'Failed to create test' });
        }
    },

    // --- Requests ---
    async getRequests(req: Request, res: Response) {
        try {
            const status = req.query.status as LabStatus;
            const requests = await LabService.getRequests(status);
            res.json(requests);
        } catch (error: any) {
            res.status(500).json({ message: error.message || 'Failed to fetch requests' });
        }
    },

    async createRequest(req: Request, res: Response) {
        try {
            const request = await LabService.createRequest(req.body);
            res.status(201).json(request);
        } catch (error: any) {
            res.status(400).json({ message: error.message || 'Failed to create request' });
        }
    },

    async updateResult(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const request = await LabService.updateResult(id, req.body);
            res.json(request);
        } catch (error: any) {
            res.status(400).json({ message: error.message || 'Failed to update result' });
        }
    }
};
