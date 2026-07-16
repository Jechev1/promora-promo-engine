import { MandatoryValidationPipeline } from './mandatory-validation.pipeline';
import { InMemoryPromoCodeRepository } from '../../../infrastructure/repositories/in-memory/in-memory-promo-code.repository';
import { PromoCodeFactory } from '../../../testing/factories/promo-code.factory';
import { OrderFactory } from '../../../testing/factories/order.factory';
import { BuyerFactory } from '../../../testing/factories/buyer.factory';
import { ValidationContext } from '../../../domain/value-objects/validation-context';
import { ErrorCode } from '../../../domain/errors/error-codes';

describe('MandatoryValidationPipeline', () => {
  let repo: InMemoryPromoCodeRepository;
  let pipeline: MandatoryValidationPipeline;

  beforeEach(() => {
    repo = new InMemoryPromoCodeRepository();
    pipeline = new MandatoryValidationPipeline(repo);
  });

  it('early exit: codigo inexistente falla en la primera regla (INVALID_CODE)', async () => {
    const ctx = new ValidationContext(
      'NO-EXISTE',
      OrderFactory.create(),
      BuyerFactory.create(),
    );
    const result = await pipeline.execute(ctx);
    expect(result.isValid).toBe(false);
    expect(result.firstError).toBe(ErrorCode.INVALID_CODE);
  });

  it('early exit: codigo expirado por fecha corta en la segunda regla', async () => {
    const promo = PromoCodeFactory.expiredByDate({ code: 'PAST' });
    await repo.save(promo);
    const ctx = new ValidationContext(
      'PAST',
      OrderFactory.create(),
      BuyerFactory.create(),
    );
    const result = await pipeline.execute(ctx);
    expect(result.isValid).toBe(false);
    expect(result.firstError).toBe(ErrorCode.EXPIRED_COUPON);
  });

  it('early exit: codigo en estado paused corta en la tercera regla', async () => {
    const promo = PromoCodeFactory.paused({ code: 'PAUSED-CODE' });
    await repo.save(promo);
    const ctx = new ValidationContext(
      'PAUSED-CODE',
      OrderFactory.create(),
      BuyerFactory.create(),
    );
    const result = await pipeline.execute(ctx);
    expect(result.isValid).toBe(false);
    expect(result.firstError).toBe(ErrorCode.INVALID_CODE);
  });

  it('pasa las tres reglas y carga el promo en el context', async () => {
    const promo = PromoCodeFactory.percent(15, { code: 'SUMMER15' });
    await repo.save(promo);
    const ctx = new ValidationContext(
      'SUMMER15',
      OrderFactory.create(),
      BuyerFactory.create(),
    );
    const result = await pipeline.execute(ctx);
    expect(result.isValid).toBe(true);
    expect(ctx.promo).toBe(promo);
  });
});
