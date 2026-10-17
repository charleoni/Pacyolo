import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImpuestoRegla, TipoImpuesto } from './entities/impuesto-regla.entity.js';
import { Empresa } from '../empresas/entities/empresa.entity.js';
import { PucCuenta } from '../puc/entities/puc.entity.js';
import { CreateImpuestoReglaDto } from './dto/create-impuesto-regla.dto.js';
import { UpdateImpuestoReglaDto } from './dto/update-impuesto-regla.dto.js';
import { FilterImpuestoReglaDto } from './dto/filter-impuesto-regla.dto.js';

@Injectable()
export class ImpuestosService {
  constructor(
    @InjectRepository(ImpuestoRegla)
    private readonly impuestoRepo: Repository<ImpuestoRegla>,
    @InjectRepository(Empresa)
    private readonly empresaRepo: Repository<Empresa>,
    @InjectRepository(PucCuenta)
    private readonly pucRepo: Repository<PucCuenta>,
  ) {}

  async create(createDto: CreateImpuestoReglaDto): Promise<ImpuestoRegla> {
    const empresa = await this.empresaRepo.findOne({ where: { id: createDto.empresa_id } });
    if (!empresa) {
      throw new NotFoundException(`La empresa con ID ${createDto.empresa_id} no existe.`);
    }

    const existeCodigo = await this.impuestoRepo.findOne({
      where: { empresa_id: createDto.empresa_id, codigo: createDto.codigo },
    });
    if (existeCodigo) {
      throw new ConflictException(
        `Ya existe una regla de impuesto con el código '${createDto.codigo}' para esta empresa.`,
      );
    }

    await this.validarCuentaAuxiliar(createDto.cuenta_credito_id, createDto.empresa_id, 'crédito');

    if (createDto.cuenta_debito_id) {
      await this.validarCuentaAuxiliar(createDto.cuenta_debito_id, createDto.empresa_id, 'débito');
    }

    const regla = this.impuestoRepo.create({
      ...createDto,
      base_minima: createDto.base_minima ?? 0,
      activo: createDto.activo ?? true,
    });

    return await this.impuestoRepo.save(regla);
  }

  async findAll(filter: FilterImpuestoReglaDto): Promise<ImpuestoRegla[]> {
    const query = this.impuestoRepo
      .createQueryBuilder('regla')
      .leftJoinAndSelect('regla.cuenta_credito', 'cuenta_credito')
      .leftJoinAndSelect('regla.cuenta_debito', 'cuenta_debito')
      .where('regla.empresa_id = :empresa_id', { empresa_id: filter.empresa_id });

    if (filter.tipo_impuesto) {
      query.andWhere('regla.tipo_impuesto = :tipo', { tipo: filter.tipo_impuesto });
    }

    if (filter.activo !== undefined) {
      query.andWhere('regla.activo = :activo', { activo: filter.activo });
    }

    return await query
      .orderBy('regla.tipo_impuesto', 'ASC')
      .addOrderBy('regla.codigo', 'ASC')
      .getMany();
  }

  async findOne(id: string): Promise<ImpuestoRegla> {
    const regla = await this.impuestoRepo.findOne({
      where: { id },
      relations: {
        cuenta_credito: true,
        cuenta_debito: true,
      },
    });

    if (!regla) {
      throw new NotFoundException(`La regla de impuesto con ID ${id} no existe.`);
    }

    return regla;
  }

  async update(id: string, updateDto: UpdateImpuestoReglaDto): Promise<ImpuestoRegla> {
    const regla = await this.findOne(id);

    if (updateDto.cuenta_credito_id) {
      await this.validarCuentaAuxiliar(updateDto.cuenta_credito_id, regla.empresa_id, 'crédito');
    }

    if (updateDto.cuenta_debito_id) {
      await this.validarCuentaAuxiliar(updateDto.cuenta_debito_id, regla.empresa_id, 'débito');
    }

    Object.assign(regla, updateDto);
    return await this.impuestoRepo.save(regla);
  }

  async remove(id: string): Promise<void> {
    const regla = await this.findOne(id);
    await this.impuestoRepo.remove(regla);
  }

  /**
   * Siembra las reglas tributarias colombianas estándar para la empresa,
   * cruzando con las cuentas PUC sembradas automáticamente.
   */
  async sembrarReglasEstandar(empresa_id: string): Promise<ImpuestoRegla[]> {
    const empresa = await this.empresaRepo.findOne({ where: { id: empresa_id } });
    if (!empresa) {
      throw new NotFoundException(`La empresa con ID ${empresa_id} no existe.`);
    }

    // Buscamos las cuentas NIIF estándar en el PUC de la empresa
    const cuentas = await this.pucRepo.find({
      where: { empresa_id },
    });

    const cuentaPorCodigo = new Map(cuentas.map((c) => [c.codigo, c]));

    const buscarAuxiliar = (cod: string): PucCuenta | undefined => {
      const c = cuentaPorCodigo.get(cod);
      return c && c.permite_movimiento ? c : undefined;
    };

    const cCompras = buscarAuxiliar('236540');
    const cServicios = buscarAuxiliar('236525');
    const cHonorarios = buscarAuxiliar('236515');
    const cReteIca = buscarAuxiliar('2368');
    const cIvaVentas = buscarAuxiliar('240801');
    const cIvaCompras = buscarAuxiliar('240802');

    const reglasASembrar: Partial<ImpuestoRegla>[] = [];

    if (cCompras) {
      reglasASembrar.push({
        empresa_id,
        tipo_impuesto: TipoImpuesto.RETEFUENTE,
        codigo: 'RETE_COMPRAS_2.5',
        nombre: 'Retención en la Fuente por Compras (Declarantes) 2.5%',
        descripcion: 'Aplica sobre compras generales a declarantes. Base mínima 27 UVT (~$1.270.000 COP)',
        porcentaje: 2.5,
        base_minima: 1270000,
        cuenta_credito_id: cCompras.id,
        activo: true,
      });
    }

    if (cServicios) {
      reglasASembrar.push({
        empresa_id,
        tipo_impuesto: TipoImpuesto.RETEFUENTE,
        codigo: 'RETE_SERVICIOS_4.0',
        nombre: 'Retención en la Fuente por Servicios Generales 4.0%',
        descripcion: 'Aplica a servicios generales. Base mínima 4 UVT (~$188.000 COP)',
        porcentaje: 4.0,
        base_minima: 188000,
        cuenta_credito_id: cServicios.id,
        activo: true,
      });
    }

    if (cHonorarios) {
      reglasASembrar.push({
        empresa_id,
        tipo_impuesto: TipoImpuesto.RETEFUENTE,
        codigo: 'RETE_HONORARIOS_10.0',
        nombre: 'Retención en la Fuente por Honorarios y Consultoría 10.0%',
        descripcion: 'Aplica a personas jurídicas o naturales declarantes. Sin base mínima (aplica desde $1 peso)',
        porcentaje: 10.0,
        base_minima: 0,
        cuenta_credito_id: cHonorarios.id,
        activo: true,
      });
    }

    if (cReteIca) {
      reglasASembrar.push({
        empresa_id,
        tipo_impuesto: TipoImpuesto.RETEICA,
        codigo: 'RETEICA_BOGOTA_9.66',
        nombre: 'Retención de ICA Régimen Común 9.66 x 1.000 (0.966%)',
        descripcion: 'Tarifa general de servicios y comercio Bogotá D.C. (9.66 por mil)',
        porcentaje: 0.966,
        base_minima: 188000,
        cuenta_credito_id: cReteIca.id,
        activo: true,
      });
    }

    if (cIvaCompras) {
      reglasASembrar.push({
        empresa_id,
        tipo_impuesto: TipoImpuesto.IVA,
        codigo: 'IVA_19_DESCONTABLE',
        nombre: 'IVA Descontable en Compras y Servicios 19.0%',
        descripcion: 'Impuesto sobre las ventas descontable en compras de inventario y gastos operacionales',
        porcentaje: 19.0,
        base_minima: 0,
        cuenta_credito_id: cIvaCompras.id, // Cuenta base para el impuesto
        cuenta_debito_id: cIvaCompras.id,
        activo: true,
      });
    }

    if (cIvaVentas) {
      reglasASembrar.push({
        empresa_id,
        tipo_impuesto: TipoImpuesto.IVA,
        codigo: 'IVA_19_GENERADO',
        nombre: 'IVA Generado en Ventas de Bienes y Servicios 19.0%',
        descripcion: 'Impuesto sobre las ventas generado por pagar a la DIAN',
        porcentaje: 19.0,
        base_minima: 0,
        cuenta_credito_id: cIvaVentas.id,
        activo: true,
      });
    }

    const resultado: ImpuestoRegla[] = [];
    for (const reglaData of reglasASembrar) {
      const existente = await this.impuestoRepo.findOne({
        where: { empresa_id, codigo: reglaData.codigo },
      });
      if (!existente) {
        const creada = this.impuestoRepo.create(reglaData);
        resultado.push(await this.impuestoRepo.save(creada));
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
