import { v4 as uuid } from 'uuid';
import { ValidationEngine } from './validation-engine';
import { MandatoryValidationPipeline } from '../validation/pipelines/mandatory-validation.pipeline';
import { DynamicValidationPipeline } from '../validation/pipelines/dynamic-validation.pipeline';
import {
  DiscountCalculator,
  CalculationResult,
} from '../calculation/discount-calculator';
import { ValidationContext } from '../../domain/value-objects/validation-context';
import { ValidationResult } from '../../domain/value-objects/validation-result';
import { OrderableInterface } from '../../domain/interfaces/orderable.interface';
import { BuyerProfile } from '../../domain/entities/buyer-profile';
import { PromoCodeUsage } from '../../domain/entities/promo-code-usage';
import type { IPromoCodeRepository } from '../../domain/interfaces/promo-code.repository';
import type { IPromoCodeUsageRepository } from '../../domain/interfaces/promo-code-usage.repository';
import { ErrorCode } from '../../domain/errors/error-codes';
import { DuplicatePromoUsageError } from '../../domain/errors/duplicate-promo-usage.error';

export interface PromoCodeResult {
  validation: ValidationResult;
  calculation: CalculationResult | null;
}

export class PromoCodeEngine {
  private readonly applyQueues = new Map<string, Promise<void>>();
  private validationEngine: ValidationEngine;

  constructor(
    mandatoryPipeline: MandatoryValidationPipeline,
    dynamicPipeline: DynamicValidationPipeline,
    private readonly discountCalculator: DiscountCalculator,
    private readonly promoCodeRepository: IPromoCodeRepository,
    private readonly usageRepo: IPromoCodeUsageRepository,
  ) {
    this.validationEngine = new ValidationEngine(mandatoryPipeline, dynamicPipeline);
  }

  async validate(
    promoCodeString: string,
    order: OrderableInterface,
    buyer: BuyerProfile,
  ): Promise<ValidationResult> {
    const context = new ValidationContext(promoCodeString, order, buyer);
    return this.validationEngine.validate(context);
  }

  async validateAndCalculate(
    promoCodeString: string,
    order: OrderableInterface,
    buyer: BuyerProfile,
  ): Promise<PromoCodeResult> {
    return this.calculate(promoCodeString, order, buyer);
  }

  async calculate(
    promoCodeString: string,
    order: OrderableInterface,
    buyer: BuyerProfile,
  ): Promise<PromoCodeResult> {
    const context = new ValidationContext(promoCodeString, order, buyer);
    const validation = await this.validationEngine.validate(context);

    if (!validation.isValid || !context.promo) {
      return { validation, calculation: null };
    }

    const calculation = this.discountCalculator.calculate(context.promo, order);
    return { validation, calculation };
  }

  // El uso permanece pendiente hasta que el proceso de pago lo confirme.
  async validateAndApply(
    promoCodeString: string,
    orderId: string,
    order: OrderableInterface,
    buyer: BuyerProfile,
    isPaid: boolean,
  ): Promise<PromoCodeResult> {
    return this.apply(promoCodeString, orderId, order, buyer, isPaid);
  }

  async apply(
    promoCodeString: string,
    orderId: string,
    order: OrderableInterface,
    buyer: BuyerProfile,
    isPaid: boolean,
  ): Promise<PromoCodeResult> {
    const normalizedCode =
      typeof promoCodeString === 'string'
        ? promoCodeString.trim().toUpperCase()
        : '';
    const key = `${normalizedCode}:${orderId}`;
    return this.withApplyLock(key, () =>
      this.usageRepo.runSerializable(async (transactionalUsageRepo) => {
        const context = new ValidationContext(promoCodeString, order, buyer);
        const validation = await this.validationEngine.validate(context);
        if (!validation.isValid || !context.promo)
          return { validation, calculation: null };
        if (
          await transactionalUsageRepo.existsByCodeAndOrder(
            context.promo.id,
            orderId,
          )
        ) {
          return {
            validation: ValidationResult.failure(ErrorCode.CODE_ALREADY_USED),
            calculation: null,
          };
        }
        const calculation = this.discountCalculator.calculate(
          context.promo,
          order,
        );
        try {
          await transactionalUsageRepo.save(
            new PromoCodeUsage(
              uuid(),
              context.promo.id,
              orderId,
              buyer.buyerId,
              calculation.discountAmount,
              isPaid,
            ),
          );
        } catch (error) {
          if (error instanceof DuplicatePromoUsageError)
            return {
              validation: ValidationResult.failure(ErrorCode.CODE_ALREADY_USED),
              calculation: null,
            };
          throw error;
        }
        return { validation, calculation };
      }),
    );
  }

  private async withApplyLock<T>(
    key: string,
    action: () => Promise<T>,
  ): Promise<T> {
    const previous = this.applyQueues.get(key) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    const queued = previous.then(() => current);
    this.applyQueues.set(key, queued);
    await previous;
    try {
      return await action();
    } finally {
      release();
      if (this.applyQueues.get(key) === queued) this.applyQueues.delete(key);
    }
  }
}
