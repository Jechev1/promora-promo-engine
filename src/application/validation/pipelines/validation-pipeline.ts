import { Injectable } from '@nestjs/common';
import { IValidationRule, ValidationContext } from './validation-rule.interface';
import { ValidationResult } from '../../domain/value-objects/validation-result';

@Injectable()
export class ValidationPipeline {
  private mandatoryRules: IValidationRule[] = [];
  private dynamicRules: IValidationRule[] = [];

  registerMandatoryRule(rule: IValidationRule): void {
    this.mandatoryRules.push(rule);
  }

  registerDynamicRule(rule: IValidationRule): void {
    this.dynamicRules.push(rule);
  }

  async execute(context: ValidationContext): Promise<ValidationResult> {
    for (const rule of this.mandatoryRules) {
      const result = await rule.handle(context);
      if (!result.isValid) {
        return result;
      }
    }

    for (const rule of this.dynamicRules) {
      if (!rule.appliesTo(context.promoCode)) {
        continue;
      }

      const result = await rule.handle(context);
      if (!result.isValid) {
        return result;
      }
    }

    return ValidationResult.success();
  }
}
