import { ValidationRule } from '../validation-rule';
import { ValidationContext } from '../../../../domain/value-objects/validation-context';
import { ValidationResult } from '../../../../domain/value-objects/validation-result';
import { ErrorCode } from '../../../../domain/errors/error-codes';
import { RuleType } from '../../../../domain/entities/promo-code.types';
import { IPromoCodeUsageRepository } from '../../../../domain/interfaces/promo-code-usage.repository';

export class GlobalUsageLimitRule extends ValidationRule {
  constructor(private readonly usageRepo: IPromoCodeUsageRepository) {
    super();
  }

  protected async validate(
    context: ValidationContext,
  ): Promise<ValidationResult> {
    const rule = context.promo?.getRule(RuleType.GLOBAL_USAGE_LIMIT);
    if (!rule) return ValidationResult.success();

    const limit = Number(rule.parameters.limit ?? 0);

    const count = await this.usageRepo.countPaidUsesByCode(
      context.promo!.id,
    );

    if (count >= limit) {
      return ValidationResult.failure(ErrorCode.USAGE_LIMIT_REACHED);
    }
    return ValidationResult.success();
  }
}
