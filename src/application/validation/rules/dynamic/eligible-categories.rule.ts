import { ValidationRule } from '../validation-rule';
import { ValidationContext } from '../../../../domain/value-objects/validation-context';
import { ValidationResult } from '../../../../domain/value-objects/validation-result';
import { ErrorCode } from '../../../../domain/errors/error-codes';
import { RuleType } from '../../../../domain/entities/promo-code.types';

export class EligibleCategoriesRule extends ValidationRule {
  protected async validate(
    context: ValidationContext,
  ): Promise<ValidationResult> {
    const rule = context.promo?.getRule(RuleType.ELIGIBLE_CATEGORIES);
    if (!rule) return ValidationResult.success();

    const categoryIds = (rule.parameters.categoryIds as string[]) ?? [];
    const orderCategory = context.order.getOrderContext().categoryId;

    if (!categoryIds.includes(orderCategory)) {
      return ValidationResult.failure(ErrorCode.INVALID_CODE);
    }
    return ValidationResult.success();
  }
}
