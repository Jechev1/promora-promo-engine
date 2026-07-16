import { RestrictedUsageRule } from './restricted-usage.rule';
import { InMemoryRestrictedUserRepository } from '../../../../infrastructure/repositories/in-memory/in-memory-restricted-user.repository';
import { PromoCodeFactory } from '../../../../testing/factories/promo-code.factory';
import { RuleFactory } from '../../../../testing/factories/rule.factory';
import { OrderFactory } from '../../../../testing/factories/order.factory';
import { BuyerFactory } from '../../../../testing/factories/buyer.factory';
import { ValidationContext } from '../../../../domain/value-objects/validation-context';
import { ErrorCode } from '../../../../domain/errors/error-codes';

describe('RestrictedUsageRule', () => {
  let restrictedRepo: InMemoryRestrictedUserRepository;
  let rule: RestrictedUsageRule;

  beforeEach(() => {
    restrictedRepo = new InMemoryRestrictedUserRepository();
    rule = new RestrictedUsageRule(restrictedRepo);
  });

  it('bloquea con RESTRICTED_USAGE si el comprador no esta autorizado', async () => {
    const promo = PromoCodeFactory.percent(10, {
      rules: [RuleFactory.restrictedUsage()],
    });
    const buyer = BuyerFactory.create();

    const ctx = new ValidationContext(
      promo.code,
      OrderFactory.create({ buyer }),
      buyer,
    );
    ctx.promo = promo;

    const result = await rule.handle(ctx);
    expect(result.isValid).toBe(false);
    expect(result.firstError).toBe(ErrorCode.RESTRICTED_USAGE);
  });

  it('permite si el comprador esta autorizado', async () => {
    const promo = PromoCodeFactory.percent(10, {
      rules: [RuleFactory.restrictedUsage()],
    });
    const buyer = BuyerFactory.create();
    await restrictedRepo.authorize(promo.id, buyer.buyerId);

    const ctx = new ValidationContext(
      promo.code,
      OrderFactory.create({ buyer }),
      buyer,
    );
    ctx.promo = promo;

    const result = await rule.handle(ctx);
    expect(result.isValid).toBe(true);
  });

  it('permite si la regla no esta configurada', async () => {
    const promo = PromoCodeFactory.percent(10);
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
