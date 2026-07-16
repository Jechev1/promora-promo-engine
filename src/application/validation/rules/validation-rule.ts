import { ValidationContext } from '../../../domain/value-objects/validation-context';
import { ValidationResult } from '../../../domain/value-objects/validation-result';

export abstract class ValidationRule {
  protected next: ValidationRule | null = null;

  setNext(rule: ValidationRule): ValidationRule {
    this.next = rule;
    return rule;
  }

  async handle(context: ValidationContext): Promise<ValidationResult> {
    const result = await this.validate(context);
    if (!result.isValid) return result;
    if (this.next) return this.next.handle(context);
    return ValidationResult.success();
  }

  protected abstract validate(
    context: ValidationContext,
  ): Promise<ValidationResult>;
}
