import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlantillaMapeo } from './entities/plantilla-mapeo.entity.js';
import { Empresa } from '../empresas/entities/empresa.entity.js';
import { PucCuenta } from '../puc/entities/puc.entity.js';
import { MapeoService } from './mapeo.service.js';
import { MapeoController } from './mapeo.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([PlantillaMapeo, Empresa, PucCuenta])],
  controllers: [MapeoController],
  providers: [MapeoService],
  exports: [MapeoService, TypeOrmModule],
})
export class MapeoModule {}
