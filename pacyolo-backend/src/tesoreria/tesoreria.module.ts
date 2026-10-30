import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CajaMenor } from './entities/caja-menor.entity.js';
import { CajaMenorGasto } from './entities/caja-menor-gasto.entity.js';
import { CajaMenorArqueo } from './entities/caja-menor-arqueo.entity.js';
import { CuentaBancaria } from './entities/cuenta-bancaria.entity.js';
import { ExtractoBancario, ExtractoBancarioLinea } from './entities/extracto-bancario.entity.js';
import { ConciliacionBancaria, ConciliacionPartida } from './entities/conciliacion-bancaria.entity.js';
import { PucCuenta } from '../puc/entities/puc.entity.js';
import { Tercero } from '../terceros/entities/tercero.entity.js';
import { AsientoLinea } from '../asientos/entities/asiento.entity.js';
import { AsientosModule } from '../asientos/asientos.module.js';
import { AuditoriaModule } from '../auditoria/auditoria.module.js';
import { TesoreriaService } from './tesoreria.service.js';
import { TesoreriaController } from './tesoreria.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CajaMenor,
      CajaMenorGasto,
      CajaMenorArqueo,
      CuentaBancaria,
      ExtractoBancario,
      ExtractoBancarioLinea,
      ConciliacionBancaria,
      ConciliacionPartida,
      PucCuenta,
      Tercero,
      AsientoLinea,
    ]),
    AsientosModule,
    AuditoriaModule,
  ],
  providers: [TesoreriaService],
  controllers: [TesoreriaController],
  exports: [TesoreriaService],
})
export class TesoreriaModule {}
