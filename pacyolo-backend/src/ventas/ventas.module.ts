import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VentasController } from './ventas.controller.js';
import { VentasService } from './ventas.service.js';
import { FacturaVenta } from './entities/factura-venta.entity.js';
import { FacturaVentaLinea } from './entities/factura-venta-linea.entity.js';
import {
  NotaCreditoVenta,
  NotaCreditoVentaLinea,
} from './entities/nota-credito-venta.entity.js';
import { Articulo } from '../inventarios/entities/articulo.entity.js';
import { SaldoBodega } from '../inventarios/entities/saldo-bodega.entity.js';
import { KardexMovimiento } from '../inventarios/entities/kardex-movimiento.entity.js';
import { Bodega } from '../parametros/entities/bodega.entity.js';
import { Tercero } from '../terceros/entities/tercero.entity.js';
import { PucCuenta } from '../puc/entities/puc.entity.js';
import { CuentaPorCobrar } from '../cxc/entities/cuenta-por-cobrar.entity.js';
import { RecaudoCxc } from '../cxc/entities/recaudo-cxc.entity.js';
import { AsientosModule } from '../asientos/asientos.module.js';
import { AuditoriaModule } from '../auditoria/auditoria.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FacturaVenta,
      FacturaVentaLinea,
      NotaCreditoVenta,
      NotaCreditoVentaLinea,
      Articulo,
      SaldoBodega,
      KardexMovimiento,
      Bodega,
      Tercero,
      PucCuenta,
      CuentaPorCobrar,
      RecaudoCxc,
    ]),
    AsientosModule,
    AuditoriaModule,
  ],
  controllers: [VentasController],
  providers: [VentasService],
  exports: [VentasService],
})
export class VentasModule {}
