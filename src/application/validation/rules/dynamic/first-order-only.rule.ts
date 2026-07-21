import { ValidationRule } from '../validation-rule';
import { ValidationContext } from '../../../../domain/value-objects/validation-context';
import { ValidationResult } from '../../../../domain/value-objects/validation-result';
import { ErrorCode } from '../../../../domain/errors/error-codes';
import { RuleType } from '../../../../domain/entities/promo-code.types';
import { IOrderRepository } from '../../../../domain/interfaces/order.repository';
import { FirstOrderSpecification } from '../../../../domain/specifications/first-order.specification';

export class FirstOrderOnlyRule extends ValidationRule {
  private readonly specification = new FirstOrderSpecification();
  constructor(private readonly orderRepo?: IOrderRepository) {
    super();
  }
  protected async validate(
    context: ValidationContext,
  ): Promise<ValidationResult> {
    const rule = context.promo?.getRule(RuleType.FIRST_ORDER_ONLY);
    if (!rule) return ValidationResult.success();

    const paidOrders = context.order.getOrderContext().getPreviousOrderCount();

    if (
      !(await this.specification.isSatisfiedBy({ paidOrderCount: paidOrders }))
    ) {
      return ValidationResult.failure(ErrorCode.CODE_ALREADY_USED);
    }
    return ValidationResult.success();
  }
}
