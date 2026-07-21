import { ValidationRule } from '../validation-rule';
import { ValidationContext } from '../../../../domain/value-objects/validation-context';
import { ValidationResult } from '../../../../domain/value-objects/validation-result';
import { ErrorCode } from '../../../../domain/errors/error-codes';
import { RuleType } from '../../../../domain/entities/promo-code.types';
import { IPromoCodeUsageRepository } from '../../../../domain/interfaces/promo-code-usage.repository';

export class GlobalAmountLimitRule extends ValidationRule {
  constructor(private readonly usageRepo: IPromoCodeUsageRepository) {
    super();
  }

  protected async validate(
    context: ValidationContext,
  ): Promise<ValidationResult> {
    const rule = context.promo?.getRule(RuleType.GLOBAL_AMOUNT_LIMIT);
    if (!rule) return ValidationResult.success();

    const maxTotal = Number(rule.parameters.maxTotalAmount ?? 0);

    const total = await this.usageRepo.sumPaidDiscountByCode(
      context.promo!.id,
    );

    if (total >= maxTotal) {
      return ValidationResult.failure(ErrorCode.MAXIMUM_DISCOUNT_REACHED);
    }
    return ValidationResult.success();
  }
}
