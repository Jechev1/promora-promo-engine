import { v4 as uuid } from 'uuid';
import { Order } from '../../domain/entities/order';
import { OrderContext } from '../../domain/value-objects/order-context';
import { BuyerProfile } from '../../domain/entities/buyer-profile';
import { BuyerFactory } from './buyer.factory';
import { OrderStatus } from '../../domain/entities/order-status';

export interface OrderFactoryOverrides {
  id?: string;
  subtotal?: number;
  categoryId?: string;
  buyer?: BuyerProfile;
  currentOrders?: readonly string[];
  status?: OrderStatus;
}

export class OrderFactory {
  static create(overrides: OrderFactoryOverrides = {}): Order {
    const orderId = overrides.id ?? uuid();
    const buyer = overrides.buyer ?? BuyerFactory.create();
    const subtotal = overrides.subtotal ?? 100;
    const categories = overrides.categoryId ? [overrides.categoryId] : ['cat-default'];

    const context = new OrderContext(
      orderId,
      buyer.buyerId,
      subtotal,
      categories,
      buyer,
    );
    return new Order(
      orderId,
      subtotal,
      context,
      overrides.status ?? OrderStatus.DRAFT,
    );
  }
}
