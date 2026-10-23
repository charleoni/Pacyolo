import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Articulo } from './entities/articulo.entity.js';
import { SaldoBodega } from './entities/saldo-bodega.entity.js';
import { KardexMovimiento } from './entities/kardex-movimiento.entity.js';
import { EntradaAlmacen } from './entities/entrada-almacen.entity.js';
import { EntradaAlmacenLinea } from './entities/entrada-almacen-linea.entity.js';
import { NotaAjuste } from './entities/nota-ajuste.entity.js';
import { NotaAjusteLinea } from './entities/nota-ajuste-linea.entity.js';
import { Bodega } from '../parametros/entities/bodega.entity.js';
import { TipoMovimiento } from '../parametros/entities/tipo-movimiento.entity.js';
import { CxpModule } from '../cxp/cxp.module.js';
import { InventariosService } from './inventarios.service.js';
import { InventariosController } from './inventarios.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Articulo,
      SaldoBodega,
      KardexMovimiento,
      EntradaAlmacen,
      EntradaAlmacenLinea,
      NotaAjuste,
      NotaAjusteLinea,
      Bodega,
      TipoMovimiento,
    ]),
    CxpModule,
  ],
  controllers: [InventariosController],
  providers: [InventariosService],
  exports: [InventariosService, TypeOrmModule],
})
export class InventariosModule {}
