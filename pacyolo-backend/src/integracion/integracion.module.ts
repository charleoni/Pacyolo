import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BorradorIntegracion } from './entities/borrador-integracion.entity.js';
import { CuentaPorCobrar } from '../cxc/entities/cuenta-por-cobrar.entity.js';
import { Tercero } from '../terceros/entities/tercero.entity.js';
import { IntegracionService } from './integracion.service.js';
import { IntegracionController } from './integracion.controller.js';
import { AsientosModule } from '../asientos/asientos.module.js';
import { MapeoModule } from '../mapeo/mapeo.module.js';
import { ImpuestosModule } from '../impuestos/impuestos.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([BorradorIntegracion, CuentaPorCobrar, Tercero]),
    AsientosModule,
    MapeoModule,
    ImpuestosModule,
  ],
  controllers: [IntegracionController],
  providers: [IntegracionService],
  exports: [IntegracionService],
})
export class IntegracionModule {}
