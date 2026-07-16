import { ValidationRule } from '../validation-rule';
import { ValidationContext } from '../../../../domain/value-objects/validation-context';
import { ValidationResult } from '../../../../domain/value-objects/validation-result';
import { ErrorCode } from '../../../../domain/errors/error-codes';

export class VigenciaRule extends ValidationRule {
  protected async validate(
    context: ValidationContext,
  ): Promise<ValidationResult> {
    if (!context.promo) {
      return ValidationResult.failure(ErrorCode.INVALID_CODE);
    }
    if (context.promo.isExpired()) {
      return ValidationResult.failure(ErrorCode.EXPIRED_COUPON);
    }
    return ValidationResult.success();
  }
}
