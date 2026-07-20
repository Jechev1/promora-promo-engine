import { PromoCodeEngine } from '../../application/engine/promo-code-engine';
import { ValidationEngine } from '../../application/engine/validation-engine';
import { MandatoryValidationPipeline } from '../../application/validation/pipelines/mandatory-validation.pipeline';
import { DynamicValidationPipeline } from '../../application/validation/pipelines/dynamic-validation.pipeline';
import { ValidationRuleFactory } from '../../application/factories/validation-rule.factory';
import { DiscountStrategyFactory } from '../../application/factories/discount-strategy.factory';
import { DiscountCalculator } from '../../application/calculation/discount-calculator';
import { FixedDiscountStrategy } from '../../application/calculation/strategies/fixed-discount.strategy';
import { PercentDiscountStrategy } from '../../application/calculation/strategies/percent-discount.strategy';
import { TieredDiscountStrategy } from '../../application/calculation/strategies/tiered-discount.strategy';
import { InMemoryPromoCodeRepository } from '../../infrastructure/repositories/in-memory/in-memory-promo-code.repository';
import { InMemoryPromoCodeUsageRepository } from '../../infrastructure/repositories/in-memory/in-memory-usage.repository';
import { InMemoryRestrictedUserRepository } from '../../infrastructure/repositories/in-memory/in-memory-restricted-user.repository';
import { PromoCodeFactory } from '../../testing/factories/promo-code.factory';
import { RuleFactory } from '../../testing/factories/rule.factory';
import { TierConfiguration } from '../../domain/entities/tier-configuration';
import { InMemoryOrderRepository } from '../../infrastructure/repositories/in-memory/in-memory-order.repository';
import { InMemoryCategoryHierarchyRepository } from '../../infrastructure/repositories/in-memory/in-memory-category-hierarchy.repository';
import { BuyerFactory } from '../../testing/factories/buyer.factory';
import { OrderFactory } from '../../testing/factories/order.factory';
import { OrderStatus } from '../../domain/entities/order-status';
import { BuyerProfile } from '../../domain/entities/buyer-profile';
import { IPromoCodeRepository } from '../../domain/interfaces/promo-code.repository';
import { IPromoCodeUsageRepository } from '../../domain/interfaces/promo-code-usage.repository';
import { IRestrictedUserRepository } from '../../domain/interfaces/restricted-user.repository';
import { IOrderRepository } from '../../domain/interfaces/order.repository';
import { ICategoryHierarchyRepository } from '../../domain/interfaces/category-hierarchy.repository';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { PrismaPromoCodeRepository } from '../../infrastructure/repositories/prisma/prisma-promo-code.repository';
import { PrismaPromoCodeUsageRepository } from '../../infrastructure/repositories/prisma/prisma-usage.repository';
import { PrismaRestrictedUserRepository } from '../../infrastructure/repositories/prisma/prisma-restricted-user.repository';
import { PrismaOrderRepository } from '../../infrastructure/repositories/prisma/prisma-order.repository';
import { PrismaCategoryHierarchyRepository } from '../../infrastructure/repositories/prisma/prisma-category-hierarchy.repository';
import { OnModuleDestroy } from '@nestjs/common';

// Los repositorios en memoria mantienen las pruebas aisladas; la aplicación usa Prisma de forma predeterminada.
export class PromoEngineProvider implements OnModuleDestroy {
  readonly promoRepo: IPromoCodeRepository;
  readonly usageRepo: IPromoCodeUsageRepository;
  readonly restrictedRepo: IRestrictedUserRepository;
  readonly orderRepo: IOrderRepository;
  readonly categoryRepo: ICategoryHierarchyRepository;
  readonly engine: PromoCodeEngine;
  private readonly prisma?: PrismaService;

  constructor() {
    const useInMemory =
      process.env.NODE_ENV === 'test' ||
      process.env.PROMO_USE_IN_MEMORY === 'true';
    if (useInMemory) {
      this.promoRepo = new InMemoryPromoCodeRepository();
      this.usageRepo = new InMemoryPromoCodeUsageRepository();
      this.restrictedRepo = new InMemoryRestrictedUserRepository();
      this.orderRepo = new InMemoryOrderRepository();
      this.categoryRepo = new InMemoryCategoryHierarchyRepository();
    } else {
      this.prisma = new PrismaService();
      this.promoRepo = new PrismaPromoCodeRepository(this.prisma);
      this.usageRepo = new PrismaPromoCodeUsageRepository(this.prisma);
      this.restrictedRepo = new PrismaRestrictedUserRepository(this.prisma);
      this.orderRepo = new PrismaOrderRepository(this.prisma);
      this.categoryRepo = new PrismaCategoryHierarchyRepository(this.prisma);
    }
    const mandatory = new MandatoryValidationPipeline(this.promoRepo);
    const ruleFactory = new ValidationRuleFactory(
      this.usageRepo,
      this.restrictedRepo,
      this.orderRepo,
      this.categoryRepo,
    );
    const dynamic = new DynamicValidationPipeline(ruleFactory);
    const strategies = [
      new FixedDiscountStrategy(),
      new PercentDiscountStrategy(),
      new TieredDiscountStrategy(),
    ];
    const calculator = new DiscountCalculator(strategies);

    this.engine = new PromoCodeEngine(
      mandatory,
      dynamic,
      calculator,
      this.promoRepo,
      this.usageRepo,
    );
    if (useInMemory) {
      this.seedReferenceData(
        this.categoryRepo as InMemoryCategoryHierarchyRepository,
        this.orderRepo as InMemoryOrderRepository,
      );
      void this.seedExamples();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.prisma?.$disconnect();
  }

  private seedReferenceData(
    categoryRepo: InMemoryCategoryHierarchyRepository,
    orderRepo: InMemoryOrderRepository,
  ): void {
    categoryRepo.add('general');
    categoryRepo.add('electronics', 'general');
    categoryRepo.add('phones', 'electronics');
    const buyer = BuyerFactory.create({ buyerId: 'demo-buyer' });
    void orderRepo.save(
      OrderFactory.create({
        id: 'demo-order-100',
        subtotal: 100,
        categoryId: 'phones',
        buyer,
        status: OrderStatus.PENDING,
      }),
    );
    void orderRepo.save(
      OrderFactory.create({
        id: 'demo-order-40',
        subtotal: 40,
        categoryId: 'general',
        buyer,
        status: OrderStatus.PENDING,
      }),
    );
    void orderRepo.save(
      OrderFactory.create({
        id: 'demo-order-200',
        subtotal: 200,
        categoryId: 'electronics',
        buyer,
        status: OrderStatus.PENDING,
      }),
    );
    const returningBuyer = new BuyerProfile('returning-buyer', 1, false);
    void orderRepo.save(
      OrderFactory.create({
        id: 'returning-paid',
        subtotal: 25,
        buyer: returningBuyer,
        status: OrderStatus.PAID,
      }),
    );
    void orderRepo.save(
      OrderFactory.create({
        id: 'returning-current',
        subtotal: 100,
        buyer: returningBuyer,
        status: OrderStatus.PENDING,
      }),
    );
  }

  private async seedExamples(): Promise<void> {
    await this.promoRepo.save(
      PromoCodeFactory.percent(15, { code: 'SUMMER15' }),
    );

    await this.promoRepo.save(
      PromoCodeFactory.percent(10, {
        code: 'FIRST10',
        rules: [RuleFactory.firstOrderOnly(), RuleFactory.minPurchase(50)],
      }),
    );

    await this.promoRepo.save(PromoCodeFactory.fixed(20, { code: 'FLAT20' }));

    await this.promoRepo.save(
      PromoCodeFactory.tiered(
        [
          new TierConfiguration(0, 5),
          new TierConfiguration(3, 10),
          new TierConfiguration(10, 15),
        ],
        { code: 'VIP' },
      ),
    );

    await this.promoRepo.save(
      PromoCodeFactory.percent(50, {
        code: 'CAPPED50',
        postCalcRules: [RuleFactory.maxDiscount(30)],
      }),
    );
  }
}
