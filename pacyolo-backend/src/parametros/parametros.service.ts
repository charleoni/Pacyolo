import { Injectable, Logger, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { TipoIdentificacion } from './entities/tipo-identificacion.entity.js';
import { TipoPersona } from './entities/tipo-persona.entity.js';
import { RegimenFiscal } from './entities/regimen-fiscal.entity.js';
import { ClasificacionTercero } from './entities/clasificacion-tercero.entity.js';
import { TipoComprobanteConfig } from './entities/tipo-comprobante-config.entity.js';
import { MetodoPago } from './entities/metodo-pago.entity.js';
import { Departamento } from './entities/departamento.entity.js';
import { Municipio } from './entities/municipio.entity.js';
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
    @InjectRepository(Departamento)
    private readonly deptoRepo: Repository<Departamento>,
    @InjectRepository(Municipio)
    private readonly municipioRepo: Repository<Municipio>,
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

    // 7. Departamentos DANE Oficiales (32 Departamentos + Bogotá D.C.)
    const deptosSemilla = [
      { codigo: '05', nombre: 'Antioquia' },
      { codigo: '08', nombre: 'Atlántico' },
      { codigo: '11', nombre: 'Bogotá, D.C.' },
      { codigo: '13', nombre: 'Bolívar' },
      { codigo: '15', nombre: 'Boyacá' },
      { codigo: '17', nombre: 'Caldas' },
      { codigo: '18', nombre: 'Caquetá' },
      { codigo: '19', nombre: 'Cauca' },
      { codigo: '20', nombre: 'Cesar' },
      { codigo: '23', nombre: 'Córdoba' },
      { codigo: '25', nombre: 'Cundinamarca' },
      { codigo: '27', nombre: 'Chocó' },
      { codigo: '41', nombre: 'Huila' },
      { codigo: '44', nombre: 'La Guajira' },
      { codigo: '47', nombre: 'Magdalena' },
      { codigo: '50', nombre: 'Meta' },
      { codigo: '52', nombre: 'Nariño' },
      { codigo: '54', nombre: 'Norte de Santander' },
      { codigo: '63', nombre: 'Quindío' },
      { codigo: '66', nombre: 'Risaralda' },
      { codigo: '68', nombre: 'Santander' },
      { codigo: '70', nombre: 'Sucre' },
      { codigo: '73', nombre: 'Tolima' },
      { codigo: '76', nombre: 'Valle del Cauca' },
      { codigo: '81', nombre: 'Arauca' },
      { codigo: '85', nombre: 'Casanare' },
      { codigo: '86', nombre: 'Putumayo' },
      { codigo: '88', nombre: 'Archipiélago de San Andrés, Providencia y Santa Catalina' },
      { codigo: '91', nombre: 'Amazonas' },
      { codigo: '94', nombre: 'Guainía' },
      { codigo: '95', nombre: 'Guaviare' },
      { codigo: '97', nombre: 'Vaupés' },
      { codigo: '99', nombre: 'Vichada' },
    ];

    for (const d of deptosSemilla) {
      const existe = await this.deptoRepo.findOne({ where: { codigo: d.codigo } });
      if (!existe) {
        await this.deptoRepo.save(this.deptoRepo.create({ ...d, pais_codigo: 'CO', activo: true }));
      }
    }

    // 8. Municipios DANE Oficiales (Capitales y Polos Comerciales de Colombia)
    const municipiosSemilla = [
      { codigo: '11001', nombre: 'Bogotá, D.C.', departamento_codigo: '11', departamento_nombre: 'Bogotá, D.C.' },
      { codigo: '05001', nombre: 'Medellín', departamento_codigo: '05', departamento_nombre: 'Antioquia' },
      { codigo: '05088', nombre: 'Bello', departamento_codigo: '05', departamento_nombre: 'Antioquia' },
      { codigo: '05360', nombre: 'Itagüí', departamento_codigo: '05', departamento_nombre: 'Antioquia' },
      { codigo: '05266', nombre: 'Envigado', departamento_codigo: '05', departamento_nombre: 'Antioquia' },
      { codigo: '05615', nombre: 'Rionegro', departamento_codigo: '05', departamento_nombre: 'Antioquia' },
      { codigo: '76001', nombre: 'Cali', departamento_codigo: '76', departamento_nombre: 'Valle del Cauca' },
      { codigo: '76520', nombre: 'Palmira', departamento_codigo: '76', departamento_nombre: 'Valle del Cauca' },
      { codigo: '76109', nombre: 'Buenaventura', departamento_codigo: '76', departamento_nombre: 'Valle del Cauca' },
      { codigo: '76834', nombre: 'Tuluá', departamento_codigo: '76', departamento_nombre: 'Valle del Cauca' },
      { codigo: '76111', nombre: 'Buga', departamento_codigo: '76', departamento_nombre: 'Valle del Cauca' },
      { codigo: '76147', nombre: 'Cartago', departamento_codigo: '76', departamento_nombre: 'Valle del Cauca' },
      { codigo: '08001', nombre: 'Barranquilla', departamento_codigo: '08', departamento_nombre: 'Atlántico' },
      { codigo: '08758', nombre: 'Soledad', departamento_codigo: '08', departamento_nombre: 'Atlántico' },
      { codigo: '13001', nombre: 'Cartagena de Indias', departamento_codigo: '13', departamento_nombre: 'Bolívar' },
      { codigo: '68001', nombre: 'Bucaramanga', departamento_codigo: '68', departamento_nombre: 'Santander' },
      { codigo: '68276', nombre: 'Floridablanca', departamento_codigo: '68', departamento_nombre: 'Santander' },
      { codigo: '68307', nombre: 'Girón', departamento_codigo: '68', departamento_nombre: 'Santander' },
      { codigo: '68547', nombre: 'Piedecuesta', departamento_codigo: '68', departamento_nombre: 'Santander' },
      { codigo: '68081', nombre: 'Barrancabermeja', departamento_codigo: '68', departamento_nombre: 'Santander' },
      { codigo: '66001', nombre: 'Pereira', departamento_codigo: '66', departamento_nombre: 'Risaralda' },
      { codigo: '66170', nombre: 'Dosquebradas', departamento_codigo: '66', departamento_nombre: 'Risaralda' },
      { codigo: '17001', nombre: 'Manizales', departamento_codigo: '17', departamento_nombre: 'Caldas' },
      { codigo: '63001', nombre: 'Armenia', departamento_codigo: '63', departamento_nombre: 'Quindío' },
      { codigo: '47001', nombre: 'Santa Marta', departamento_codigo: '47', departamento_nombre: 'Magdalena' },
      { codigo: '54001', nombre: 'Cúcuta', departamento_codigo: '54', departamento_nombre: 'Norte de Santander' },
      { codigo: '73001', nombre: 'Ibagué', departamento_codigo: '73', departamento_nombre: 'Tolima' },
      { codigo: '52001', nombre: 'Pasto', departamento_codigo: '52', departamento_nombre: 'Nariño' },
      { codigo: '41001', nombre: 'Neiva', departamento_codigo: '41', departamento_nombre: 'Huila' },
      { codigo: '50001', nombre: 'Villavicencio', departamento_codigo: '50', departamento_nombre: 'Meta' },
      { codigo: '20001', nombre: 'Valledupar', departamento_codigo: '20', departamento_nombre: 'Cesar' },
      { codigo: '23001', nombre: 'Montería', departamento_codigo: '23', departamento_nombre: 'Córdoba' },
      { codigo: '70001', nombre: 'Sincelejo', departamento_codigo: '70', departamento_nombre: 'Sucre' },
      { codigo: '19001', nombre: 'Popayán', departamento_codigo: '19', departamento_nombre: 'Cauca' },
      { codigo: '15001', nombre: 'Tunja', departamento_codigo: '15', departamento_nombre: 'Boyacá' },
      { codigo: '15238', nombre: 'Duitama', departamento_codigo: '15', departamento_nombre: 'Boyacá' },
      { codigo: '15759', nombre: 'Sogamoso', departamento_codigo: '15', departamento_nombre: 'Boyacá' },
      { codigo: '44001', nombre: 'Riohacha', departamento_codigo: '44', departamento_nombre: 'La Guajira' },
      { codigo: '18001', nombre: 'Florencia', departamento_codigo: '18', departamento_nombre: 'Caquetá' },
      { codigo: '85001', nombre: 'Yopal', departamento_codigo: '85', departamento_nombre: 'Casanare' },
      { codigo: '27001', nombre: 'Quibdó', departamento_codigo: '27', departamento_nombre: 'Chocó' },
      { codigo: '81001', nombre: 'Arauca', departamento_codigo: '81', departamento_nombre: 'Arauca' },
      { codigo: '88001', nombre: 'San Andrés', departamento_codigo: '88', departamento_nombre: 'Archipiélago de San Andrés, Providencia y Santa Catalina' },
      { codigo: '86001', nombre: 'Mocoa', departamento_codigo: '86', departamento_nombre: 'Putumayo' },
      { codigo: '91001', nombre: 'Leticia', departamento_codigo: '91', departamento_nombre: 'Amazonas' },
      { codigo: '95001', nombre: 'San José del Guaviare', departamento_codigo: '95', departamento_nombre: 'Guaviare' },
      { codigo: '97001', nombre: 'Mitú', departamento_codigo: '97', departamento_nombre: 'Vaupés' },
      { codigo: '94001', nombre: 'Inírida', departamento_codigo: '94', departamento_nombre: 'Guainía' },
      { codigo: '99001', nombre: 'Puerto Carreño', departamento_codigo: '99', departamento_nombre: 'Vichada' },
      { codigo: '25754', nombre: 'Soacha', departamento_codigo: '25', departamento_nombre: 'Cundinamarca' },
      { codigo: '25175', nombre: 'Chía', departamento_codigo: '25', departamento_nombre: 'Cundinamarca' },
      { codigo: '25899', nombre: 'Zipaquirá', departamento_codigo: '25', departamento_nombre: 'Cundinamarca' },
      { codigo: '25269', nombre: 'Facatativá', departamento_codigo: '25', departamento_nombre: 'Cundinamarca' },
      { codigo: '25473', nombre: 'Mosquera', departamento_codigo: '25', departamento_nombre: 'Cundinamarca' },
      { codigo: '25430', nombre: 'Madrid', departamento_codigo: '25', departamento_nombre: 'Cundinamarca' },
      { codigo: '25286', nombre: 'Funza', departamento_codigo: '25', departamento_nombre: 'Cundinamarca' },
      { codigo: '25290', nombre: 'Fusagasugá', departamento_codigo: '25', departamento_nombre: 'Cundinamarca' },
      { codigo: '25307', nombre: 'Girardot', departamento_codigo: '25', departamento_nombre: 'Cundinamarca' },
      { codigo: '25126', nombre: 'Cajicá', departamento_codigo: '25', departamento_nombre: 'Cundinamarca' },
      { codigo: '25214', nombre: 'Cota', departamento_codigo: '25', departamento_nombre: 'Cundinamarca' },
    ];

    for (const mun of municipiosSemilla) {
      const existe = await this.municipioRepo.findOne({ where: { codigo: mun.codigo } });
      if (!existe) {
        await this.municipioRepo.save(this.municipioRepo.create({ ...mun, activo: true }));
      }
    }

    this.logger.log('🌱 Catálogos de tablas maestras oficiales DIAN y geografía DANE sembrados con éxito.');
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

  async listarDepartamentos(): Promise<Departamento[]> {
    return await this.deptoRepo.find({
      order: { nombre: 'ASC' },
    });
  }

  async buscarMunicipios(termino?: string, departamentoCodigo?: string): Promise<Municipio[]> {
    const qb = this.municipioRepo.createQueryBuilder('m');

    if (departamentoCodigo) {
      qb.andWhere('m.departamento_codigo = :departamentoCodigo', { departamentoCodigo });
    }

    if (termino && termino.trim().length > 0) {
      qb.andWhere('(LOWER(m.nombre) LIKE LOWER(:term) OR m.codigo LIKE :termRaw)', {
        term: `%${termino.trim()}%`,
        termRaw: `%${termino.trim()}%`,
      });
    }

    return await qb.orderBy('m.nombre', 'ASC').take(100).getMany();
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
      case 'departamentos':
        repo = this.deptoRepo;
        break;
      case 'municipios':
        repo = this.municipioRepo;
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
