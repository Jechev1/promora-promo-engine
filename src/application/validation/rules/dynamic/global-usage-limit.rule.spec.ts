import { GlobalUsageLimitRule } from './global-usage-limit.rule';
import { InMemoryPromoCodeUsageRepository } from '../../../../infrastructure/repositories/in-memory/in-memory-usage.repository';
import { PromoCodeFactory } from '../../../../testing/factories/promo-code.factory';
import { RuleFactory } from '../../../../testing/factories/rule.factory';
import { OrderFactory } from '../../../../testing/factories/order.factory';
import { BuyerFactory } from '../../../../testing/factories/buyer.factory';
import { UsageFactory } from '../../../../testing/factories/usage.factory';
import { ValidationContext } from '../../../../domain/value-objects/validation-context';
import { ErrorCode } from '../../../../domain/errors/error-codes';

describe('GlobalUsageLimitRule', () => {
  let usageRepo: InMemoryPromoCodeUsageRepository;
  let rule: GlobalUsageLimitRule;

  beforeEach(() => {
    usageRepo = new InMemoryPromoCodeUsageRepository();
    rule = new GlobalUsageLimitRule(usageRepo);
  });

  it('bloquea si se alcanzo el limite global de usos pagados', async () => {
    const promo = PromoCodeFactory.percent(10, {
      rules: [RuleFactory.globalUsageLimit(3)],
    });
    await usageRepo.save(UsageFactory.create({ promoCodeId: promo.id }));
    await usageRepo.save(UsageFactory.create({ promoCodeId: promo.id }));
    await usageRepo.save(UsageFactory.create({ promoCodeId: promo.id }));

    const ctx = new ValidationContext(
      promo.code,
      OrderFactory.create(),
      BuyerFactory.create(),
    );
    ctx.promo = promo;

    const result = await rule.handle(ctx);
    expect(result.isValid).toBe(false);
    expect(result.firstError).toBe(ErrorCode.USAGE_LIMIT_REACHED);
  });

  it('permite si aun hay cupos globales disponibles', async () => {
    const promo = PromoCodeFactory.percent(10, {
      rules: [RuleFactory.globalUsageLimit(5)],
    });
    await usageRepo.save(UsageFactory.create({ promoCodeId: promo.id }));

    const ctx = new ValidationContext(
      promo.code,
      OrderFactory.create(),
      BuyerFactory.create(),
    );
    ctx.promo = promo;

    const result = await rule.handle(ctx);
    expect(result.isValid).toBe(true);
  });
});
