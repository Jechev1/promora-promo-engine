import { BuyerProfile } from '../entities/buyer-profile.entity';

export class OrderContext {
  readonly orderId: string;
  readonly buyerId: string;
  readonly subtotal: number;
  readonly categories: string[];
  readonly buyerProfile: BuyerProfile;

  constructor(
    orderId: string,
    buyerId: string,
    subtotal: number,
    categories: string[],
    buyerProfile: BuyerProfile,
  ) {
    this.orderId = orderId;
    this.buyerId = buyerId;
    this.subtotal = subtotal;
    this.categories = categories;
    this.buyerProfile = buyerProfile;
  }

  hasCategory(categoryId: string): boolean {
    return this.categories.includes(categoryId);
  }

  isFirstTimeOrder(): boolean {
    return this.buyerProfile.isFirstBuyer;
  }

  exceedsGlobalAmountLimit(limit: number): boolean {
    return this.buyerProfile.totalSpent >= limit;
  }

  exceedsOrderLimit(limit: number): boolean {
    return this.buyerProfile.totalOrders >= limit;
  }

  getPreviousOrderCount(): number {
    return this.buyerProfile.totalOrders;
  }
}
