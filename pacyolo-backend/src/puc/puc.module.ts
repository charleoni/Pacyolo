import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PucCuenta } from './entities/puc.entity.js';
import { PucService } from './puc.service.js';
import { PucController } from './puc.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([PucCuenta])],
  controllers: [PucController],
  providers: [PucService],
  exports: [PucService],
})
export class PucModule {}
