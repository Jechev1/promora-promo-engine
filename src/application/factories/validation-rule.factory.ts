import { ValidationRule } from '../validation/rules/validation-rule';
import { MinPurchaseAmountRule } from '../validation/rules/dynamic/min-purchase-amount.rule';
import { EligibleCategoriesRule } from '../validation/rules/dynamic/eligible-categories.rule';
import { FirstOrderOnlyRule } from '../validation/rules/dynamic/first-order-only.rule';
import { UserUsageLimitRule } from '../validation/rules/dynamic/user-usage-limit.rule';
import { GlobalUsageLimitRule } from '../validation/rules/dynamic/global-usage-limit.rule';
import { GlobalAmountLimitRule } from '../validation/rules/dynamic/global-amount-limit.rule';
import { RestrictedUsageRule } from '../validation/rules/dynamic/restricted-usage.rule';
import { RuleType } from '../../domain/entities/promo-code.types';
import { IPromoCodeUsageRepository } from '../../domain/interfaces/promo-code-usage.repository';
import { IRestrictedUserRepository } from '../../domain/interfaces/restricted-user.repository';

export class ValidationRuleFactory {
  constructor(
    private readonly usageRepo: IPromoCodeUsageRepository,
    private readonly restrictedRepo: IRestrictedUserRepository,
  ) {}

  createRule(type: RuleType): ValidationRule {
    switch (type) {
      case RuleType.MIN_PURCHASE_AMOUNT:
        return new MinPurchaseAmountRule();
      case RuleType.ELIGIBLE_CATEGORIES:
        return new EligibleCategoriesRule();
      case RuleType.FIRST_ORDER_ONLY:
        return new FirstOrderOnlyRule();
      case RuleType.USER_USAGE_LIMIT:
        return new UserUsageLimitRule(this.usageRepo);
      case RuleType.GLOBAL_USAGE_LIMIT:
        return new GlobalUsageLimitRule(this.usageRepo);
      case RuleType.GLOBAL_AMOUNT_LIMIT:
        return new GlobalAmountLimitRule(this.usageRepo);
      case RuleType.RESTRICTED_USAGE:
        return new RestrictedUsageRule(this.restrictedRepo);
      default:
        throw new Error(`Unknown rule type: ${type}`);
    }
  }

  createRules(types: readonly RuleType[]): ValidationRule[] {
    return types.map((t) => this.createRule(t));
  }
}
