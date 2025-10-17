import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ProductModule } from './modules/product/product.module';
import { CustomerModule } from './modules/customer/customer.module';
import { OrderModule } from './modules/order/order.module';
import { InventoryModule } from './modules/inventory/inventory.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    ProductModule,
    CustomerModule,
    OrderModule,
    InventoryModule,
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
