import { Injectable } from '@nestjs/common';
import type { IPromoCodeRepository } from '../../domain/interfaces/promo-code.repository';
import type { IPromoCodeUsageRepository } from '../../domain/interfaces/promo-code-usage.repository';
import { ValidationPipeline } from '../validation/pipelines/validation-pipeline';
import { DiscountCalculator } from '../calculation/discount-calculator';
import { ValidationResult } from '../../domain/value-objects/validation-result';
import { CalculationResult } from '../../domain/value-objects/calculation-result';
import { ValidationContext } from '../../domain/value-objects/validation-context';
import { OrderableInterface } from '../../domain/interfaces/orderable.interface';
import { PromoCodeUsage } from '../../domain/entities/promo-code-usage';
import { v4 as uuid } from 'uuid';

@Injectable()
export class PromoCodeEngine {
  constructor(
    private mandatoryPipeline: ValidationPipeline,
    private dynamicPipeline: ValidationPipeline,
    private discountCalculator: DiscountCalculator,
    private promoCodeRepository: IPromoCodeRepository,
    private usageRepository: IPromoCodeUsageRepository,
  ) {}

  private getErrorMessage(error: any): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Error desconocido';
  }

  async validate(
    code: string,
    order: OrderableInterface,
    buyer?: any,
  ): Promise<ValidationResult> {
    try {
      const promoCode = await this.promoCodeRepository.findByCode(code);

      if (!promoCode) {
        return ValidationResult.failure('INVALID_CODE' as any);
      }

      const orderContext = order.getOrderContext();
      const context = new ValidationContext(
        code,
        order,
        orderContext.buyerProfile,
        promoCode,
      );

      const mandatoryResult = await this.mandatoryPipeline.execute(context);
      if (!mandatoryResult.isValid) {
        return mandatoryResult;
      }

      const dynamicResult = await this.dynamicPipeline.execute(context);
      return dynamicResult;
    } catch (error) {
      return ValidationResult.failure('VALIDATION_ERROR' as any);
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
        return ValidationResult.failure('INVALID_CODE' as any);
      }

      const result = this.discountCalculator.calculate(promoCode, order);
      return result;
    } catch (error) {
      return ValidationResult.failure('CALCULATION_ERROR' as any);
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
        return { success: false, error: 'Validación fallida' };
      }

      const promoCode = await this.promoCodeRepository.findByCode(code);

      if (!promoCode) {
        return { success: false, error: 'El código no existe' };
      }

      const usage = new PromoCodeUsage(
        uuid(),
        promoCode.id,
        orderId,
        order.getOrderContext().buyerProfile.buyerId,
        calcResult.discountAmount,
        false,
      );

      await this.usageRepository.save(usage);

      return {
        success: true,
        usageId: usage.id,
        discount: calcResult,
      };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error) };
    }
  }
}
