import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tercero } from './entities/tercero.entity.js';
import { TercerosService } from './terceros.service.js';
import { TercerosController } from './terceros.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Tercero])],
  controllers: [TercerosController],
  providers: [TercerosService],
  exports: [TercerosService],
})
export class TercerosModule {}
