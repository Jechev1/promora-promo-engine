import { ValidationRule } from '../rules/validation-rule';
import { ExistenceRule } from '../rules/mandatory/existence.rule';
import { VigenciaRule } from '../rules/mandatory/vigencia.rule';
import { EstadoActivoRule } from '../rules/mandatory/estado-activo.rule';
import { ValidationContext } from '../../../domain/value-objects/validation-context';
import { ValidationResult } from '../../../domain/value-objects/validation-result';
import { IPromoCodeRepository } from '../../../domain/interfaces/promo-code.repository';

export class MandatoryValidationPipeline {
  private readonly chainHead: ValidationRule;

  constructor(promoRepo: IPromoCodeRepository) {
    const existence = new ExistenceRule(promoRepo);
    const vigencia = new VigenciaRule();
    const estadoActivo = new EstadoActivoRule();

    existence.setNext(vigencia).setNext(estadoActivo);
    this.chainHead = existence;
  }

  async execute(context: ValidationContext): Promise<ValidationResult> {
    return this.chainHead.handle(context);
  }
}
