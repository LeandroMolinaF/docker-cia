import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { UpdateMeDto } from './dto/update-me.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: DatabaseService) {}

  private baseSelect = {
    id: true,
    email: true,
    name: true,
    role: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  private profileSelect = {
    id: true,
    phone: true,
    billingAddress: true,
    shippingAddress: true,
  } as const;

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...this.baseSelect,
        tokens: false,
        CustomerProfile: false as any,
      } as any,
    });

    if (!user) throw new NotFoundException('User not found');

    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId: userId },
      select: this.profileSelect,
    });

    return { ...user, profile };
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    if (dto.email && !dto.email.includes('@')) {
      throw new BadRequestException('Invalid email');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.email !== undefined ? { email: dto.email } : {}),
        },
        select: this.baseSelect as any,
      });

      const profile = await tx.customerProfile.upsert({
        where: { userId },
        update: {
          ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
          ...(dto.billingAddress !== undefined
            ? { billingAddress: dto.billingAddress || Prisma.DbNull }
            : {}),
          ...(dto.shippingAddress !== undefined
            ? { shippingAddress: dto.shippingAddress || Prisma.DbNull }
            : {}),
        },
        create: {
          userId,
          phone: dto.phone ?? null,
          billingAddress: dto.billingAddress
            ? dto.billingAddress
            : Prisma.DbNull,
          shippingAddress: dto.shippingAddress
            ? dto.shippingAddress
            : Prisma.DbNull,
        },
        select: this.profileSelect,
      });

      return { ...user, profile };
    });

    return result;
  }

  async list(q: QueryCustomerDto) {
    const { q: text, role, dateFrom, dateTo, page, size, sort } = q;

    const where: Prisma.UserWhereInput = {
      ...(role ? { role: role } : {}),
      ...(text
        ? {
            OR: [
              {
                name: { contains: text, mode: 'insensitive' as const },
              } as Prisma.UserWhereInput,
              {
                email: { contains: text, mode: 'insensitive' as const },
              } as Prisma.UserWhereInput,
              {
                CustomerProfile: {
                  phone: {
                    contains: text,
                    mode: 'insensitive' as const,
                  },
                },
              } as Prisma.UserWhereInput,
            ],
          }
        : {}),
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
      this.prisma.user.findMany({
        where,
        orderBy,
        skip: (page - 1) * size,
        take: size,
        select: {
          ...this.baseSelect,
          CustomerProfile: { select: this.profileSelect } as any,
        } as any,
      }),
      this.prisma.user.count({ where }),
    ]);

    const mapped = items.map((u: any) => {
      const { CustomerProfile, ...rest } = u;
      return { ...rest, profile: CustomerProfile ?? null };
    });

    return {
      page,
      size,
      total,
      pages: Math.ceil(total / size),
      items: mapped,
    };
  }

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...this.baseSelect,
        CustomerProfile: { select: this.profileSelect } as any,
      } as any,
    });
    if (!user) throw new NotFoundException('Customer not found');

    const { CustomerProfile, ...rest } = user as any;
    return { ...rest, profile: CustomerProfile ?? null };
  }

  private buildOrderBy(sort?: string): Prisma.UserOrderByWithRelationInput[] {
    if (!sort) return [{ createdAt: 'desc' }];
    const parts = sort.split(',').map((s) => s.trim());

    const allowedFields = new Set(['name', 'email', 'createdAt', 'updatedAt']);
    const allowedDir = new Set(['asc', 'desc']);

    const orderBy: Prisma.UserOrderByWithRelationInput[] = [];
    for (const p of parts) {
      const [field, dirRaw] = p.split(':').map((x) => x.trim());
      const dir = (dirRaw || 'asc').toLowerCase();
      if (!allowedFields.has(field) || !allowedDir.has(dir)) continue;
      orderBy.push({ [field]: dir as Prisma.SortOrder });
    }
    return orderBy.length ? orderBy : [{ createdAt: 'desc' }];
  }
}
