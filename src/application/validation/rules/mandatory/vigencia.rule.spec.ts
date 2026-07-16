import { VigenciaRule } from './vigencia.rule';
import { PromoCodeFactory } from '../../../../testing/factories/promo-code.factory';
import { OrderFactory } from '../../../../testing/factories/order.factory';
import { BuyerFactory } from '../../../../testing/factories/buyer.factory';
import { ValidationContext } from '../../../../domain/value-objects/validation-context';
import { ErrorCode } from '../../../../domain/errors/error-codes';
import { PromoCode } from '../../../../domain/entities/promo-code';

describe('VigenciaRule', () => {
  const rule = new VigenciaRule();

  const contextFor = (promo: PromoCode) => {
    const ctx = new ValidationContext(
      promo.code,
      OrderFactory.create(),
      BuyerFactory.create(),
    );
    ctx.promo = promo;
    return ctx;
  };

  it('falla con EXPIRED_COUPON si la fecha actual es posterior a endDate', async () => {
    const promo = PromoCodeFactory.expiredByDate();
    const result = await rule.handle(contextFor(promo));

    expect(result.isValid).toBe(false);
    expect(result.firstError).toBe(ErrorCode.EXPIRED_COUPON);
  });

  it('falla con EXPIRED_COUPON si la fecha actual es anterior a startDate', async () => {
    const promo = PromoCodeFactory.notYetActive();
    const result = await rule.handle(contextFor(promo));

    expect(result.isValid).toBe(false);
    expect(result.firstError).toBe(ErrorCode.EXPIRED_COUPON);
  });

  it('pasa si la fecha actual esta dentro del rango de vigencia', async () => {
    const promo = PromoCodeFactory.percent(10);
    const result = await rule.handle(contextFor(promo));

    expect(result.isValid).toBe(true);
  });
});
