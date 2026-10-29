import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdenCompra } from './entities/orden-compra.entity.js';
import { OrdenCompraLinea } from './entities/orden-compra-linea.entity.js';
import { Tercero } from '../terceros/entities/tercero.entity.js';
import { Articulo } from '../inventarios/entities/articulo.entity.js';
import { CxpModule } from '../cxp/cxp.module.js';
import { ComprasService } from './compras.service.js';
import { ComprasController } from './compras.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrdenCompra,
      OrdenCompraLinea,
      Tercero,
      Articulo,
    ]),
    CxpModule,
  ],
  controllers: [ComprasController],
  providers: [ComprasService],
  exports: [ComprasService, TypeOrmModule],
})
export class ComprasModule {}
