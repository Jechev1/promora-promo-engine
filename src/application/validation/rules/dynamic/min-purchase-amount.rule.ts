import { ValidationRule } from '../validation-rule';
import { ValidationContext } from '../../../../domain/value-objects/validation-context';
import { ValidationResult } from '../../../../domain/value-objects/validation-result';
import { ErrorCode } from '../../../../domain/errors/error-codes';
import { RuleType } from '../../../../domain/entities/promo-code.types';

export class MinPurchaseAmountRule extends ValidationRule {
  protected async validate(
    context: ValidationContext,
  ): Promise<ValidationResult> {
    const rule = context.promo?.getRule(RuleType.MIN_PURCHASE_AMOUNT);
    if (!rule) return ValidationResult.success();

    const minAmount = Number(rule.parameters.minAmount ?? 0);
    if (context.order.getSubtotal() < minAmount) {
      return ValidationResult.failure(ErrorCode.MIN_AMOUNT_REQUIRED);
    }
    return ValidationResult.success();
  }
}
