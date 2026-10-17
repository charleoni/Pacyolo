import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImpuestoRegla } from './entities/impuesto-regla.entity.js';
import { Empresa } from '../empresas/entities/empresa.entity.js';
import { PucCuenta } from '../puc/entities/puc.entity.js';
import { ImpuestosService } from './impuestos.service.js';
import { ImpuestosController } from './impuestos.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([ImpuestoRegla, Empresa, PucCuenta])],
  controllers: [ImpuestosController],
  providers: [ImpuestosService],
  exports: [ImpuestosService, TypeOrmModule],
})
export class ImpuestosModule {}
