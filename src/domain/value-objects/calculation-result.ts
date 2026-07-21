import { DiscountType } from '../entities/promo-code.types';

export class CalculationResult {
  discountAmount: number;
  discountType: DiscountType;
  originalSubtotal: number;
  finalSubtotal: number;

  constructor(
    discountAmount: number,
    discountType: DiscountType,
    originalSubtotal: number,
  ) {
    if (discountAmount > originalSubtotal) {
      throw new Error(`Descuento (${discountAmount}) no puede exceder subtotal (${originalSubtotal})`);
    }
    this.discountAmount = discountAmount;
    this.discountType = discountType;
    this.originalSubtotal = originalSubtotal;
    this.finalSubtotal = originalSubtotal - discountAmount;
  }

  getDiscountPercentage(): number {
    if (this.originalSubtotal === 0) return 0;
    return (this.discountAmount / this.originalSubtotal) * 100;
  }
}
