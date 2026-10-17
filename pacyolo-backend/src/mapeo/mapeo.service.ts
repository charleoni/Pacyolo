import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlantillaMapeo, TipoConceptoMapeo } from './entities/plantilla-mapeo.entity.js';
import { Empresa } from '../empresas/entities/empresa.entity.js';
import { PucCuenta } from '../puc/entities/puc.entity.js';
import { CreatePlantillaMapeoDto } from './dto/create-plantilla-mapeo.dto.js';
import { UpdatePlantillaMapeoDto } from './dto/update-plantilla-mapeo.dto.js';
import { FilterPlantillaMapeoDto } from './dto/filter-plantilla-mapeo.dto.js';

@Injectable()
export class MapeoService {
  constructor(
    @InjectRepository(PlantillaMapeo)
    private readonly mapeoRepo: Repository<PlantillaMapeo>,
    @InjectRepository(Empresa)
    private readonly empresaRepo: Repository<Empresa>,
    @InjectRepository(PucCuenta)
    private readonly pucRepo: Repository<PucCuenta>,
  ) {}

  async create(createDto: CreatePlantillaMapeoDto): Promise<PlantillaMapeo> {
    const empresa = await this.empresaRepo.findOne({ where: { id: createDto.empresa_id } });
    if (!empresa) {
      throw new NotFoundException(`La empresa con ID ${createDto.empresa_id} no existe.`);
    }

    const existeCodigo = await this.mapeoRepo.findOne({
      where: {
        empresa_id: createDto.empresa_id,
        codigo_concepto: createDto.codigo_concepto,
      },
    });
    if (existeCodigo) {
      throw new ConflictException(
        `Ya existe una plantilla de mapeo con el concepto '${createDto.codigo_concepto}' para esta empresa.`,
      );
    }

    await this.validarCuentaAuxiliar(createDto.cuenta_debito_id, createDto.empresa_id, 'débito');
    await this.validarCuentaAuxiliar(createDto.cuenta_credito_id, createDto.empresa_id, 'crédito');

    const plantilla = this.mapeoRepo.create({
      ...createDto,
      tipo_concepto: createDto.tipo_concepto ?? TipoConceptoMapeo.COMPRA_GASTO,
      reglas_impuestos_codigos: createDto.reglas_impuestos_codigos ?? [],
      aplica_retencion: createDto.aplica_retencion ?? true,
      activo: createDto.activo ?? true,
    });

    return await this.mapeoRepo.save(plantilla);
  }

  async findAll(filter: FilterPlantillaMapeoDto): Promise<PlantillaMapeo[]> {
    const query = this.mapeoRepo
      .createQueryBuilder('plantilla')
      .leftJoinAndSelect('plantilla.cuenta_debito', 'cuenta_debito')
      .leftJoinAndSelect('plantilla.cuenta_credito', 'cuenta_credito')
      .where('plantilla.empresa_id = :empresa_id', { empresa_id: filter.empresa_id });

    if (filter.tipo_concepto) {
      query.andWhere('plantilla.tipo_concepto = :tipo', { tipo: filter.tipo_concepto });
    }

    if (filter.activo !== undefined) {
      query.andWhere('plantilla.activo = :activo', { activo: filter.activo });
    }

    return await query
      .orderBy('plantilla.tipo_concepto', 'ASC')
      .addOrderBy('plantilla.codigo_concepto', 'ASC')
      .getMany();
  }

  async findOne(id: string): Promise<PlantillaMapeo> {
    const plantilla = await this.mapeoRepo.findOne({
      where: { id },
      relations: {
        cuenta_debito: true,
        cuenta_credito: true,
      },
    });

    if (!plantilla) {
      throw new NotFoundException(`La plantilla de mapeo con ID ${id} no existe.`);
    }

    return plantilla;
  }

  async findByCodigo(empresa_id: string, codigo_concepto: string): Promise<PlantillaMapeo> {
    const plantilla = await this.mapeoRepo.findOne({
      where: { empresa_id, codigo_concepto },
      relations: {
        cuenta_debito: true,
        cuenta_credito: true,
      },
    });

    if (!plantilla) {
      throw new NotFoundException(
        `No se encontró la plantilla para el concepto '${codigo_concepto}' en esta empresa.`,
      );
    }

    return plantilla;
  }

  async update(id: string, updateDto: UpdatePlantillaMapeoDto): Promise<PlantillaMapeo> {
    const plantilla = await this.findOne(id);

    if (updateDto.cuenta_debito_id) {
      await this.validarCuentaAuxiliar(updateDto.cuenta_debito_id, plantilla.empresa_id, 'débito');
    }

    if (updateDto.cuenta_credito_id) {
      await this.validarCuentaAuxiliar(updateDto.cuenta_credito_id, plantilla.empresa_id, 'crédito');
    }

    Object.assign(plantilla, updateDto);
    return await this.mapeoRepo.save(plantilla);
  }

  async remove(id: string): Promise<void> {
    const plantilla = await this.findOne(id);
    await this.mapeoRepo.remove(plantilla);
  }

  /**
   * Siembra las plantillas de mapeo contable estándar para la empresa,
   * vinculando las cuentas del PUC y los códigos de impuestos colombianos.
   */
  async sembrarPlantillasEstandar(empresa_id: string): Promise<PlantillaMapeo[]> {
    const empresa = await this.empresaRepo.findOne({ where: { id: empresa_id } });
    if (!empresa) {
      throw new NotFoundException(`La empresa con ID ${empresa_id} no existe.`);
    }

    const cuentas = await this.pucRepo.find({ where: { empresa_id } });
    const cuentaPorCodigo = new Map(cuentas.map((c) => [c.codigo, c]));

    const buscarAuxiliar = (cod: string): PucCuenta | undefined => {
      const c = cuentaPorCodigo.get(cod);
      return c && c.permite_movimiento ? c : undefined;
    };

    // Cuentas de Pasivo / CxP
    const cProvNacionales = buscarAuxiliar('220505');
    const cHonorariosCxP = buscarAuxiliar('233505');
    const cServiciosCxP = buscarAuxiliar('233510');
    const cServPublicosCxP = buscarAuxiliar('233525');

    // Cuentas de Inventario y Gastos
    const cInventario = buscarAuxiliar('1435');
    const cHonorariosGasto = buscarAuxiliar('511095') || buscarAuxiliar('511030') || buscarAuxiliar('511010');
    const cServiciosGasto = buscarAuxiliar('513505');
    const cEnergiaGasto = buscarAuxiliar('513530');
    const cMantenimientoGasto = buscarAuxiliar('5145');
    const cDiversosGasto = buscarAuxiliar('5195');

    const plantillasASembrar: Partial<PlantillaMapeo>[] = [];

    if (cInventario && cProvNacionales) {
      plantillasASembrar.push({
        empresa_id,
        codigo_concepto: 'COMPRA_INVENTARIO',
        nombre: 'Compra de Mercancías e Inventarios',
        descripcion: 'Causa inventario (1435 Débito) contra proveedores nacionales (220505 Crédito)',
        tipo_concepto: TipoConceptoMapeo.COMPRA_GASTO,
        cuenta_debito_id: cInventario.id,
        cuenta_credito_id: cProvNacionales.id,
        reglas_impuestos_codigos: ['IVA_19_DESCONTABLE', 'RETE_COMPRAS_2.5', 'RETEICA_BOGOTA_9.66'],
        aplica_retencion: true,
        activo: true,
      });
    }

    if (cHonorariosGasto && cHonorariosCxP) {
      plantillasASembrar.push({
        empresa_id,
        codigo_concepto: 'HONORARIOS_PROFESIONALES',
        nombre: 'Honorarios y Asesorías Profesionales',
        descripcion: 'Causa gasto de honorarios (5110 Débito) contra honorarios por pagar (233505 Crédito)',
        tipo_concepto: TipoConceptoMapeo.COMPRA_GASTO,
        cuenta_debito_id: cHonorariosGasto.id,
        cuenta_credito_id: cHonorariosCxP.id,
        reglas_impuestos_codigos: ['RETE_HONORARIOS_10.0', 'RETEICA_BOGOTA_9.66'],
        aplica_retencion: true,
        activo: true,
      });
    }

    if (cServiciosGasto && cServiciosCxP) {
      plantillasASembrar.push({
        empresa_id,
        codigo_concepto: 'SERVICIOS_ASEO_VIGILANCIA',
        nombre: 'Servicios Generales de Aseo y Vigilancia',
        descripcion: 'Causa gasto de servicios (513505 Débito) contra costos por pagar (233510 Crédito)',
        tipo_concepto: TipoConceptoMapeo.COMPRA_GASTO,
        cuenta_debito_id: cServiciosGasto.id,
        cuenta_credito_id: cServiciosCxP.id,
        reglas_impuestos_codigos: ['IVA_19_DESCONTABLE', 'RETE_SERVICIOS_4.0', 'RETEICA_BOGOTA_9.66'],
        aplica_retencion: true,
        activo: true,
      });
    }

    if (cEnergiaGasto && cServPublicosCxP) {
      plantillasASembrar.push({
        empresa_id,
        codigo_concepto: 'SERVICIOS_PUBLICOS',
        nombre: 'Servicios Públicos (Energía, Agua, Comunicaciones)',
        descripcion: 'Causa gasto de servicios públicos (513530 Débito) contra CxP (233525 Crédito)',
        tipo_concepto: TipoConceptoMapeo.COMPRA_GASTO,
        cuenta_debito_id: cEnergiaGasto.id,
        cuenta_credito_id: cServPublicosCxP.id,
        reglas_impuestos_codigos: [],
        aplica_retencion: false,
        activo: true,
      });
    }

    if (cMantenimientoGasto && cServiciosCxP) {
      plantillasASembrar.push({
        empresa_id,
        codigo_concepto: 'MANTENIMIENTO_REPARACIONES',
        nombre: 'Mantenimientos, Reparaciones y Locativos',
        descripcion: 'Causa gasto de mantenimiento (5145 Débito) contra cuentas por pagar (233510 Crédito)',
        tipo_concepto: TipoConceptoMapeo.COMPRA_GASTO,
        cuenta_debito_id: cMantenimientoGasto.id,
        cuenta_credito_id: cServiciosCxP.id,
        reglas_impuestos_codigos: ['IVA_19_DESCONTABLE', 'RETE_SERVICIOS_4.0', 'RETEICA_BOGOTA_9.66'],
        aplica_retencion: true,
        activo: true,
      });
    }

    if (cDiversosGasto && cProvNacionales) {
      plantillasASembrar.push({
        empresa_id,
        codigo_concepto: 'GASTOS_DIVERSOS',
        nombre: 'Gastos Diversos y Papelería General',
        descripcion: 'Causa gasto diverso (5195 Débito) contra proveedores (220505 Crédito)',
        tipo_concepto: TipoConceptoMapeo.COMPRA_GASTO,
        cuenta_debito_id: cDiversosGasto.id,
        cuenta_credito_id: cProvNacionales.id,
        reglas_impuestos_codigos: ['IVA_19_DESCONTABLE', 'RETE_COMPRAS_2.5'],
        aplica_retencion: true,
        activo: true,
      });
    }

    const resultado: PlantillaMapeo[] = [];
    for (const data of plantillasASembrar) {
      const existente = await this.mapeoRepo.findOne({
        where: { empresa_id, codigo_concepto: data.codigo_concepto },
      });
      if (!existente) {
        const creada = this.mapeoRepo.create(data);
        resultado.push(await this.mapeoRepo.save(creada));
      }
    }

    return resultado;
  }

  private async validarCuentaAuxiliar(
    cuenta_id: string,
    empresa_id: string,
    rol: 'crédito' | 'débito',
  ): Promise<PucCuenta> {
    const cuenta = await this.pucRepo.findOne({
      where: { id: cuenta_id },
    });

    if (!cuenta) {
      throw new NotFoundException(`La cuenta PUC para ${rol} con ID ${cuenta_id} no existe.`);
    }

    if (cuenta.empresa_id !== empresa_id) {
      throw new BadRequestException(
        `La cuenta PUC '${cuenta.codigo} - ${cuenta.nombre}' no pertenece a la empresa indicada.`,
      );
    }

    if (!cuenta.permite_movimiento) {
      throw new BadRequestException(
        `La cuenta PUC '${cuenta.codigo} - ${cuenta.nombre}' es de nivel superior y no permite movimientos auxiliares.`,
      );
    }

    return cuenta;
  }
}
