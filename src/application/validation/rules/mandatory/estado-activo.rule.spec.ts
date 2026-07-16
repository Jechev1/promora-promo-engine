import { EstadoActivoRule } from './estado-activo.rule';
import { PromoCodeFactory } from '../../../../testing/factories/promo-code.factory';
import { OrderFactory } from '../../../../testing/factories/order.factory';
import { BuyerFactory } from '../../../../testing/factories/buyer.factory';
import { ValidationContext } from '../../../../domain/value-objects/validation-context';
import { ErrorCode } from '../../../../domain/errors/error-codes';
import { PromoCode } from '../../../../domain/entities/promo-code';

describe('EstadoActivoRule', () => {
  const rule = new EstadoActivoRule();

  const contextFor = (promo: PromoCode) => {
    const ctx = new ValidationContext(
      promo.code,
      OrderFactory.create(),
      BuyerFactory.create(),
    );
    ctx.promo = promo;
    return ctx;
  };

  it('falla con INVALID_CODE si el estado es DRAFT', async () => {
    const promo = PromoCodeFactory.draft();
    const result = await rule.handle(contextFor(promo));

    expect(result.isValid).toBe(false);
    expect(result.firstError).toBe(ErrorCode.INVALID_CODE);
  });

  it('falla con INVALID_CODE si el estado es PAUSED', async () => {
    const promo = PromoCodeFactory.paused();
    const result = await rule.handle(contextFor(promo));

    expect(result.isValid).toBe(false);
    expect(result.firstError).toBe(ErrorCode.INVALID_CODE);
  });

  it('pasa si el estado es ACTIVE', async () => {
    const promo = PromoCodeFactory.percent(10);
    const result = await rule.handle(contextFor(promo));

    expect(result.isValid).toBe(true);
  });
});
