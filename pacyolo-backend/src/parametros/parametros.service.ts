import { Injectable, Logger, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { TipoIdentificacion } from './entities/tipo-identificacion.entity.js';
import { TipoPersona } from './entities/tipo-persona.entity.js';
import { RegimenFiscal } from './entities/regimen-fiscal.entity.js';
import { ClasificacionTercero } from './entities/clasificacion-tercero.entity.js';
import { TipoComprobanteConfig } from './entities/tipo-comprobante-config.entity.js';
import { MetodoPago } from './entities/metodo-pago.entity.js';
import {
  CreateTipoIdentificacionDto,
  CreateTipoPersonaDto,
  CreateRegimenFiscalDto,
  CreateClasificacionTerceroDto,
  CreateTipoComprobanteConfigDto,
  CreateMetodoPagoDto,
} from './dto/parametro.dto.js';

@Injectable()
export class ParametrosService {
  private readonly logger = new Logger(ParametrosService.name);

  constructor(
    @InjectRepository(TipoIdentificacion)
    private readonly tipoIdRepo: Repository<TipoIdentificacion>,
    @InjectRepository(TipoPersona)
    private readonly tipoPersonaRepo: Repository<TipoPersona>,
    @InjectRepository(RegimenFiscal)
    private readonly regimenRepo: Repository<RegimenFiscal>,
    @InjectRepository(ClasificacionTercero)
    private readonly clasificacionRepo: Repository<ClasificacionTercero>,
    @InjectRepository(TipoComprobanteConfig)
    private readonly comprobanteRepo: Repository<TipoComprobanteConfig>,
    @InjectRepository(MetodoPago)
    private readonly metodoPagoRepo: Repository<MetodoPago>,
  ) {}

  /**
   * Siembra automática de catálogos paramétricos oficiales de Colombia (DUR 2420 / DIAN)
   */
  async sembrarSemillasGlobales(): Promise<void> {
    // 1. Tipos de Identificación
    const tiposIdSemilla = [
      { codigo: 'NIT', nombre: 'Número de Identificación Tributaria', codigo_dian: '31', aplica_digito_verificacion: true },
      { codigo: 'CC', nombre: 'Cédula de Ciudadanía', codigo_dian: '13', aplica_digito_verificacion: false },
      { codigo: 'CE', nombre: 'Cédula de Extranjería', codigo_dian: '22', aplica_digito_verificacion: false },
      { codigo: 'TI', nombre: 'Tarjeta de Identidad', codigo_dian: '12', aplica_digito_verificacion: false },
      { codigo: 'PASAPORTE', nombre: 'Pasaporte', codigo_dian: '41', aplica_digito_verificacion: false },
      { codigo: 'PPT', nombre: 'Permiso por Protección Temporal (PPT)', codigo_dian: '47', aplica_digito_verificacion: false },
    ];

    for (const t of tiposIdSemilla) {
      const existe = await this.tipoIdRepo.findOne({ where: { codigo: t.codigo, empresa_id: IsNull() } });
      if (!existe) {
        await this.tipoIdRepo.save(this.tipoIdRepo.create({ ...t, empresa_id: null, es_sistema: true, activo: true }));
      }
    }

    // 2. Tipos de Persona
    const tiposPersonaSemilla = [
      { codigo: 'NATURAL', nombre: 'Persona Natural', exige_razon_social: false },
      { codigo: 'JURIDICA', nombre: 'Persona Jurídica', exige_razon_social: true },
    ];

    for (const tp of tiposPersonaSemilla) {
      const existe = await this.tipoPersonaRepo.findOne({ where: { codigo: tp.codigo, empresa_id: IsNull() } });
      if (!existe) {
        await this.tipoPersonaRepo.save(this.tipoPersonaRepo.create({ ...tp, empresa_id: null, es_sistema: true, activo: true }));
      }
    }

    // 3. Regímenes Fiscales
    const regimenesSemilla = [
      { codigo: 'RESPONSABLE_IVA', nombre: 'Responsable de IVA (Régimen Común)', codigo_responsabilidad_dian: 'O-13', aplica_iva: true },
      { codigo: 'NO_RESPONSABLE_IVA', nombre: 'No Responsable de IVA (Régimen Simplificado)', codigo_responsabilidad_dian: 'R-99-PN', aplica_iva: false },
      { codigo: 'REGIMEN_SIMPLE', nombre: 'Régimen Simple de Tributación (RST)', codigo_responsabilidad_dian: 'O-47', aplica_iva: true },
      { codigo: 'GRAN_CONTRIBUYENTE', nombre: 'Gran Contribuyente', codigo_responsabilidad_dian: 'O-23', aplica_iva: true },
      { codigo: 'AUTORRETENEDOR', nombre: 'Autorretenedor en Renta', codigo_responsabilidad_dian: 'O-15', aplica_iva: true },
    ];

    for (const r of regimenesSemilla) {
      const existe = await this.regimenRepo.findOne({ where: { codigo: r.codigo, empresa_id: IsNull() } });
      if (!existe) {
        await this.regimenRepo.save(this.regimenRepo.create({ ...r, empresa_id: null, es_sistema: true, activo: true }));
      }
    }

    // 4. Clasificaciones de Terceros
    const clasificacionesSemilla = [
      { codigo: 'CLIENTE', nombre: 'Cliente Comercial', color_badge: '#10b981' },
      { codigo: 'PROVEEDOR', nombre: 'Proveedor de Bienes o Servicios', color_badge: '#6366f1' },
      { codigo: 'EMPLEADO', nombre: 'Empleado / Nómina', color_badge: '#06b6d4' },
      { codigo: 'CONTRATISTA', nombre: 'Contratista de Prestación de Servicios', color_badge: '#f59e0b' },
      { codigo: 'ACCIONISTA', nombre: 'Socio o Accionista', color_badge: '#8b5cf6' },
      { codigo: 'ACREEDOR', nombre: 'Acreedor Varios', color_badge: '#ec4899' },
    ];

    for (const c of clasificacionesSemilla) {
      const existe = await this.clasificacionRepo.findOne({ where: { codigo: c.codigo, empresa_id: IsNull() } });
      if (!existe) {
        await this.clasificacionRepo.save(this.clasificacionRepo.create({ ...c, empresa_id: null, es_sistema: true, activo: true }));
      }
    }

    // 5. Tipos de Comprobantes Contables
    const comprobantesSemilla = [
      { codigo: 'DIA', nombre: 'Comprobante de Diario', prefijo: 'DIA-' },
      { codigo: 'ING', nombre: 'Recibo de Caja / Ingreso', prefijo: 'RC-' },
      { codigo: 'EGR', nombre: 'Comprobante de Egreso / Pago', prefijo: 'CE-' },
      { codigo: 'CAU', nombre: 'Causación de Facturas', prefijo: 'CAU-' },
      { codigo: 'AJU', nombre: 'Ajuste Contable NIIF', prefijo: 'AJU-' },
      { codigo: 'APE', nombre: 'Balance de Apertura', prefijo: 'APE-' },
      { codigo: 'NC', nombre: 'Nota Crédito Contable', prefijo: 'NC-' },
      { codigo: 'ND', nombre: 'Nota Débito Contable', prefijo: 'ND-' },
    ];

    for (const comp of comprobantesSemilla) {
      const existe = await this.comprobanteRepo.findOne({ where: { codigo: comp.codigo, empresa_id: IsNull() } });
      if (!existe) {
        await this.comprobanteRepo.save(this.comprobanteRepo.create({ ...comp, empresa_id: null, es_sistema: true, activo: true }));
      }
    }

    // 6. Métodos de Pago
    const metodosPagoSemilla = [
      { codigo: 'EFECTIVO', nombre: 'Efectivo / Caja General', codigo_dian: '10', exige_referencia: false },
      { codigo: 'TRANSFERENCIA', nombre: 'Transferencia Electrónica Bancaria', codigo_dian: '47', exige_referencia: true },
      { codigo: 'CONSIGNACION', nombre: 'Consignación en Cuenta', codigo_dian: '42', exige_referencia: true },
      { codigo: 'CHEQUE', nombre: 'Cheque Bancario', codigo_dian: '20', exige_referencia: true },
      { codigo: 'TARJETA_DEBITO', nombre: 'Tarjeta Débito / Datáfono', codigo_dian: '48', exige_referencia: true },
      { codigo: 'TARJETA_CREDITO', nombre: 'Tarjeta de Crédito', codigo_dian: '49', exige_referencia: true },
      { codigo: 'BILLETERA_DIGITAL', nombre: 'Billetera Digital (Nequi / Daviplata)', codigo_dian: '1', exige_referencia: true },
    ];

    for (const m of metodosPagoSemilla) {
      const existe = await this.metodoPagoRepo.findOne({ where: { codigo: m.codigo, empresa_id: IsNull() } });
      if (!existe) {
        await this.metodoPagoRepo.save(this.metodoPagoRepo.create({ ...m, empresa_id: null, es_sistema: true, activo: true }));
      }
    }

    this.logger.log('🌱 Catálogos de tablas maestras oficiales DIAN sembrados con éxito.');
  }

  // ==========================================
  // CONSULTAS MULTI-TENANT COMBINADAS
  // ==========================================

  async listarTiposIdentificacion(empresaId?: string): Promise<TipoIdentificacion[]> {
    const qb = this.tipoIdRepo.createQueryBuilder('t');
    if (empresaId) {
      qb.where('t.empresa_id = :empresaId OR t.empresa_id IS NULL', { empresaId });
    } else {
      qb.where('t.empresa_id IS NULL');
    }
    return await qb.orderBy('t.es_sistema', 'DESC').addOrderBy('t.codigo', 'ASC').getMany();
  }

  async listarTiposPersona(empresaId?: string): Promise<TipoPersona[]> {
    const qb = this.tipoPersonaRepo.createQueryBuilder('t');
    if (empresaId) {
      qb.where('t.empresa_id = :empresaId OR t.empresa_id IS NULL', { empresaId });
    } else {
      qb.where('t.empresa_id IS NULL');
    }
    return await qb.orderBy('t.codigo', 'ASC').getMany();
  }

  async listarRegimenesFiscales(empresaId?: string): Promise<RegimenFiscal[]> {
    const qb = this.regimenRepo.createQueryBuilder('r');
    if (empresaId) {
      qb.where('r.empresa_id = :empresaId OR r.empresa_id IS NULL', { empresaId });
    } else {
      qb.where('r.empresa_id IS NULL');
    }
    return await qb.orderBy('r.codigo', 'ASC').getMany();
  }

  async listarClasificaciones(empresaId?: string): Promise<ClasificacionTercero[]> {
    const qb = this.clasificacionRepo.createQueryBuilder('c');
    if (empresaId) {
      qb.where('c.empresa_id = :empresaId OR c.empresa_id IS NULL', { empresaId });
    } else {
      qb.where('c.empresa_id IS NULL');
    }
    return await qb.orderBy('c.codigo', 'ASC').getMany();
  }

  async listarTiposComprobante(empresaId?: string): Promise<TipoComprobanteConfig[]> {
    const qb = this.comprobanteRepo.createQueryBuilder('c');
    if (empresaId) {
      qb.where('c.empresa_id = :empresaId OR c.empresa_id IS NULL', { empresaId });
    } else {
      qb.where('c.empresa_id IS NULL');
    }
    return await qb.orderBy('c.codigo', 'ASC').getMany();
  }

  async listarMetodosPago(empresaId?: string): Promise<MetodoPago[]> {
    const qb = this.metodoPagoRepo.createQueryBuilder('m');
    if (empresaId) {
      qb.where('m.empresa_id = :empresaId OR m.empresa_id IS NULL', { empresaId });
    } else {
      qb.where('m.empresa_id IS NULL');
    }
    return await qb.orderBy('m.codigo', 'ASC').getMany();
  }

  // ==========================================
  // OPERACIONES DE CREACIÓN Y EDICIÓN
  // ==========================================

  async crearTipoIdentificacion(dto: CreateTipoIdentificacionDto): Promise<TipoIdentificacion> {
    const existe = await this.tipoIdRepo.findOne({
      where: { codigo: dto.codigo.toUpperCase(), empresa_id: dto.empresa_id || undefined },
    });
    if (existe) {
      throw new ConflictException(`El tipo de identificación con código '${dto.codigo}' ya existe.`);
    }
    return await this.tipoIdRepo.save(this.tipoIdRepo.create({ ...dto, codigo: dto.codigo.toUpperCase() }));
  }

  async crearTipoPersona(dto: CreateTipoPersonaDto): Promise<TipoPersona> {
    const existe = await this.tipoPersonaRepo.findOne({
      where: { codigo: dto.codigo.toUpperCase(), empresa_id: dto.empresa_id || undefined },
    });
    if (existe) {
      throw new ConflictException(`El tipo de persona con código '${dto.codigo}' ya existe.`);
    }
    return await this.tipoPersonaRepo.save(this.tipoPersonaRepo.create({ ...dto, codigo: dto.codigo.toUpperCase() }));
  }

  async crearRegimenFiscal(dto: CreateRegimenFiscalDto): Promise<RegimenFiscal> {
    const existe = await this.regimenRepo.findOne({
      where: { codigo: dto.codigo.toUpperCase(), empresa_id: dto.empresa_id || undefined },
    });
    if (existe) {
      throw new ConflictException(`El régimen fiscal con código '${dto.codigo}' ya existe.`);
    }
    return await this.regimenRepo.save(this.regimenRepo.create({ ...dto, codigo: dto.codigo.toUpperCase() }));
  }

  async crearClasificacion(dto: CreateClasificacionTerceroDto): Promise<ClasificacionTercero> {
    const existe = await this.clasificacionRepo.findOne({
      where: { codigo: dto.codigo.toUpperCase(), empresa_id: dto.empresa_id || undefined },
    });
    if (existe) {
      throw new ConflictException(`La clasificación con código '${dto.codigo}' ya existe.`);
    }
    return await this.clasificacionRepo.save(this.clasificacionRepo.create({ ...dto, codigo: dto.codigo.toUpperCase() }));
  }

  async crearTipoComprobante(dto: CreateTipoComprobanteConfigDto): Promise<TipoComprobanteConfig> {
    const existe = await this.comprobanteRepo.findOne({
      where: { codigo: dto.codigo.toUpperCase(), empresa_id: dto.empresa_id || undefined },
    });
    if (existe) {
      throw new ConflictException(`El tipo de comprobante con código '${dto.codigo}' ya existe.`);
    }
    return await this.comprobanteRepo.save(this.comprobanteRepo.create({ ...dto, codigo: dto.codigo.toUpperCase() }));
  }

  async crearMetodoPago(dto: CreateMetodoPagoDto): Promise<MetodoPago> {
    const existe = await this.metodoPagoRepo.findOne({
      where: { codigo: dto.codigo.toUpperCase(), empresa_id: dto.empresa_id || undefined },
    });
    if (existe) {
      throw new ConflictException(`El método de pago con código '${dto.codigo}' ya existe.`);
    }
    return await this.metodoPagoRepo.save(this.metodoPagoRepo.create({ ...dto, codigo: dto.codigo.toUpperCase() }));
  }

  // ==========================================
  // INACTIVACIÓN Y ACTIVACIÓN (SOFT-DELETE)
  // ==========================================

  async cambiarEstado(catalogo: string, id: string, activo: boolean): Promise<any> {
    let repo: Repository<any>;

    switch (catalogo.toLowerCase()) {
      case 'tipos-identificacion':
        repo = this.tipoIdRepo;
        break;
      case 'tipos-persona':
        repo = this.tipoPersonaRepo;
        break;
      case 'regimenes-fiscales':
        repo = this.regimenRepo;
        break;
      case 'clasificaciones-tercero':
        repo = this.clasificacionRepo;
        break;
      case 'tipos-comprobante':
        repo = this.comprobanteRepo;
        break;
      case 'metodos-pago':
        repo = this.metodoPagoRepo;
        break;
      default:
        throw new BadRequestException(`Catálogo desconocido: '${catalogo}'`);
    }

    const entidad = await repo.findOne({ where: { id } });
    if (!entidad) {
      throw new NotFoundException(`Registro no encontrado en ${catalogo}`);
    }

    entidad.activo = activo;
    return await repo.save(entidad);
  }
}
