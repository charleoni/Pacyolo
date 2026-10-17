import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asiento } from './entities/asiento.entity.js';
import { AsientoLinea } from './entities/asiento-linea.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Asiento, AsientoLinea])],
  exports: [TypeOrmModule],
})
export class AsientosModule {}
