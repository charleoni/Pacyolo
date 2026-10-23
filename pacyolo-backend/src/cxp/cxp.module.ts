import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CuentaPorPagar } from './entities/cuenta-por-pagar.entity.js';
import { PagoCxp } from './entities/pago-cxp.entity.js';
import { Empresa } from '../empresas/entities/empresa.entity.js';
import { Tercero } from '../terceros/entities/tercero.entity.js';
import { PucCuenta } from '../puc/entities/puc.entity.js';
import { AsientosModule } from '../asientos/asientos.module.js';
import { ImpuestosModule } from '../impuestos/impuestos.module.js';
import { MapeoModule } from '../mapeo/mapeo.module.js';
import { AuditoriaModule } from '../auditoria/auditoria.module.js';
import { CxpService } from './cxp.service.js';
import { CxpController } from './cxp.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([CuentaPorPagar, PagoCxp, Empresa, Tercero, PucCuenta]),
    AsientosModule,
    ImpuestosModule,
    MapeoModule,
    AuditoriaModule,
  ],
  controllers: [CxpController],
  providers: [CxpService],
  exports: [CxpService, TypeOrmModule],
})
export class CxpModule {}
