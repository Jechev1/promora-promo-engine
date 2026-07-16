import { DynamicValidationPipeline } from './dynamic-validation.pipeline';
import { ValidationRuleFactory } from '../../factories/validation-rule.factory';
import { InMemoryPromoCodeUsageRepository } from '../../../infrastructure/repositories/in-memory/in-memory-usage.repository';
import { InMemoryRestrictedUserRepository } from '../../../infrastructure/repositories/in-memory/in-memory-restricted-user.repository';
import { PromoCodeFactory } from '../../../testing/factories/promo-code.factory';
import { RuleFactory } from '../../../testing/factories/rule.factory';
import { OrderFactory } from '../../../testing/factories/order.factory';
import { BuyerFactory } from '../../../testing/factories/buyer.factory';
import { UsageFactory } from '../../../testing/factories/usage.factory';
import { ValidationContext } from '../../../domain/value-objects/validation-context';
import { ErrorCode } from '../../../domain/errors/error-codes';

describe('DynamicValidationPipeline', () => {
  let usageRepo: InMemoryPromoCodeUsageRepository;
  let restrictedRepo: InMemoryRestrictedUserRepository;
  let factory: ValidationRuleFactory;
  let pipeline: DynamicValidationPipeline;

  beforeEach(() => {
    usageRepo = new InMemoryPromoCodeUsageRepository();
    restrictedRepo = new InMemoryRestrictedUserRepository();
    factory = new ValidationRuleFactory(usageRepo, restrictedRepo);
    pipeline = new DynamicValidationPipeline(factory);
  });

  it('pasa si el codigo no tiene reglas configuradas', async () => {
    const promo = PromoCodeFactory.percent(10);
    const ctx = new ValidationContext(
      promo.code,
      OrderFactory.create(),
      BuyerFactory.create(),
    );
    ctx.promo = promo;

    const result = await pipeline.execute(ctx, promo);
    expect(result.isValid).toBe(true);
  });

  it('encadena varias reglas y todas pasan', async () => {
    const promo = PromoCodeFactory.percent(10, {
      rules: [
        RuleFactory.minPurchase(50),
        RuleFactory.eligibleCategories(['cat-1']),
      ],
    });
    const ctx = new ValidationContext(
      promo.code,
      OrderFactory.create({ subtotal: 100, categoryId: 'cat-1' }),
      BuyerFactory.create(),
    );
    ctx.promo = promo;

    const result = await pipeline.execute(ctx, promo);
    expect(result.isValid).toBe(true);
  });

  it('early exit: si una regla falla, no evalua las siguientes', async () => {
    const promo = PromoCodeFactory.percent(10, {
      rules: [
        RuleFactory.minPurchase(200),
        RuleFactory.eligibleCategories(['cat-1']),
      ],
    });
    const ctx = new ValidationContext(
      promo.code,
      OrderFactory.create({ subtotal: 50, categoryId: 'cat-DISTINTA' }),
      BuyerFactory.create(),
    );
    ctx.promo = promo;

    const result = await pipeline.execute(ctx, promo);
    expect(result.isValid).toBe(false);
    expect(result.firstError).toBe(ErrorCode.MIN_AMOUNT_REQUIRED);
  });

  it('combina reglas que dependen de repositorios (limits) con reglas puras', async () => {
    const promo = PromoCodeFactory.percent(10, {
      rules: [RuleFactory.minPurchase(50), RuleFactory.globalUsageLimit(2)],
    });
    await usageRepo.save(UsageFactory.create({ promoCodeId: promo.id }));
    await usageRepo.save(UsageFactory.create({ promoCodeId: promo.id }));

    const ctx = new ValidationContext(
      promo.code,
      OrderFactory.create({ subtotal: 100 }),
      BuyerFactory.create(),
    );
    ctx.promo = promo;

    const result = await pipeline.execute(ctx, promo);
    expect(result.isValid).toBe(false);
    expect(result.firstError).toBe(ErrorCode.USAGE_LIMIT_REACHED);
  });
});
