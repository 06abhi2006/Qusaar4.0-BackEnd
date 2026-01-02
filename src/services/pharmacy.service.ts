import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const PharmacyService = {
    // Get all inventory items
    async getAllInventory() {
        return prisma.pharmacyInventory.findMany({
            orderBy: { name: 'asc' }
        });
    },

    // Add new inventory item
    async addInventory(data: {
        name: string;
        category?: string;
        stock: number;
        unitPrice: number;
        batchNumber?: string;
        expiryDate?: string | Date; // Can accept string or Date
    }) {
        return prisma.pharmacyInventory.create({
            data: {
                name: data.name,
                category: data.category,
                stock: data.stock,
                unitPrice: data.unitPrice,
                batchNumber: data.batchNumber,
                expiryDate: data.expiryDate ? new Date(data.expiryDate) : null
            }
        });
    },

    // Update stock or details
    async updateInventory(id: string, data: {
        stock?: number;
        unitPrice?: number;
        batchNumber?: string;
        expiryDate?: string | Date;
    }) {
        return prisma.pharmacyInventory.update({
            where: { id },
            data: {
                ...data,
                expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined
            }
        });
    },

    // Delete item (optional, or just set stock to 0)
    async deleteInventory(id: string) {
        return prisma.pharmacyInventory.delete({
            where: { id }
        });
    },

    // Check for low stock items (e.g., less than 10)
    async getLowStockItems(threshold: number = 10) {
        return prisma.pharmacyInventory.findMany({
            where: {
                stock: { lte: threshold }
            }
        });
    }
};
