import { MandatoryValidationPipeline } from '../validation/pipelines/mandatory-validation.pipeline';
import { DynamicValidationPipeline } from '../validation/pipelines/dynamic-validation.pipeline';
import { ValidationContext } from '../../domain/value-objects/validation-context';
import { ValidationResult } from '../../domain/value-objects/validation-result';
import { ErrorCode } from '../../domain/errors/error-codes';

export class ValidationEngine {
  constructor(
    private readonly mandatoryPipeline: MandatoryValidationPipeline,
    private readonly dynamicPipeline: DynamicValidationPipeline,
  ) {}

  async validate(context: ValidationContext): Promise<ValidationResult> {
    const mandatoryResult = await this.mandatoryPipeline.execute(context);
    if (!mandatoryResult.isValid) return mandatoryResult;

    try {
      const subtotal = context.order.getSubtotal();
      const orderContext = context.order.getOrderContext();
      if (
        !orderContext ||
        !orderContext.buyerProfile ||
        !Array.isArray(orderContext.categories)
      )
        return ValidationResult.failure(ErrorCode.INVALID_ORDER);
      if (!Number.isFinite(subtotal) || subtotal < 0)
        return ValidationResult.failure(ErrorCode.INVALID_AMOUNT);
    } catch {
      return ValidationResult.failure(ErrorCode.INVALID_ORDER);
    }

    return this.dynamicPipeline.execute(context, context.promo!);
  }
}
