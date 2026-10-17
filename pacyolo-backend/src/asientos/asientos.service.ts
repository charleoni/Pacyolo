import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Asiento,
  AsientoLinea,
  EstadoAsiento,
  TipoComprobante,
} from './entities/asiento.entity.js';
import { PucCuenta } from '../puc/entities/puc.entity.js';
import { CreateAsientoDto } from './dto/create-asiento.dto.js';

@Injectable()
export class AsientosService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Asiento)
    private readonly asientoRepo: Repository<Asiento>,
    @InjectRepository(PucCuenta)
    private readonly pucRepo: Repository<PucCuenta>,
  ) {}

  /**
   * Registra un comprobante contable validando estrictamente partida doble y exigencias NIIF
   */
  async create(dto: CreateAsientoDto): Promise<Asiento> {
    // 1. Idempotencia: Si ya fue procesado externamente, retornar el existente
    if (dto.origen_sistema && dto.origen_documento_id) {
      const existente = await this.asientoRepo.findOne({
        where: {
          empresa_id: dto.empresa_id,
          origen_sistema: dto.origen_sistema,
          origen_documento_id: dto.origen_documento_id,
        },
        relations: {
          lineas: {
            cuenta: true,
            tercero: true,
          },
        },
      });
      if (existente) {
        return existente;
      }
    }

    // 2. Validación Matemática de Partida Doble: SUM(Débitos) == SUM(Créditos)
    const totalDebito = Number(
      dto.lineas.reduce((acc, l) => acc + Number(l.debito || 0), 0).toFixed(2),
    );
    const totalCredito = Number(
      dto.lineas.reduce((acc, l) => acc + Number(l.credito || 0), 0).toFixed(2),
    );

    const diferencia = Math.abs(totalDebito - totalCredito);
    if (diferencia > 0.01) {
      throw new BadRequestException(
        `Descuadre contable detectado. Total Débitos: $${totalDebito.toLocaleString()} | Total Créditos: $${totalCredito.toLocaleString()} | Diferencia: $${diferencia.toFixed(2)}. La partida doble debe ser exacta.`,
      );
    }

    if (totalDebito <= 0) {
      throw new BadRequestException(
        'El comprobante debe contener valores mayores a cero para ser contabilizado.',
      );
    }

    // 3. Validación de Cuentas PUC y exigencias de auxiliares y terceros
    const cuentaIds = [...new Set(dto.lineas.map((l) => l.cuenta_id))];
    const cuentas = await this.pucRepo.find({
      where: { id: In(cuentaIds), empresa_id: dto.empresa_id },
    });

    const cuentasMap = new Map<string, PucCuenta>();
    cuentas.forEach((c) => cuentasMap.set(c.id, c));

    for (const linea of dto.lineas) {
      const cuenta = cuentasMap.get(linea.cuenta_id);
      if (!cuenta) {
        throw new BadRequestException(
          `La cuenta contable con ID ${linea.cuenta_id} no existe o no pertenece a esta empresa`,
        );
      }

      if (!cuenta.permite_movimiento) {
        throw new BadRequestException(
          `La cuenta [${cuenta.codigo} - ${cuenta.nombre}] es de nivel superior y NO permite movimientos directos. Debe seleccionar una cuenta auxiliar.`,
        );
      }

      if (cuenta.exige_tercero && !linea.tercero_id) {
        throw new BadRequestException(
          `La cuenta [${cuenta.codigo} - ${cuenta.nombre}] exige especificar un Tercero (cliente, proveedor o empleado) obligatorio.`,
        );
      }
    }

    // 4. Ejecución Transaccional Atómica (Consecutivo + Asiento + Líneas)
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Cálculo de consecutivo secuencial ininterrumpido por tipo de comprobante
      const maxRes = await queryRunner.manager
        .createQueryBuilder(Asiento, 'a')
        .select('COALESCE(MAX(a.consecutivo), 0)', 'max')
        .where('a.empresa_id = :empresaId', { empresaId: dto.empresa_id })
        .andWhere('a.tipo_comprobante = :tipo', { tipo: dto.tipo_comprobante })
        .setLock('pessimistic_write')
        .getRawOne();

      const siguienteConsecutivo = Number(maxRes.max) + 1;
      const numeroComprobante = `${dto.tipo_comprobante}-${String(siguienteConsecutivo).padStart(6, '0')}`;

      // Crear cabecera
      const nuevoAsiento = new Asiento();
      nuevoAsiento.empresa_id = dto.empresa_id;
      nuevoAsiento.tipo_comprobante = dto.tipo_comprobante;
      nuevoAsiento.consecutivo = siguienteConsecutivo;
      nuevoAsiento.numero_comprobante = numeroComprobante;
      nuevoAsiento.fecha_contable = new Date(dto.fecha_contable);
      nuevoAsiento.glosa_general = dto.glosa_general;
      nuevoAsiento.estado = dto.estado ?? EstadoAsiento.CONTABILIZADO;
      nuevoAsiento.origen_sistema = dto.origen_sistema ?? 'MANUAL';
      nuevoAsiento.origen_documento_tipo = dto.origen_documento_tipo ?? null as any;
      nuevoAsiento.origen_documento_id = dto.origen_documento_id ?? null as any;
      nuevoAsiento.total_debito = totalDebito;
      nuevoAsiento.total_credito = totalCredito;
      nuevoAsiento.created_by = dto.created_by ?? null as any;

      const asientoGuardado = await queryRunner.manager.save(Asiento, nuevoAsiento);

      // Crear líneas
      const lineasAInsertar = dto.lineas.map((linea) => {
        const item = new AsientoLinea();
        item.asiento_id = asientoGuardado.id;
        item.cuenta_id = linea.cuenta_id;
        item.tercero_id = linea.tercero_id ?? null as any;
        item.centro_costo_id = linea.centro_costo_id ?? null as any;
        item.debito = Number(linea.debito || 0);
        item.credito = Number(linea.credito || 0);
        item.base_impuesto = Number(linea.base_impuesto || 0);
        item.glosa_detalle = linea.glosa_detalle;
        item.documento_referencia = linea.documento_referencia ?? null as any;
        item.fecha_vencimiento = linea.fecha_vencimiento
          ? new Date(linea.fecha_vencimiento)
          : (null as any);
        return item;
      });

      await queryRunner.manager.save(AsientoLinea, lineasAInsertar);
      await queryRunner.commitTransaction();

      return await this.findOne(asientoGuardado.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    empresaId: string,
    filters?: {
      tipo?: TipoComprobante;
      estado?: EstadoAsiento;
      fechaInicio?: string;
      fechaFin?: string;
    },
  ): Promise<Asiento[]> {
    const qb = this.asientoRepo
      .createQueryBuilder('a')
      .where('a.empresa_id = :empresaId', { empresaId })
      .leftJoinAndSelect('a.lineas', 'l')
      .leftJoinAndSelect('l.cuenta', 'c')
      .leftJoinAndSelect('l.tercero', 't')
      .orderBy('a.fecha_contable', 'DESC')
      .addOrderBy('a.consecutivo', 'DESC');

    if (filters?.tipo) {
      qb.andWhere('a.tipo_comprobante = :tipo', { tipo: filters.tipo });
    }
    if (filters?.estado) {
      qb.andWhere('a.estado = :estado', { estado: filters.estado });
    }
    if (filters?.fechaInicio) {
      qb.andWhere('a.fecha_contable >= :inicio', { inicio: filters.fechaInicio });
    }
    if (filters?.fechaFin) {
      qb.andWhere('a.fecha_contable <= :fin', { fin: filters.fechaFin });
    }

    return await qb.getMany();
  }

  async findOne(id: string): Promise<Asiento> {
    const asiento = await this.asientoRepo.findOne({
      where: { id },
      relations: {
        lineas: {
          cuenta: true,
          tercero: true,
        },
        empresa: true,
      },
    });

    if (!asiento) {
      throw new NotFoundException(`Comprobante contable con ID ${id} no encontrado`);
    }

    return asiento;
  }

  /**
   * Anula un comprobante contable generando un asiento de reversión estricto NIIF
   */
  async anular(id: string, motivo: string, usuarioId?: string): Promise<Asiento> {
    const original = await this.findOne(id);

    if (original.estado === EstadoAsiento.ANULADO) {
      throw new BadRequestException('El comprobante ya se encuentra anulado');
    }

    // Invertir débitos y créditos para reversar el impacto contable
    const lineasReversion = original.lineas.map((l) => ({
      cuenta_id: l.cuenta_id,
      tercero_id: l.tercero_id,
      centro_costo_id: l.centro_costo_id,
      debito: Number(l.credito),
      credito: Number(l.debito),
      glosa_detalle: `REVERSIÓN: ${l.glosa_detalle}`,
      documento_referencia: original.numero_comprobante,
    }));

    const asientoReversion = await this.create({
      empresa_id: original.empresa_id,
      tipo_comprobante: TipoComprobante.AJU,
      fecha_contable: new Date().toISOString().split('T')[0],
      glosa_general: `ANULACIÓN de ${original.numero_comprobante}: ${motivo}`,
      created_by: usuarioId,
      lineas: lineasReversion,
    });

    original.estado = EstadoAsiento.ANULADO;
    original.reversado_por_id = asientoReversion.id;
    await this.asientoRepo.save(original);

    return original;
  }
}
