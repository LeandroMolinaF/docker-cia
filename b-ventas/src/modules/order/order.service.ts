import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, OrderStatus, Role } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(userId: string, dto: CreateOrderDto, idempotencyKey: string) {
    if (!dto.items?.length) throw new BadRequestException('items is required');
    if (new Set(dto.items.map((i) => i.productId)).size !== dto.items.length) {
      throw new BadRequestException('Duplicate productId in items');
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: {
          id: { in: dto.items.map((i) => i.productId) },
          deletedAt: null,
          active: true,
        },
        select: { id: true, priceCents: true, currency: true, stock: true },
      });

      if (products.length !== dto.items.length) {
        throw new BadRequestException(
          'One or more products are invalid/unavailable',
        );
      }

      const itemsData = dto.items.map((it) => {
        const p = products.find((pp) => pp.id === it.productId)!;
        if (it.qty <= 0) throw new BadRequestException('qty must be > 0');
        if (p.stock < it.qty) {
          throw new BadRequestException(
            `Insufficient stock for product ${it.productId}`,
          );
        }
        return {
          productId: p.id,
          qty: it.qty,
          unitPriceCents: p.priceCents,
          currency: p.currency,
        };
      });

      const subtotal = itemsData.reduce(
        (acc, i) => acc + i.unitPriceCents * i.qty,
        0,
      );
      const total = subtotal;
      const order = await tx.order.create({
        data: {
          userId,
          status: OrderStatus.PENDING,
          subtotalCents: subtotal,
          totalCents: total,
          currency: 'CLP',
          notes: dto.notes ?? null,
          items: { createMany: { data: itemsData } },
        },
        select: this.orderSelect(),
      });

      for (const i of itemsData) {
        await tx.product.update({
          where: { id: i.productId },
          data: { stock: { decrement: i.qty } },
        });
      }

      await tx.idempotency.create({
        data: {
          key: idempotencyKey,
          endpoint: 'POST /v1/orders',
          userId,
          response: order,
        },
      });

      return order;
    });

    return created;
  }

  async listMine(userId: string, q: QueryOrderDto) {
    const { page, size, status, dateFrom, dateTo } = q;
    const where: Prisma.OrderWhereInput = {
      userId,
      ...(status ? { status } : {}),
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              gte: dateFrom ? new Date(dateFrom) : undefined,
              lte: dateTo ? new Date(dateTo) : undefined,
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * size,
        take: size,
        select: this.orderSelect(),
      }),
      this.prisma.order.count({ where }),
    ]);

    return { page, size, total, pages: Math.ceil(total / size), items };
  }

  async listAll(q: QueryOrderDto) {
    const { page, size, status, dateFrom, dateTo, customerId } = q;
    const where: Prisma.OrderWhereInput = {
      ...(status ? { status } : {}),
      ...(customerId ? { userId: customerId } : {}),
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              gte: dateFrom ? new Date(dateFrom) : undefined,
              lte: dateTo ? new Date(dateTo) : undefined,
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * size,
        take: size,
        select: this.orderSelect(true),
      }),
      this.prisma.order.count({ where }),
    ]);

    return { page, size, total, pages: Math.ceil(total / size), items };
  }

  async getByIdAuthz(user: { sub: string; role: Role }, id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: this.orderSelect(true),
    });
    if (!order) throw new NotFoundException('Order not found');
    if (user.role === 'CUSTOMER' && order.userId !== user.sub) {
      throw new ForbiddenException();
    }
    return order;
  }

  async cancel(user: { sub: string; role: Role }, id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
        items: { select: { productId: true, qty: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    const isOwner = order.userId === user.sub;
    const isStaff = user.role === 'ADMIN' || user.role === 'STAFF';
    if (!isOwner && !isStaff) throw new ForbiddenException();

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only PENDING orders can be canceled');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELED },
        select: this.orderSelect(),
      });

      for (const it of order.items) {
        await tx.product.update({
          where: { id: it.productId },
          data: { stock: { increment: it.qty } },
        });
      }
      return res;
    });

    return updated;
  }

  async confirm(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true, confirmedAt: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only PENDING orders can be confirmed');
    }
    if (order.confirmedAt) {
      return await this.prisma.order.findUnique({
        where: { id },
        select: this.orderSelect(),
      });
    }

    return this.prisma.order.update({
      where: { id },
      data: { confirmedAt: new Date() },
      select: this.orderSelect(),
    });
  }

  private orderSelect(withUser = false) {
    return {
      id: true,
      userId: true,
      status: true,
      subtotalCents: true,
      totalCents: true,
      currency: true,
      notes: true,
      confirmedAt: true,
      createdAt: true,
      updatedAt: true,
      ...(withUser
        ? {
            user: { select: { id: true, email: true, name: true } },
          }
        : {}),
      items: {
        select: {
          id: true,
          productId: true,
          qty: true,
          unitPriceCents: true,
          currency: true,
          product: { select: { name: true, sku: true } },
        },
      },
    } as const;
  }
}
