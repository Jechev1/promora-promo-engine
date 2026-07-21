import { PromoCodeEngine } from './promo-code-engine';
import { ValidationEngine } from './validation-engine';
import { MandatoryValidationPipeline } from '../validation/pipelines/mandatory-validation.pipeline';
import { DynamicValidationPipeline } from '../validation/pipelines/dynamic-validation.pipeline';
import { ValidationRuleFactory } from '../factories/validation-rule.factory';
import { DiscountStrategyFactory } from '../factories/discount-strategy.factory';
import { DiscountCalculator } from '../calculation/discount-calculator';
import { ScenarioSeeder } from '../../testing/seeder/scenario-seeder';
import { PromoCodeFactory } from '../../testing/factories/promo-code.factory';
import { RuleFactory } from '../../testing/factories/rule.factory';
import { OrderFactory } from '../../testing/factories/order.factory';
import { BuyerFactory } from '../../testing/factories/buyer.factory';
import { UsageFactory } from '../../testing/factories/usage.factory';
import { ErrorCode } from '../../domain/errors/error-codes';

describe('PromoCodeEngine (integracion)', () => {
  let seeder: ScenarioSeeder;
  let engine: PromoCodeEngine;

  beforeEach(() => {
    seeder = new ScenarioSeeder();

    const mandatory = new MandatoryValidationPipeline(seeder.promoCodes);
    const ruleFactory = new ValidationRuleFactory(
      seeder.usages,
      seeder.restrictedUsers,
    );
    const dynamic = new DynamicValidationPipeline(ruleFactory);

    const calculator = new DiscountCalculator(new DiscountStrategyFactory());
    engine = new PromoCodeEngine(
      mandatory,
      dynamic,
      calculator,
      seeder.promoCodes,
      seeder.usages,
    );
  });

  it('validate: retorna INVALID_CODE si el codigo no existe', async () => {
    const result = await engine.validate(
      'NO-EXISTE',
      OrderFactory.create(),
      BuyerFactory.create(),
    );

    expect(result.isValid).toBe(false);
    expect(result.firstError).toBe(ErrorCode.INVALID_CODE);
  });

  it('validate: pasa reglas fijas + configurables cuando todo es correcto', async () => {
    const promo = PromoCodeFactory.percent(15, {
      code: 'SUMMER15',
      rules: [RuleFactory.minPurchase(50)],
    });
    await seeder.seedPromoCode(promo);

    const result = await engine.validate(
      'SUMMER15',
      OrderFactory.create({ subtotal: 100 }),
      BuyerFactory.create(),
    );

    expect(result.isValid).toBe(true);
  });

  it('validateAndCalculate: retorna descuento correcto para percent', async () => {
    const promo = PromoCodeFactory.percent(20, { code: 'PCT20' });
    await seeder.seedPromoCode(promo);

    const result = await engine.validateAndCalculate(
      'PCT20',
      OrderFactory.create({ subtotal: 200 }),
      BuyerFactory.create(),
    );

    expect(result.validation.isValid).toBe(true);
    expect(result.calculation).not.toBeNull();
    expect(result.calculation!.discountAmount).toBe(40);
    expect(result.calculation!.finalAmount).toBe(160);
  });

  it('validateAndCalculate: si la validacion falla, calculation es null', async () => {
    const promo = PromoCodeFactory.percent(20, {
      code: 'MIN100',
      rules: [RuleFactory.minPurchase(100)],
    });
    await seeder.seedPromoCode(promo);

    const result = await engine.validateAndCalculate(
      'MIN100',
      OrderFactory.create({ subtotal: 50 }),
      BuyerFactory.create(),
    );

    expect(result.validation.isValid).toBe(false);
    expect(result.calculation).toBeNull();
  });

  it('validateAndApply: registra un uso NO pagado tras aplicar', async () => {
    const promo = PromoCodeFactory.percent(10, { code: 'APPLY10' });
    await seeder.seedPromoCode(promo);
    const buyer = BuyerFactory.create();

    const result = await engine.validateAndApply(
      'APPLY10',
      'order-999',
      OrderFactory.create({ subtotal: 100, buyer }),
      buyer,
      false,
    );

    expect(result.validation.isValid).toBe(true);
    expect(result.calculation!.discountAmount).toBe(10);

    // Los usos pendientes no consumen los límites de una promoción.
    const paidCount = await seeder.usages.countPaidUsesByCode(promo.id);
    expect(paidCount).toBe(0);
  });

  it('escenario complejo: reglas encadenadas + limite global alcanzado', async () => {
    const promo = PromoCodeFactory.percent(20, {
      code: 'GLOBAL2',
      rules: [RuleFactory.minPurchase(50), RuleFactory.globalUsageLimit(2)],
    });
    await seeder.seedPromoCode(promo);
    await seeder.seedUsage(UsageFactory.create({ promoCodeId: promo.id }));
    await seeder.seedUsage(UsageFactory.create({ promoCodeId: promo.id }));

    const result = await engine.validate(
      'GLOBAL2',
      OrderFactory.create({ subtotal: 100 }),
      BuyerFactory.create(),
    );

    expect(result.isValid).toBe(false);
    expect(result.firstError).toBe(ErrorCode.USAGE_LIMIT_REACHED);
  });
});
