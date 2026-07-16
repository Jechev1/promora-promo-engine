import { ValidationRule } from '../rules/validation-rule';
import { ValidationContext } from '../../../domain/value-objects/validation-context';
import { ValidationResult } from '../../../domain/value-objects/validation-result';
import { PromoCode } from '../../../domain/entities/promo-code';
import { ValidationRuleFactory } from '../../factories/validation-rule.factory';

export class DynamicValidationPipeline {
  constructor(private readonly ruleFactory: ValidationRuleFactory) {}

  async execute(
    context: ValidationContext,
    promo: PromoCode,
  ): Promise<ValidationResult> {
    const activeRules = promo.getActiveRules();
    if (activeRules.length === 0) return ValidationResult.success();

    const ruleInstances = this.ruleFactory.createRules(
      activeRules.map((r) => r.ruleType),
    );

    this.chain(ruleInstances);
    return ruleInstances[0].handle(context);
  }

  private chain(rules: ValidationRule[]): void {
    for (let i = 0; i < rules.length - 1; i++) {
      rules[i].setNext(rules[i + 1]);
    }
  }
}
