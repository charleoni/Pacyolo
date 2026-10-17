import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asiento, AsientoLinea } from './entities/asiento.entity.js';
import { PucCuenta } from '../puc/entities/puc.entity.js';
import { AsientosService } from './asientos.service.js';
import { AsientosController } from './asientos.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Asiento, AsientoLinea, PucCuenta])],
  controllers: [AsientosController],
  providers: [AsientosService],
  exports: [AsientosService, TypeOrmModule],
})
export class AsientosModule {}
