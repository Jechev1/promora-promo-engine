import { Injectable } from '@nestjs/common';
import { ValidationContext } from '../../../domain/value-objects/validation-context';
import { ValidationResult } from '../../../domain/value-objects/validation-result';
import { ValidationRule } from '../rules/validation-rule';

@Injectable()
export class ValidationPipeline {
  private mandatoryRules: ValidationRule[] = [];
  private dynamicRules: ValidationRule[] = [];

  registerMandatoryRule(rule: ValidationRule): void {
    this.mandatoryRules.push(rule);
  }

  registerDynamicRule(rule: ValidationRule): void {
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
      const result = await rule.handle(context);
      if (!result.isValid) {
        return result;
      }
    }

    return ValidationResult.success();
  }
}
