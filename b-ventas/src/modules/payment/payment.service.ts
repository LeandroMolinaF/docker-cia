import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, Role, TxStatus } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: DatabaseService) {}

  async createIntent(
    user: { sub: string; role: Role },
    dto: CreatePaymentIntentDto,
    idempotencyKey: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      select: {
        id: true,
        userId: true,
        status: true,
        totalCents: true,
        currency: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    const isOwner = order.userId === user.sub;
    const isStaff = user.role === 'ADMIN' || user.role === 'STAFF';
    if (!isOwner && !isStaff) throw new ForbiddenException();

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        'Only PENDING orders can create payment intent',
      );
    }

    const existingSucceeded = await this.prisma.paymentTransaction.findFirst({
      where: { orderId: order.id, status: TxStatus.SUCCEEDED },
      select: { id: true },
    });
    if (existingSucceeded) {
      throw new BadRequestException('Order is already paid');
    }

    const intent = await this.prisma.$transaction(async (tx) => {
      const created = await tx.paymentTransaction.create({
        data: {
          orderId: order.id,
          provider: 'simulator',
          status: TxStatus.REQUIRES_CONFIRMATION,
          amountCents: order.totalCents,
          currency: order.currency,
          raw: {
            method: dto.method,
            message: 'Simulated intent created. Next step: confirm.',
          },
        },
        select: this.txSelect(),
      });

      await tx.idempotency.create({
        data: {
          key: idempotencyKey,
          endpoint: 'POST /v1/payments/intent',
          userId: user.sub,
          response: created,
        },
      });

      return created;
    });

    return intent;
  }

  async confirm(
    user: { sub: string; role: Role },
    paymentId: string,
    dto: ConfirmPaymentDto,
    idempotencyKey: string,
  ) {
    const tx = await this.prisma.paymentTransaction.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        orderId: true,
        status: true,
        amountCents: true,
        currency: true,
        order: {
          select: {
            id: true,
            userId: true,
            status: true,
            totalCents: true,
            currency: true,
          },
        },
      },
    });
    if (!tx) throw new NotFoundException('Payment not found');

    const isOwner = tx.order.userId === user.sub;
    const isStaff = user.role === 'ADMIN' || user.role === 'STAFF';
    if (!isOwner && !isStaff) throw new ForbiddenException();

    if (tx.status === TxStatus.SUCCEEDED) {
      return this.prisma.paymentTransaction.findUnique({
        where: { id: paymentId },
        select: this.txSelect(true),
      });
    }

    if (tx.status !== TxStatus.REQUIRES_CONFIRMATION) {
      throw new BadRequestException('Payment is not confirmable');
    }

    if (tx.order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order is not pending');
    }
    if (
      tx.amountCents !== tx.order.totalCents ||
      tx.currency !== tx.order.currency
    ) {
      throw new BadRequestException(
        'Payment amount/currency mismatch with order',
      );
    }

    const updated = await this.prisma.$transaction(async (t) => {
      const ok = true; 

      if (ok) {
        const finalTx = await t.paymentTransaction.update({
          where: { id: paymentId },
          data: {
            status: TxStatus.SUCCEEDED,
            raw: {
              ...tx,
              simulator: {
                confirmationToken: dto.confirmationToken ?? null,
                result: 'approved',
              },
            },
          },
          select: this.txSelect(true),
        });

        await t.order.update({
          where: { id: tx.orderId },
          data: { status: OrderStatus.PAID },
        });

        await t.idempotency.create({
          data: {
            key: idempotencyKey,
            endpoint: 'POST /v1/payments/:id/confirm',
            userId: user.sub,
            response: finalTx,
          },
        });

        return finalTx;
      } else {
        const failed = await t.paymentTransaction.update({
          where: { id: paymentId },
          data: {
            status: TxStatus.FAILED,
            raw: { simulator: { result: 'declined' } },
          },
          select: this.txSelect(true),
        });
        return failed;
      }
    });

    return updated;
  }

  async getByIdAuthz(user: { sub: string; role: Role }, id: string) {
    const tx = await this.prisma.paymentTransaction.findUnique({
      where: { id },
      select: {
        ...this.txSelect(true),
        order: { select: { userId: true } },
      },
    });
    if (!tx) throw new NotFoundException('Payment not found');
    const isOwner = tx.order.userId === user.sub;
    const isStaff = user.role === 'ADMIN' || user.role === 'STAFF';
    if (!isOwner && !isStaff) throw new ForbiddenException();
    const { order, ...rest } = tx as any;
    return rest;
  }

  async webhook(signature?: string) {
    if (!signature) {
      throw new BadRequestException('Missing x-simulator-signature');
    }
    return { received: true };
  }

  private txSelect(withOrder = false) {
    return {
      id: true,
      orderId: true,
      provider: true,
      status: true,
      amountCents: true,
      currency: true,
      raw: true,
      createdAt: true,
      updatedAt: true,
      ...(withOrder
        ? {
            order: {
              select: {
                id: true,
                status: true,
                totalCents: true,
                currency: true,
              },
            },
          }
        : {}),
    } as const;
  }
}
