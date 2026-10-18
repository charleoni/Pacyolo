import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipoIdentificacion } from './entities/tipo-identificacion.entity.js';
import { TipoPersona } from './entities/tipo-persona.entity.js';
import { RegimenFiscal } from './entities/regimen-fiscal.entity.js';
import { ClasificacionTercero } from './entities/clasificacion-tercero.entity.js';
import { TipoComprobanteConfig } from './entities/tipo-comprobante-config.entity.js';
import { MetodoPago } from './entities/metodo-pago.entity.js';
import { ParametrosService } from './parametros.service.js';
import { ParametrosController } from './parametros.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TipoIdentificacion,
      TipoPersona,
      RegimenFiscal,
      ClasificacionTercero,
      TipoComprobanteConfig,
      MetodoPago,
    ]),
  ],
  controllers: [ParametrosController],
  providers: [ParametrosService],
  exports: [ParametrosService],
})
export class ParametrosModule implements OnModuleInit {
  constructor(private readonly parametrosService: ParametrosService) {}

  async onModuleInit() {
    // Siembra automática de semillas oficiales DIAN al inicio
    try {
      await this.parametrosService.sembrarSemillasGlobales();
    } catch (err: any) {
      console.warn('Advertencia en siembra de semillas maestras:', err.message);
    }
  }
}
