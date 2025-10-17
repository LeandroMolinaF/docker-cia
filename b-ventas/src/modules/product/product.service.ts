import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: DatabaseService) {}

  async findAll(q: QueryProductDto) {
    const {
      q: text,
      category,
      minPrice,
      maxPrice,
      inStock,
      page,
      size,
      sort,
      includeInactive,
    } = q;

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(includeInactive ? {} : { active: true }),
      ...(typeof inStock === 'boolean'
        ? { stock: inStock ? { gt: 0 } : 0 }
        : {}),
      ...(category
        ? ({
            category: { equals: category },
          } as Prisma.ProductWhereInput)
        : {}),
      ...(text
        ? {
            OR: [
              {
                name: { contains: text, mode: 'insensitive' },
              } as Prisma.ProductWhereInput,
              {
                sku: { contains: text, mode: 'insensitive' },
              } as Prisma.ProductWhereInput,
              {
                description: { contains: text, mode: 'insensitive' },
              } as Prisma.ProductWhereInput,
            ],
          }
        : {}),
    };

    const orderBy = this.buildOrderBy(sort);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * size,
        take: size,
        select: {
          id: true,
          name: true,
          sku: true,
          priceCents: true,
          currency: true,
          description: true,
          category: true,
          image: true,
          stock: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      page,
      size,
      total,
      pages: Math.ceil(total / size),
      items,
    };
  }

  async findOnePublic(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null, active: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateProductDto) {
    try {
      return await this.prisma.product.create({
        data: {
          name: dto.name,
          sku: dto.sku,
          priceCents: dto.priceCents,
          currency: dto.currency ?? 'CLP',
          description: dto.description ?? null,
          category: dto.category ?? null,
          image: dto.image ?? '',
          stock: dto.stock ?? 0,
          active: dto.active ?? true,
        },
      });
    } catch (e) {
      if (this.isUniqueViolation(e, 'Product_sku_key')) {
        throw new BadRequestException('SKU already exists');
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateProductDto) {
    const exists = await this.prisma.product.findUnique({ where: { id } });
    if (!exists || exists.deletedAt)
      throw new NotFoundException('Product not found');

    try {
      return await this.prisma.product.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.sku !== undefined ? { sku: dto.sku } : {}),
          ...(dto.priceCents !== undefined
            ? { priceCents: dto.priceCents }
            : {}),
          ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description }
            : {}),
          ...(dto.category !== undefined ? { category: dto.category } : {}),
          ...(dto.image !== undefined ? { image: dto.image } : {}),
          ...(dto.stock !== undefined ? { stock: dto.stock } : {}),
          ...(dto.active !== undefined ? { active: dto.active } : {}),
        },
      });
    } catch (e) {
      if (this.isUniqueViolation(e, 'Product_sku_key')) {
        throw new BadRequestException('SKU already exists');
      }
      throw e;
    }
  }

  async softDelete(id: string) {
    const exists = await this.prisma.product.findUnique({ where: { id } });
    if (!exists || exists.deletedAt)
      throw new NotFoundException('Product not found');

    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), active: false },
      select: { id: true, deletedAt: true, active: true },
    });
  }

  private buildOrderBy(
    sort?: string,
  ): Prisma.ProductOrderByWithRelationInput[] {
    if (!sort) {
      return [{ createdAt: 'desc' }];
    }
    const parts = sort.split(',').map((s) => s.trim());
    const allowed: Record<string, Prisma.SortOrder> = {
      asc: 'asc',
      desc: 'desc',
    };
    const allowedFields = new Set([
      'name',
      'priceCents',
      'createdAt',
      'updatedAt',
      'stock',
    ]);

    const orderBy: Prisma.ProductOrderByWithRelationInput[] = [];
    for (const p of parts) {
      const [field, dirRaw] = p.split(':').map((x) => x.trim());
      const dir = (dirRaw || 'asc').toLowerCase();
      if (!allowedFields.has(field) || !allowed[dir]) continue;
      orderBy.push({ [field]: allowed[dir] });
    }
    return orderBy.length ? orderBy : [{ createdAt: 'desc' }];
  }

  private isUniqueViolation(e: any, constraint: string) {
    return (
      e?.code === 'P2002' &&
      Array.isArray(e?.meta?.target) &&
      e.meta.target.some((t: string) => t.includes('sku'))
    );
  }
}
