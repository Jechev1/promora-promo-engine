import { Injectable } from '@nestjs/common';
import { ValidationPipeline } from '../validation/validation-pipeline';
import { DiscountCalculator } from '../calculation/discount-calculator';
import { IPromoCodeRepository } from '../../domain/interfaces/promo-code.repository';
import { IPromoCodeUsageRepository } from '../../domain/interfaces/promo-code-usage.repository';
import { ValidationResult } from '../../domain/value-objects/validation-result';
import { CalculationResult } from '../../domain/value-objects/calculation-result';
import { OrderableInterface } from '../../domain/interfaces/orderable.interface';
import { PromoCodeUsage } from '../../domain/entities/promo-code-usage.entity';
import { v4 as uuid } from 'uuid';

@Injectable()
export class PromoCodeEngine {
  constructor(
    private validationPipeline: ValidationPipeline,
    private discountCalculator: DiscountCalculator,
    private promoCodeRepository: IPromoCodeRepository,
    private usageRepository: IPromoCodeUsageRepository,
  ) {}

  async validate(
    code: string,
    order: OrderableInterface,
    buyer?: any,
  ): Promise<ValidationResult> {
    try {
      const promoCode = await this.promoCodeRepository.findByCode(code);

      if (!promoCode) {
        return ValidationResult.failure('INVALID_CODE' as any, 'El código no existe');
      }

      const orderContext = order.getOrderContext();

      const result = await this.validationPipeline.execute({
        promoCode,
        orderContext,
      });

      return result;
    } catch (error) {
      return ValidationResult.failure('VALIDATION_ERROR' as any, error.message);
    }
  }

  async calculate(
    code: string,
    order: OrderableInterface,
    buyer?: any,
  ): Promise<CalculationResult | ValidationResult> {
    const validation = await this.validate(code, order, buyer);

    if (!validation.isValid) {
      return validation as any;
    }

    try {
      const promoCode = await this.promoCodeRepository.findByCode(code);

      if (!promoCode) {
        return ValidationResult.failure('INVALID_CODE' as any, 'El código no existe');
      }

      const result = this.discountCalculator.calculate(promoCode, order);
      return result;
    } catch (error) {
      return ValidationResult.failure('CALCULATION_ERROR' as any, error.message);
    }
  }

  async apply(
    code: string,
    orderId: string,
    order: OrderableInterface,
    buyer?: any,
  ): Promise<{ success: boolean; usageId?: string; discount?: CalculationResult; error?: string }> {
    try {
      const calcResult = await this.calculate(code, order, buyer);

      if (calcResult instanceof ValidationResult) {
        return { success: false, error: calcResult.message };
      }

      const promoCode = await this.promoCodeRepository.findByCode(code);

      if (!promoCode) {
        return { success: false, error: 'El código no existe' };
      }

      const usage = new PromoCodeUsage(
        uuid(),
        promoCode.id,
        orderId,
        order.getBuyer().id,
        calcResult.discountAmount,
        false,
      );

      const savedUsage = await this.usageRepository.create(usage);

      return {
        success: true,
        usageId: savedUsage.id,
        discount: calcResult,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
