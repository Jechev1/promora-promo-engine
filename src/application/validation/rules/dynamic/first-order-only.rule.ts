import { ValidationRule } from '../validation-rule';
import { ValidationContext } from '../../../../domain/value-objects/validation-context';
import { ValidationResult } from '../../../../domain/value-objects/validation-result';
import { ErrorCode } from '../../../../domain/errors/error-codes';
import { RuleType } from '../../../../domain/entities/promo-code.types';

export class FirstOrderOnlyRule extends ValidationRule {
  protected async validate(
    context: ValidationContext,
  ): Promise<ValidationResult> {
    const rule = context.promo?.getRule(RuleType.FIRST_ORDER_ONLY);
    if (!rule) return ValidationResult.success();

    if (!context.buyer.isFirstBuyer) {
      return ValidationResult.failure(ErrorCode.CODE_ALREADY_USED);
    }
    return ValidationResult.success();
  }
}
