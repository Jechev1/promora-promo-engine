import { Injectable } from '@nestjs/common';
import { IDiscountStrategy } from '../discount-strategy.interface';
import { DiscountType } from '../../../domain/entities/promo-code.types';
import { PromoCode } from '../../../domain/entities/promo-code';
import { OrderableInterface } from '../../../domain/interfaces/orderable.interface';
import { TierConfiguration } from '../../../domain/entities/tier-configuration';

@Injectable()
export class TieredDiscountStrategy implements IDiscountStrategy {
  calculate(promo: PromoCode, order: OrderableInterface): number {
    const tiers = promo.tiers;
    if (!tiers) {
      return 0;
    }

    const context = order.getOrderContext();
    const buyer = context.buyerProfile;
    if (!buyer) {
      return 0;
    }

    const orderCount = buyer.totalOrders;
    if (orderCount === undefined || orderCount === null) {
      return 0;
    }

    const sortedTiers = [...tiers].sort((a, b) => b.minOrders - a.minOrders);
    const applicableTier = sortedTiers.find((tier) => tier.minOrders <= orderCount);

    if (!applicableTier) {
      return 0;
    }

    const subtotal = order.getSubtotal();
    return subtotal * (applicableTier.discountPercent / 100);
  }

  canHandle(type: DiscountType): boolean {
    return type === DiscountType.TIERED;
  }
}
