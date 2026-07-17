import { Injectable } from '@nestjs/common';
import { IDiscountStrategy } from '../discount-strategy.interface';
import { DiscountType } from '../../../domain/entities/promo-code.entity';
import { TierConfiguration } from '../../../domain/entities/tier-configuration.entity';

@Injectable()
export class TieredDiscountStrategy implements IDiscountStrategy {
  calculate(
    value: number,
    subtotal: number,
    tiers?: TierConfiguration[],
    orderCount?: number,
  ): number {
    if (!tiers || !orderCount) {
      return 0;
    }

    const sortedTiers = [...tiers].sort((a, b) => b.minOrders - a.minOrders);
    const applicableTier = sortedTiers.find((tier) => tier.appliesFor(orderCount));

    if (!applicableTier) {
      return 0;
    }

    return subtotal * (applicableTier.discountPercent / 100);
  }

  canHandle(type: DiscountType): boolean {
    return type === DiscountType.TIERED;
  }

  getName(): string {
    return 'TieredDiscountStrategy';
  }
}
