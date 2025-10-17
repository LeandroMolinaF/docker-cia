import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { Prisma } from '@prisma/client';
import { QueryAdjustmentsDto } from './dto/query-adjustments.dto';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: DatabaseService) {}

  async getInventory(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        active: true,
        deletedAt: true,
      },
    });
    if (!product || product.deletedAt)
      throw new NotFoundException('Product not found');
    return {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      stock: product.stock,
      active: product.active,
    };
  }

  async adjust(
    userId: string,
    dto: AdjustInventoryDto,
    idempotencyKey: string,
  ) {
    if (dto.delta === 0) {
      throw new BadRequestException('delta must be non-zero');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: dto.productId },
        select: { id: true, stock: true, deletedAt: true },
      });
      if (!product || product.deletedAt)
        throw new NotFoundException('Product not found');

      const newStock = product.stock + dto.delta;
      if (newStock < 0 && !dto.allowNegative) {
        throw new BadRequestException('Resulting stock would be negative');
      }

      const updated = await tx.product.update({
        where: { id: dto.productId },
        data: { stock: { increment: dto.delta } },
        select: { id: true, stock: true },
      });

      const adjustment = await tx.inventoryAdjustment.create({
        data: {
          productId: dto.productId,
          userId,
          delta: dto.delta,
          reason: dto.reason,
          note: dto.note ?? null,
          idempotencyKey,
        },
        select: {
          id: true,
          productId: true,
          userId: true,
          delta: true,
          reason: true,
          note: true,
          createdAt: true,
        },
      });

      await tx.idempotency.create({
        data: {
          key: idempotencyKey,
          endpoint: 'POST /v1/inventory/adjust',
          userId,
          response: { adjustment, product: updated },
        },
      });

      return { adjustment, product: updated };
    });

    return result;
  }

  async listAdjustments(q: QueryAdjustmentsDto) {
    const { productId, userId, reason, dateFrom, dateTo, page, size, sort } = q;

    const where: Prisma.InventoryAdjustmentWhereInput = {
      ...(productId ? { productId } : {}),
      ...(userId ? { userId } : {}),
      ...(reason ? { reason } : {}),
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              gte: dateFrom ? new Date(dateFrom) : undefined,
              lte: dateTo ? new Date(dateTo) : undefined,
            },
          }
        : {}),
    };

    const orderBy = this.buildOrderBy(sort);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.inventoryAdjustment.findMany({
        where,
        orderBy,
        skip: (page - 1) * size,
        take: size,
        select: {
          id: true,
          productId: true,
          delta: true,
          reason: true,
          note: true,
          userId: true,
          createdAt: true,
          product: { select: { sku: true, name: true } },
          user: { select: { email: true, name: true } },
        },
      }),
      this.prisma.inventoryAdjustment.count({ where }),
    ]);

    return {
      page,
      size,
      total,
      pages: Math.ceil(total / size),
      items,
    };
  }

  private buildOrderBy(
    sort?: string,
  ): Prisma.InventoryAdjustmentOrderByWithRelationInput[] {
    if (!sort) return [{ createdAt: 'desc' }];
    const parts = sort.split(',').map((s) => s.trim());
    const allowedFields = new Set(['createdAt', 'delta', 'reason']);
    const allowedDir = new Set(['asc', 'desc']);
    const orderBy: Prisma.InventoryAdjustmentOrderByWithRelationInput[] = [];
    for (const p of parts) {
      const [field, dirRaw] = p.split(':').map((x) => x.trim());
      const dir = (dirRaw || 'asc').toLowerCase();
      if (!allowedFields.has(field) || !allowedDir.has(dir)) continue;
      orderBy.push({ [field]: dir as Prisma.SortOrder });
    }
    return orderBy.length ? orderBy : [{ createdAt: 'desc' }];
  }
}
