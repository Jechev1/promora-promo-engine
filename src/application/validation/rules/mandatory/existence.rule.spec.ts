import { ExistenceRule } from './existence.rule';
import { InMemoryPromoCodeRepository } from '../../../../infrastructure/repositories/in-memory/in-memory-promo-code.repository';
import { PromoCodeFactory } from '../../../../testing/factories/promo-code.factory';
import { OrderFactory } from '../../../../testing/factories/order.factory';
import { BuyerFactory } from '../../../../testing/factories/buyer.factory';
import { ValidationContext } from '../../../../domain/value-objects/validation-context';
import { ErrorCode } from '../../../../domain/errors/error-codes';

describe('ExistenceRule', () => {
  let repo: InMemoryPromoCodeRepository;
  let rule: ExistenceRule;

  beforeEach(() => {
    repo = new InMemoryPromoCodeRepository();
    rule = new ExistenceRule(repo);
  });

  it('falla con INVALID_CODE si el codigo no existe en el repositorio', async () => {
    const context = new ValidationContext(
      'NO-EXISTE',
      OrderFactory.create(),
      BuyerFactory.create(),
    );

    const result = await rule.handle(context);

    expect(result.isValid).toBe(false);
    expect(result.firstError).toBe(ErrorCode.INVALID_CODE);
  });

  it('carga el PromoCode en el context si el codigo existe', async () => {
    const promo = PromoCodeFactory.percent(10, { code: 'SUMMER15' });
    await repo.save(promo);
    const context = new ValidationContext(
      'SUMMER15',
      OrderFactory.create(),
      BuyerFactory.create(),
    );

    const result = await rule.handle(context);

    expect(result.isValid).toBe(true);
    expect(context.promo).toBe(promo);
  });
});
