import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipoIdentificacion } from './entities/tipo-identificacion.entity.js';
import { TipoPersona } from './entities/tipo-persona.entity.js';
import { RegimenFiscal } from './entities/regimen-fiscal.entity.js';
import { ClasificacionTercero } from './entities/clasificacion-tercero.entity.js';
import { TipoComprobanteConfig } from './entities/tipo-comprobante-config.entity.js';
import { MetodoPago } from './entities/metodo-pago.entity.js';
import { Departamento } from './entities/departamento.entity.js';
import { Municipio } from './entities/municipio.entity.js';
import { UnidadMedida } from './entities/unidad-medida.entity.js';
import { CategoriaArticulo } from './entities/categoria-articulo.entity.js';
import { Bodega } from './entities/bodega.entity.js';
import { TipoMovimiento } from './entities/tipo-movimiento.entity.js';
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
      Departamento,
      Municipio,
      UnidadMedida,
      CategoriaArticulo,
      Bodega,
      TipoMovimiento,
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
