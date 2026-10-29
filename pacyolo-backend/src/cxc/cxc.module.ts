import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CxcController } from './cxc.controller.js';
import { CxcService } from './cxc.service.js';
import { CuentaPorCobrar } from './entities/cuenta-por-cobrar.entity.js';
import { RecaudoCxc } from './entities/recaudo-cxc.entity.js';
import { Tercero } from '../terceros/entities/tercero.entity.js';
import { PucCuenta } from '../puc/entities/puc.entity.js';
import { AsientosModule } from '../asientos/asientos.module.js';
import { AuditoriaModule } from '../auditoria/auditoria.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CuentaPorCobrar,
      RecaudoCxc,
      Tercero,
      PucCuenta,
    ]),
    AsientosModule,
    AuditoriaModule,
  ],
  controllers: [CxcController],
  providers: [CxcService],
  exports: [CxcService],
})
export class CxcModule {}
