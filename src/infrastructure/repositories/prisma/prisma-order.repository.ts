import { OrderType as PrismaOrderType } from '@prisma/client';
import { BuyerProfile } from '../../../domain/entities/buyer-profile';
import { Order } from '../../../domain/entities/order';
import { OrderStatus } from '../../../domain/entities/order-status';
import { ProductOrder } from '../../../domain/entities/product-order';
import { ServiceOrder } from '../../../domain/entities/service-order';
import { SubscriptionOrder } from '../../../domain/entities/subscription-order';
import { IOrderRepository } from '../../../domain/interfaces/order.repository';
import { OrderContext } from '../../../domain/value-objects/order-context';
import { PrismaService } from '../../prisma/prisma.service';

export class PrismaOrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findById(id: string): Promise<Order | null> {
    const row = await this.prisma.order.findUnique({
      where: { id },
      include: { buyer: true },
    });
    if (!row) return null;
    const currentOrders = await this.prisma.order.findMany({
      where: {
        buyerId: row.buyerId,
        status: { in: ['draft', 'cart', 'pending', 'cancelled'] },
      },
      select: { id: true },
    });
    const paidCount = await this.countPaidByBuyer(row.buyerId);
    const buyer = new BuyerProfile(row.buyer.id, paidCount, paidCount === 0);
    const context = new OrderContext(
      row.id,
      row.buyerId,
      row.subtotal.toNumber(),
      row.categoryId ? [row.categoryId] : [],
      buyer,
    );
    const args: ConstructorParameters<typeof Order> = [
      row.id,
      row.subtotal.toNumber(),
      context,
      row.status as OrderStatus,
    ];
    if (row.type === PrismaOrderType.product) return new ProductOrder(...args);
    if (row.type === PrismaOrderType.subscription)
      return new SubscriptionOrder(...args);
    return new ServiceOrder(...args);
  }
  async save(order: Order): Promise<void> {
    const context = order.getOrderContext();
    await this.prisma.buyerProfile.upsert({
      where: { id: context.buyerProfile.buyerId },
      create: {
        id: context.buyerProfile.buyerId,
        totalOrders: context.buyerProfile.totalOrders,
        isFirstBuyer: context.buyerProfile.isFirstBuyer,
      },
      update: {
        totalOrders: context.buyerProfile.totalOrders,
        isFirstBuyer: context.buyerProfile.isFirstBuyer,
      },
    });
    const categoryId = context.categories[0] || 'default';
    await this.prisma.category.upsert({
      where: { id: categoryId },
      create: { id: categoryId, name: categoryId },
      update: {},
    });
    const type =
      order instanceof ProductOrder
        ? PrismaOrderType.product
        : order instanceof SubscriptionOrder
          ? PrismaOrderType.subscription
          : PrismaOrderType.service;
    await this.prisma.order.upsert({
      where: { id: order.id },
      create: {
        id: order.id,
        buyerId: context.buyerProfile.buyerId,
        categoryId: categoryId,
        subtotal: order.getSubtotal(),
        status: order.status,
        type,
      },
      update: {
        buyerId: context.buyerProfile.buyerId,
        categoryId: categoryId,
        subtotal: order.getSubtotal(),
        status: order.status,
        type,
      },
    });
  }
  countPaidByBuyer(
    buyerId: string,
    excludeOrderIds: readonly string[] = [],
  ): Promise<number> {
    return this.prisma.order.count({
      where: { buyerId, status: 'paid', id: { notIn: [...excludeOrderIds] } },
    });
  }
}
