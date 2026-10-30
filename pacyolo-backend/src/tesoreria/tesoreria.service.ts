import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, In } from 'typeorm';
import { CajaMenor, EstadoCajaMenor } from './entities/caja-menor.entity.js';
import { CajaMenorGasto, EstadoGastoCajaMenor } from './entities/caja-menor-gasto.entity.js';
import { CajaMenorArqueo, ResultadoArqueo } from './entities/caja-menor-arqueo.entity.js';
import { CuentaBancaria } from './entities/cuenta-bancaria.entity.js';
import { ExtractoBancario, ExtractoBancarioLinea, EstadoExtracto, TipoMovimientoExtracto } from './entities/extracto-bancario.entity.js';
import { ConciliacionBancaria, ConciliacionPartida, EstadoConciliacion, TipoPartidaConciliatoria } from './entities/conciliacion-bancaria.entity.js';
import { PucCuenta } from '../puc/entities/puc.entity.js';
import { Tercero } from '../terceros/entities/tercero.entity.js';
import { Asiento, AsientoLinea, TipoComprobante, EstadoAsiento } from '../asientos/entities/asiento.entity.js';
import { AsientosService } from '../asientos/asientos.service.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import {
  CreateCajaMenorDto,
  CreateGastoCajaMenorDto,
  CreateArqueoCajaMenorDto,
  ReembolsoCajaMenorDto,
  CreateCuentaBancariaDto,
  ImportarExtractoDto,
  EjecutarConciliacionDto,
  CausarNotaBancariaDto,
} from './dto/tesoreria.dto.js';

@Injectable()
export class TesoreriaService {
  constructor(
    @InjectRepository(CajaMenor)
    private readonly cajaRepo: Repository<CajaMenor>,
    @InjectRepository(CajaMenorGasto)
    private readonly gastoRepo: Repository<CajaMenorGasto>,
    @InjectRepository(CajaMenorArqueo)
    private readonly arqueoRepo: Repository<CajaMenorArqueo>,
    @InjectRepository(CuentaBancaria)
    private readonly cuentaBancariaRepo: Repository<CuentaBancaria>,
    @InjectRepository(ExtractoBancario)
    private readonly extractoRepo: Repository<ExtractoBancario>,
    @InjectRepository(ExtractoBancarioLinea)
    private readonly extractoLineaRepo: Repository<ExtractoBancarioLinea>,
    @InjectRepository(ConciliacionBancaria)
    private readonly conciliacionRepo: Repository<ConciliacionBancaria>,
    @InjectRepository(ConciliacionPartida)
    private readonly partidaRepo: Repository<ConciliacionPartida>,
    @InjectRepository(PucCuenta)
    private readonly pucRepo: Repository<PucCuenta>,
    @InjectRepository(Tercero)
    private readonly terceroRepo: Repository<Tercero>,
    @InjectRepository(AsientoLinea)
    private readonly asientoLineaRepo: Repository<AsientoLinea>,
    private readonly asientosService: AsientosService,
    private readonly auditoriaService: AuditoriaService,
    private readonly dataSource: DataSource,
  ) {}

  // =========================================================================
  // 1. GESTIÓN DE CAJAS MENORES (FONDO FIJO - 110510)
  // =========================================================================

  async crearCajaMenor(empresaId: string, dto: CreateCajaMenorDto, usuario: any): Promise<CajaMenor> {
    const existe = await this.cajaRepo.findOne({
      where: { empresa_id: empresaId, codigo: dto.codigo },
    });
    if (existe) {
      throw new BadRequestException(`Ya existe una caja menor con el código ${dto.codigo}`);
    }

    const cuentaPuc = await this.pucRepo.findOne({ where: { id: dto.cuenta_puc_id } });
    if (!cuentaPuc) throw new NotFoundException('Cuenta PUC de caja menor no encontrada');

    const responsable = await this.terceroRepo.findOne({ where: { id: dto.responsable_id } });
    if (!responsable) throw new NotFoundException('Tercero custodio/responsable no encontrado');

    let asientoAperturaId: string | null = null;

    // Si se indicó cuenta de banco origen, generamos comprobante de egreso por constitución de fondo fijo
    if (dto.cuenta_banco_origen_id) {
      let cuentaBanco = await this.pucRepo.findOne({ where: { id: dto.cuenta_banco_origen_id } });
      if (!cuentaBanco) {
        const ctaBancaria = await this.cuentaRepo.findOne({ where: { id: dto.cuenta_banco_origen_id } });
        if (ctaBancaria) {
          cuentaBanco = await this.pucRepo.findOne({ where: { id: ctaBancaria.cuenta_puc_id } });
        }
      }
      if (cuentaBanco) {
        const asiento = await this.asientosService.create({
          empresa_id: empresaId,
          tipo_comprobante: TipoComprobante.EGR,
          fecha_contable: new Date().toISOString().split('T')[0],
          glosa_general: `Constitución de fondo fijo ${dto.nombre} (${dto.codigo})`,
          lineas: [
            {
              cuenta_id: cuentaPuc.id,
              tercero_id: responsable.id,
              debito: Number(dto.monto_fondo_fijo),
              credito: 0,
              glosa_detalle: `Apertura fondo fijo de caja menor`,
            },
            {
              cuenta_id: cuentaBanco.id,
              tercero_id: responsable.id,
              debito: 0,
              credito: Number(dto.monto_fondo_fijo),
              glosa_detalle: `Desembolso bancario para constitución de caja menor`,
            },
          ],
        });
        asientoAperturaId = asiento.id;
      }
    }

    const caja = this.cajaRepo.create({
      empresa_id: empresaId,
      codigo: dto.codigo,
      nombre: dto.nombre,
      responsable_id: dto.responsable_id,
      cuenta_puc_id: dto.cuenta_puc_id,
      monto_fondo_fijo: dto.monto_fondo_fijo,
      saldo_actual_efectivo: dto.monto_fondo_fijo,
      saldo_en_vales: 0,
      estado: EstadoCajaMenor.ABIERTA,
      asiento_apertura_id: asientoAperturaId,
      observaciones: dto.observaciones,
      created_by: usuario?.id,
    });

    const guardada = await this.cajaRepo.save(caja);

    await this.auditoriaService.registrarLog({
      empresa_id: empresaId,
      usuario_id: usuario?.id || null,
      usuario_email: usuario?.email || 'admin@pacyolo.com',
      accion: 'CREAR_CAJA_MENOR',
      modulo: 'TESORERIA',
      entidad_id: guardada.id,
      datos_nuevos: { codigo: dto.codigo, monto: dto.monto_fondo_fijo },
    });

    return guardada;
  }

  async listarCajasMenores(empresaId: string): Promise<CajaMenor[]> {
    return await this.cajaRepo.find({
      where: { empresa_id: empresaId },
      relations: { responsable: true, cuenta_puc: true },
      order: { codigo: 'ASC' },
    });
  }

  async obtenerCajaMenorPorId(empresaId: string, id: string): Promise<CajaMenor> {
    const caja = await this.cajaRepo.findOne({
      where: { id, empresa_id: empresaId },
      relations: { responsable: true, cuenta_puc: true },
    });
    if (!caja) throw new NotFoundException('Caja menor no encontrada');
    return caja;
  }

  // =========================================================================
  // 2. GASTOS Y LEGALIZACIONES DE CAJA MENOR
  // =========================================================================

  async registrarGasto(empresaId: string, dto: CreateGastoCajaMenorDto, usuario: any): Promise<CajaMenorGasto> {
    const caja = await this.obtenerCajaMenorPorId(empresaId, dto.caja_menor_id);

    if (caja.estado === EstadoCajaMenor.CERRADA) {
      throw new BadRequestException('La caja menor está cerrada y no admite registros');
    }

    const montoTotal = Number(dto.total);
    if (Number(caja.saldo_actual_efectivo) < montoTotal) {
      throw new BadRequestException(
        `Saldo insuficiente en efectivo ($${Number(caja.saldo_actual_efectivo).toLocaleString()}) para cubrir el gasto de $${montoTotal.toLocaleString()}`,
      );
    }

    const cuentaGasto = await this.pucRepo.findOne({ where: { id: dto.cuenta_gasto_id } });
    if (!cuentaGasto) throw new NotFoundException('Cuenta contable de gasto no encontrada');

    const countGastos = await this.gastoRepo.count({
      where: { empresa_id: empresaId, caja_menor_id: caja.id },
    });
    const consecutivo = `VCM-${caja.codigo}-${String(countGastos + 1).padStart(4, '0')}`;

    const gasto = this.gastoRepo.create({
      empresa_id: empresaId,
      caja_menor_id: caja.id,
      consecutivo,
      fecha_gasto: new Date(dto.fecha_gasto),
      tercero_id: dto.tercero_id,
      concepto: dto.concepto,
      cuenta_gasto_id: dto.cuenta_gasto_id,
      centro_costo_id: dto.centro_costo_id,
      subtotal: dto.subtotal,
      iva: dto.iva || 0,
      retefuente: dto.retefuente || 0,
      total: montoTotal,
      soporte_factura_ref: dto.soporte_factura_ref,
      estado: EstadoGastoCajaMenor.LEGALIZADO,
      created_by: usuario?.id,
    });

    const guardado = await this.gastoRepo.save(gasto);

    // Actualizar saldos de caja: se reduce el efectivo disponible y aumenta el saldo en vales
    caja.saldo_actual_efectivo = Number((Number(caja.saldo_actual_efectivo) - montoTotal).toFixed(2));
    caja.saldo_en_vales = Number((Number(caja.saldo_en_vales) + montoTotal).toFixed(2));
    await this.cajaRepo.save(caja);

    await this.auditoriaService.registrarLog({
      empresa_id: empresaId,
      usuario_id: usuario?.id || null,
      usuario_email: usuario?.email || 'admin@pacyolo.com',
      accion: 'REGISTRAR_GASTO_CAJA_MENOR',
      modulo: 'TESORERIA',
      entidad_id: guardado.id,
      datos_nuevos: { consecutivo, total: montoTotal, concepto: dto.concepto },
    });

    return guardado;
  }

  async listarGastos(empresaId: string, cajaId: string, estado?: EstadoGastoCajaMenor): Promise<CajaMenorGasto[]> {
    const where: any = { empresa_id: empresaId, caja_menor_id: cajaId };
    if (estado) where.estado = estado;

    return await this.gastoRepo.find({
      where,
      relations: { tercero: true, cuenta_gasto: true },
      order: { fecha_gasto: 'DESC', created_at: 'DESC' },
    });
  }

  // =========================================================================
  // 3. REEMBOLSO / REINTEGRO DE CAJA MENOR (VÍA EGRESO BANCARIO EGR)
  // =========================================================================

  async reembolsarCajaMenor(empresaId: string, dto: ReembolsoCajaMenorDto, usuario: any): Promise<{ asiento: Asiento; totalReembolsado: number }> {
    const caja = await this.obtenerCajaMenorPorId(empresaId, dto.caja_menor_id);

    if (!dto.gastos_ids || dto.gastos_ids.length === 0) {
      throw new BadRequestException('Debe seleccionar al menos un vale de gasto para el reembolso');
    }

    const gastos = await this.gastoRepo.find({ where: { id: In(dto.gastos_ids) } });
    if (gastos.length !== dto.gastos_ids.length) {
      throw new BadRequestException('Algunos de los gastos seleccionados no existen');
    }

    for (const g of gastos) {
      if (g.estado !== EstadoGastoCajaMenor.LEGALIZADO) {
        throw new BadRequestException(`El gasto ${g.consecutivo} ya fue reembolsado o se encuentra anulado`);
      }
    }

    let cuentaBanco = await this.pucRepo.findOne({ where: { id: dto.cuenta_banco_pago_id } });
    if (!cuentaBanco) {
      const ctaBancaria = await this.cuentaRepo.findOne({ where: { id: dto.cuenta_banco_pago_id } });
      if (ctaBancaria) {
        cuentaBanco = await this.pucRepo.findOne({ where: { id: ctaBancaria.cuenta_puc_id } });
      }
    }
    if (!cuentaBanco) throw new NotFoundException('Cuenta bancaria de pago no encontrada');

    // Construir líneas del comprobante de egreso:
    // Débito a cada cuenta de gasto (51/52) + Débito a IVA (240802 si aplica) - Crédito a Retenciones (2365 si aplica)
    // Contrapartida: Crédito al banco por el valor total a reembolsar
    let totalEfectivoReembolso = 0;
    const lineasAsiento: any[] = [];

    for (const g of gastos) {
      totalEfectivoReembolso += Number(g.total);

      // Línea de gasto
      lineasAsiento.push({
        cuenta_id: g.cuenta_gasto_id,
        tercero_id: g.tercero_id,
        centro_costo_id: g.centro_costo_id,
        debito: Number(g.subtotal),
        credito: 0,
        base_impuesto: Number(g.subtotal),
        documento_referencia: g.consecutivo,
        glosa_detalle: `${g.concepto} (${g.soporte_factura_ref || g.consecutivo})`,
      });

      // Si hubo IVA descontable
      if (Number(g.iva) > 0) {
        const cuentaIva = await this.pucRepo.findOne({
          where: { empresa_id: empresaId, codigo: '240802' },
        }) || await this.pucRepo.findOne({
          where: { empresa_id: empresaId, codigo: '2408' },
        });

        if (cuentaIva) {
          lineasAsiento.push({
            cuenta_id: cuentaIva.id,
            tercero_id: g.tercero_id,
            debito: Number(g.iva),
            credito: 0,
            documento_referencia: g.consecutivo,
            glosa_detalle: `IVA Descontable en caja menor (${g.consecutivo})`,
          });
        }
      }

      // Si hubo retención en la fuente practicada
      if (Number(g.retefuente) > 0) {
        const cuentaRete = await this.pucRepo.findOne({
          where: { empresa_id: empresaId, codigo: '236540' },
        }) || await this.pucRepo.findOne({
          where: { empresa_id: empresaId, codigo: '2365' },
        });

        if (cuentaRete) {
          lineasAsiento.push({
            cuenta_id: cuentaRete.id,
            tercero_id: g.tercero_id,
            debito: 0,
            credito: Number(g.retefuente),
            documento_referencia: g.consecutivo,
            glosa_detalle: `Retención en la fuente caja menor (${g.consecutivo})`,
          });
        }
      }
    }

    // Línea de crédito al banco por el total girado
    lineasAsiento.push({
      cuenta_id: cuentaBanco.id,
      tercero_id: caja.responsable_id,
      debito: 0,
      credito: Number(totalEfectivoReembolso.toFixed(2)),
      glosa_detalle: `Reembolso de gastos fondo fijo ${caja.nombre} (${caja.codigo})`,
    });

    const asiento = await this.asientosService.create({
          empresa_id: empresaId,
      tipo_comprobante: TipoComprobante.EGR,
      fecha_contable: dto.fecha_egreso,
      glosa_general: `Reposición de Caja Menor ${caja.nombre} - ${gastos.length} vales legalizados`,
      lineas: lineasAsiento,
    });

    // Actualizar estado de los vales y restaurar el saldo de caja menor
    for (const g of gastos) {
      g.estado = EstadoGastoCajaMenor.REEMBOLSADO;
      g.reembolso_asiento_id = asiento.id;
      await this.gastoRepo.save(g);
    }

    caja.saldo_actual_efectivo = Number((Number(caja.saldo_actual_efectivo) + totalEfectivoReembolso).toFixed(2));
    caja.saldo_en_vales = Number((Number(caja.saldo_en_vales) - totalEfectivoReembolso).toFixed(2));
    await this.cajaRepo.save(caja);

    await this.auditoriaService.registrarLog({
      empresa_id: empresaId,
      usuario_id: usuario?.id || null,
      usuario_email: usuario?.email || 'admin@pacyolo.com',
      accion: 'REEMBOLSO_CAJA_MENOR',
      modulo: 'TESORERIA',
      entidad_id: caja.id,
      datos_nuevos: { asiento_id: asiento.id, total: totalEfectivoReembolso, vales_cantidad: gastos.length },
    });

    return { asiento, totalReembolsado: totalEfectivoReembolso };
  }

  // =========================================================================
  // 4. ARQUEOS DE CAJA MENOR (CONTROL DE FALTANTES / SOBRANTES)
  // =========================================================================

  async registrarArqueo(empresaId: string, dto: CreateArqueoCajaMenorDto, usuario: any): Promise<CajaMenorArqueo> {
    const caja = await this.obtenerCajaMenorPorId(empresaId, dto.caja_menor_id);

    // Obtener la suma real de vales vigentes no reembolsados
    const valesPendientes = await this.gastoRepo.find({
      where: {
        empresa_id: empresaId,
        caja_menor_id: caja.id,
        estado: EstadoGastoCajaMenor.LEGALIZADO,
      },
    });

    const totalVales = valesPendientes.reduce((acc, curr) => acc + Number(curr.total), 0);
    const totalEfectivo = Number(dto.total_efectivo_fisico);
    const totalFondoContado = Number((totalEfectivo + totalVales).toFixed(2));
    const montoFijo = Number(caja.monto_fondo_fijo);
    const diferencia = Number((totalFondoContado - montoFijo).toFixed(2));

    let resultado = ResultadoArqueo.CUADRADO;
    if (diferencia > 0) resultado = ResultadoArqueo.SOBRANTE;
    else if (diferencia < 0) resultado = ResultadoArqueo.FALTANTE;

    const countArqueos = await this.arqueoRepo.count({
      where: { empresa_id: empresaId, caja_menor_id: caja.id },
    });
    const consecutivo = `ARQ-${caja.codigo}-${String(countArqueos + 1).padStart(4, '0')}`;

    let asientoAjusteId: string | null = null;

    // Si hay diferencia, opcionalmente generamos el comprobante contable de ajuste
    if (Math.abs(diferencia) >= 0.01) {
      if (resultado === ResultadoArqueo.SOBRANTE) {
        // Sobrante: Débito Caja Menor <-> Crédito 429553 (Otros Ingresos - Sobrante de Caja)
        const cuentaSobrante = await this.pucRepo.findOne({
          where: { empresa_id: empresaId, codigo: '429553' },
        }) || await this.pucRepo.findOne({
          where: { empresa_id: empresaId, codigo: '4295' },
        });

        if (cuentaSobrante) {
          const asiento = await this.asientosService.create({
          empresa_id: empresaId,
            tipo_comprobante: TipoComprobante.AJU,
            fecha_contable: dto.fecha_arqueo.split('T')[0],
            glosa_general: `Ajuste por Sobrante en Arqueo de Caja Menor ${consecutivo}`,
            lineas: [
              {
                cuenta_id: caja.cuenta_puc_id,
                tercero_id: caja.responsable_id,
                debito: Math.abs(diferencia),
                credito: 0,
                glosa_detalle: `Ingreso de efectivo por sobrante en arqueo`,
              },
              {
                cuenta_id: cuentaSobrante.id,
                tercero_id: caja.responsable_id,
                debito: 0,
                credito: Math.abs(diferencia),
                glosa_detalle: `Abono a Otros Ingresos por sobrante de caja`,
              },
            ],
          });
          asientoAjusteId = asiento.id;
        }
      } else if (resultado === ResultadoArqueo.FALTANTE) {
        // Faltante: Débito 136530 (Cuentas por cobrar a trabajadores - Faltante) <-> Crédito Caja Menor
        const cuentaFaltante = await this.pucRepo.findOne({
          where: { empresa_id: empresaId, codigo: '136530' },
        }) || await this.pucRepo.findOne({
          where: { empresa_id: empresaId, codigo: '1365' },
        });

        if (cuentaFaltante) {
          const asiento = await this.asientosService.create({
          empresa_id: empresaId,
            tipo_comprobante: TipoComprobante.AJU,
            fecha_contable: dto.fecha_arqueo.split('T')[0],
            glosa_general: `Ajuste por Faltante en Arqueo de Caja Menor ${consecutivo}`,
            lineas: [
              {
                cuenta_id: cuentaFaltante.id,
                tercero_id: caja.responsable_id,
                debito: Math.abs(diferencia),
                credito: 0,
                glosa_detalle: `Cobro a custodio por faltante en caja menor`,
              },
              {
                cuenta_id: caja.cuenta_puc_id,
                tercero_id: caja.responsable_id,
                debito: 0,
                credito: Math.abs(diferencia),
                glosa_detalle: `Ajuste salida de caja menor por faltante físico`,
              },
            ],
          });
          asientoAjusteId = asiento.id;
        }
      }
    }

    const arqueo = this.arqueoRepo.create({
      empresa_id: empresaId,
      caja_menor_id: caja.id,
      consecutivo,
      fecha_arqueo: new Date(dto.fecha_arqueo),
      auditor_id: usuario?.id,
      custodio_id: caja.responsable_id,
      desglose_efectivo: dto.desglose_efectivo || {},
      total_efectivo_fisico: totalEfectivo,
      total_vales_comprobantes: totalVales,
      total_fondo_contado: totalFondoContado,
      monto_fondo_fijo: montoFijo,
      diferencia,
      resultado,
      asiento_id: asientoAjusteId,
      observaciones: dto.observaciones,
      created_by: usuario?.id,
    });

    const guardado = await this.arqueoRepo.save(arqueo);

    await this.auditoriaService.registrarLog({
      empresa_id: empresaId,
      usuario_id: usuario?.id || null,
      usuario_email: usuario?.email || 'admin@pacyolo.com',
      accion: 'ARQUEO_CAJA_MENOR',
      modulo: 'TESORERIA',
      entidad_id: guardado.id,
      datos_nuevos: { consecutivo, resultado, diferencia, totalFondoContado },
    });

    return guardado;
  }

  async listarArqueos(empresaId: string, cajaId: string): Promise<CajaMenorArqueo[]> {
    return await this.arqueoRepo.find({
      where: { empresa_id: empresaId, caja_menor_id: cajaId },
      relations: { custodio: true },
      order: { fecha_arqueo: 'DESC' },
    });
  }

  // =========================================================================
  // 5. CUENTAS BANCARIAS & LIBRO AUXILIAR (1110)
  // =========================================================================

  async crearCuentaBancaria(empresaId: string, dto: CreateCuentaBancariaDto, usuario: any): Promise<CuentaBancaria> {
    const existe = await this.cuentaBancariaRepo.findOne({
      where: { empresa_id: empresaId, numero_cuenta: dto.numero_cuenta },
    });
    if (existe) {
      throw new BadRequestException(`Ya existe una cuenta bancaria con el número ${dto.numero_cuenta}`);
    }

    const cuentaPuc = await this.pucRepo.findOne({ where: { id: dto.cuenta_puc_id } });
    if (!cuentaPuc) throw new NotFoundException('Cuenta auxiliar PUC no encontrada');

    const cuenta = this.cuentaBancariaRepo.create({
      empresa_id: empresaId,
      banco_nombre: dto.banco_nombre,
      tipo_cuenta: dto.tipo_cuenta,
      numero_cuenta: dto.numero_cuenta,
      cuenta_puc_id: dto.cuenta_puc_id,
      moneda: dto.moneda || 'COP',
      descripcion: dto.descripcion,
    });

    return await this.cuentaBancariaRepo.save(cuenta);
  }

  async listarCuentasBancarias(empresaId: string): Promise<CuentaBancaria[]> {
    return await this.cuentaBancariaRepo.find({
      where: { empresa_id: empresaId },
      relations: { cuenta_puc: true },
      order: { banco_nombre: 'ASC' },
    });
  }

  async obtenerCuentaBancariaPorId(empresaId: string, id: string): Promise<CuentaBancaria> {
    const cuenta = await this.cuentaBancariaRepo.findOne({
      where: { id, empresa_id: empresaId },
      relations: { cuenta_puc: true },
    });
    if (!cuenta) throw new NotFoundException('Cuenta bancaria no encontrada');
    return cuenta;
  }

  async obtenerLibroAuxiliarBancos(empresaId: string, cuentaBancariaId: string, fechaInicio?: string, fechaFin?: string) {
    const cuentaBancaria = await this.obtenerCuentaBancariaPorId(empresaId, cuentaBancariaId);

    const qb = this.asientoLineaRepo.createQueryBuilder('l')
      .innerJoinAndSelect('l.asiento', 'a')
      .leftJoinAndSelect('l.tercero', 't')
      .where('a.empresa_id = :empresaId', { empresaId })
      .andWhere('l.cuenta_id = :cuentaId', { cuentaId: cuentaBancaria.cuenta_puc_id })
      .andWhere('a.estado = :estado', { estado: EstadoAsiento.CONTABILIZADO });

    if (fechaInicio) qb.andWhere('a.fecha_contable >= :fechaInicio', { fechaInicio });
    if (fechaFin) qb.andWhere('a.fecha_contable <= :fechaFin', { fechaFin });

    qb.orderBy('a.fecha_contable', 'ASC').addOrderBy('a.consecutivo', 'ASC');

    const lineas = await qb.getMany();

    let saldo = 0;
    const movimientos = lineas.map((lin) => {
      const debito = Number(lin.debito || 0);
      const credito = Number(lin.credito || 0);
      saldo += debito - credito; // Cuentas de activo aumentan por el débito y disminuyen por el crédito
      return {
        id: lin.id,
        asiento_id: lin.asiento.id,
        numero_comprobante: lin.asiento.numero_comprobante,
        tipo_comprobante: lin.asiento.tipo_comprobante,
        fecha: lin.asiento.fecha_contable,
        tercero: lin.tercero ? lin.tercero.razon_social || lin.tercero.nombre_completo : null,
        documento_referencia: lin.documento_referencia,
        glosa: lin.glosa_detalle || lin.asiento.glosa_general,
        debito,
        credito,
        saldo_acumulado: Number(saldo.toFixed(2)),
      };
    });

    return {
      cuentaBancaria,
      totalDebitos: lineas.reduce((acc, curr) => acc + Number(curr.debito || 0), 0),
      totalCreditos: lineas.reduce((acc, curr) => acc + Number(curr.credito || 0), 0),
      saldoFinalLibros: Number(saldo.toFixed(2)),
      movimientos,
    };
  }

  // =========================================================================
  // 6. EXTRACTOS BANCARIOS (IMPORTACIÓN CSV / EXCEL)
  // =========================================================================

  async importarExtracto(empresaId: string, dto: ImportarExtractoDto, usuario: any): Promise<ExtractoBancario> {
    const cuenta = await this.obtenerCuentaBancariaPorId(empresaId, dto.cuenta_bancaria_id);

    const existente = await this.extractoRepo.findOne({
      where: {
        empresa_id: empresaId,
        cuenta_bancaria_id: cuenta.id,
        periodo_anio: dto.periodo_anio,
        periodo_mes: dto.periodo_mes,
      },
    });

    if (existente) {
      throw new BadRequestException(
        `Ya existe un extracto registrado para el período ${dto.periodo_mes}/${dto.periodo_anio} en la cuenta ${cuenta.numero_cuenta}`,
      );
    }

    let totalCreditos = 0;
    let totalDebitos = 0;

    const lineasExtracto: ExtractoBancarioLinea[] = [];

    for (const l of dto.lineas) {
      const valor = Number(l.valor);
      if (l.tipo_movimiento === TipoMovimientoExtracto.CREDITO) totalCreditos += valor;
      else totalDebitos += valor;

      const lin = this.extractoLineaRepo.create({
        fecha: new Date(l.fecha),
        descripcion: l.descripcion,
        referencia: l.referencia,
        tipo_movimiento: l.tipo_movimiento,
        valor,
        conciliado: false,
      });
      lineasExtracto.push(lin);
    }

    const extracto = this.extractoRepo.create({
      empresa_id: empresaId,
      cuenta_bancaria_id: cuenta.id,
      periodo_anio: dto.periodo_anio,
      periodo_mes: dto.periodo_mes,
      fecha_corte: new Date(dto.fecha_corte),
      saldo_inicial: dto.saldo_inicial,
      total_creditos_depositos: Number(totalCreditos.toFixed(2)),
      total_debitos_retiros: Number(totalDebitos.toFixed(2)),
      saldo_final: dto.saldo_final,
      nombre_archivo_origen: dto.nombre_archivo,
      estado: EstadoExtracto.BORRADOR,
      created_by: usuario?.id,
      lineas: lineasExtracto,
    });

    const guardado = await this.extractoRepo.save(extracto);

    await this.auditoriaService.registrarLog({
      empresa_id: empresaId,
      usuario_id: usuario?.id || null,
      usuario_email: usuario?.email || 'admin@pacyolo.com',
      accion: 'IMPORTAR_EXTRACTO_BANCARIO',
      modulo: 'TESORERIA',
      entidad_id: guardado.id,
      datos_nuevos: {
        periodo: `${dto.periodo_mes}/${dto.periodo_anio}`,
        saldo_final: dto.saldo_final,
        partidas: lineasExtracto.length,
      },
    });

    return guardado;
  }

  async listarExtractos(empresaId: string, cuentaBancariaId?: string): Promise<ExtractoBancario[]> {
    const where: any = { empresa_id: empresaId };
    if (cuentaBancariaId) where.cuenta_bancaria_id = cuentaBancariaId;

    return await this.extractoRepo.find({
      where,
      relations: { cuenta_bancaria: true },
      order: { periodo_anio: 'DESC', periodo_mes: 'DESC' },
    });
  }

  async obtenerExtractoPorId(empresaId: string, id: string): Promise<ExtractoBancario> {
    const extracto = await this.extractoRepo.findOne({
      where: { id, empresa_id: empresaId },
      relations: { cuenta_bancaria: true, lineas: true },
    });
    if (!extracto) throw new NotFoundException('Extracto bancario no encontrado');
    return extracto;
  }

  // =========================================================================
  // 7. MOTOR DE CONCILIACIÓN BANCARIA (CRUCE AUTOMÁTICO & MATCHING)
  // =========================================================================

  async ejecutarConciliacion(empresaId: string, dto: EjecutarConciliacionDto, usuario: any): Promise<ConciliacionBancaria> {
    const cuenta = await this.obtenerCuentaBancariaPorId(empresaId, dto.cuenta_bancaria_id);
    const extracto = await this.obtenerExtractoPorId(empresaId, dto.extracto_id);

    // Obtener libro auxiliar del período
    const fechaInicio = `${dto.periodo_anio}-${String(dto.periodo_mes).padStart(2, '0')}-01`;
    // Último día del mes
    const fechaFinDate = new Date(dto.periodo_anio, dto.periodo_mes, 0);
    const fechaFin = fechaFinDate.toISOString().split('T')[0];

    const libroAux = await this.obtenerLibroAuxiliarBancos(empresaId, cuenta.id, fechaInicio, fechaFin);

    const saldoExtracto = Number(extracto.saldo_final);
    const saldoLibros = Number(libroAux.saldoFinalLibros);

    // Matching: cruzamos líneas de extracto vs movimientos contables
    const partidas: ConciliacionPartida[] = [];
    const extractoLineasPendientes = [...extracto.lineas];
    const movimientosLibroPendientes = [...libroAux.movimientos];

    let totalChequesTransito = 0;
    let totalConsignacionesTransito = 0;
    let totalNotasDebitoPendientes = 0;
    let totalNotasCreditoPendientes = 0;

    // 1. Emparejamiento exacto por Valor y Referencia/Fecha
    for (let i = extractoLineasPendientes.length - 1; i >= 0; i--) {
      const extLin = extractoLineasPendientes[i];
      const matchIdx = movimientosLibroPendientes.findIndex((mov) => {
        // En banco: Retiro (DÉBITO extracto) corresponde a salida de dinero (CRÉDITO libro contable)
        if (extLin.tipo_movimiento === TipoMovimientoExtracto.DEBITO) {
          return Math.abs(Number(mov.credito) - Number(extLin.valor)) < 0.01;
        } else {
          // En banco: Depósito (CRÉDITO extracto) corresponde a entrada de dinero (DÉBITO libro contable)
          return Math.abs(Number(mov.debito) - Number(extLin.valor)) < 0.01;
        }
      });

      if (matchIdx !== -1) {
        const movMatch = movimientosLibroPendientes[matchIdx];
        partidas.push(
          this.partidaRepo.create({
            tipo_partida: TipoPartidaConciliatoria.MATCH_EXACTO,
            extracto_linea_id: extLin.id,
            asiento_linea_id: movMatch.id,
            fecha: extLin.fecha,
            concepto: `Coincidencia: ${extLin.descripcion}`,
            referencia: extLin.referencia || movMatch.numero_comprobante,
            valor: extLin.valor,
          }),
        );
        extractoLineasPendientes.splice(i, 1);
        movimientosLibroPendientes.splice(matchIdx, 1);
      }
    }

    // 2. Partidas en extracto no registradas en libros
    for (const extLin of extractoLineasPendientes) {
      if (extLin.tipo_movimiento === TipoMovimientoExtracto.DEBITO) {
        totalNotasDebitoPendientes += Number(extLin.valor);
        partidas.push(
          this.partidaRepo.create({
            tipo_partida: TipoPartidaConciliatoria.NOTA_DEBITO_PENDIENTE,
            extracto_linea_id: extLin.id,
            fecha: extLin.fecha,
            concepto: `Nota Débito en extracto: ${extLin.descripcion}`,
            referencia: extLin.referencia,
            valor: Number(extLin.valor),
          }),
        );
      } else {
        totalNotasCreditoPendientes += Number(extLin.valor);
        partidas.push(
          this.partidaRepo.create({
            tipo_partida: TipoPartidaConciliatoria.NOTA_CREDITO_PENDIENTE,
            extracto_linea_id: extLin.id,
            fecha: extLin.fecha,
            concepto: `Nota Crédito en extracto: ${extLin.descripcion}`,
            referencia: extLin.referencia,
            valor: Number(extLin.valor),
          }),
        );
      }
    }

    // 3. Partidas en libros no registradas en extracto
    for (const mov of movimientosLibroPendientes) {
      if (Number(mov.credito) > 0) {
        // Cheques girados y no cobrados o transferencias en tránsito
        totalChequesTransito += Number(mov.credito);
        partidas.push(
          this.partidaRepo.create({
            tipo_partida: TipoPartidaConciliatoria.CHEQUE_EN_TRANSITO,
            asiento_linea_id: mov.id,
            fecha: new Date(mov.fecha),
            concepto: `Cheque / Egreso en tránsito: ${mov.glosa}`,
            referencia: mov.numero_comprobante,
            valor: Number(mov.credito),
          }),
        );
      } else if (Number(mov.debito) > 0) {
        // Consignaciones en tránsito
        totalConsignacionesTransito += Number(mov.debito);
        partidas.push(
          this.partidaRepo.create({
            tipo_partida: TipoPartidaConciliatoria.CONSIGNACION_EN_TRANSITO,
            asiento_linea_id: mov.id,
            fecha: new Date(mov.fecha),
            concepto: `Consignación / Recaudo en tránsito: ${mov.glosa}`,
            referencia: mov.numero_comprobante,
            valor: Number(mov.debito),
          }),
        );
      }
    }

    // Cuadre a doble columna:
    // Saldo extracto ajustado = Saldo Extracto + Consignaciones en tránsito - Cheques en tránsito
    const saldoConciliadoExtracto = Number(
      (saldoExtracto + totalConsignacionesTransito - totalChequesTransito).toFixed(2),
    );
    // Saldo libros ajustado = Saldo Libros + Notas Crédito no registradas - Notas Débito no registradas
    const saldoConciliadoLibros = Number(
      (saldoLibros + totalNotasCreditoPendientes - totalNotasDebitoPendientes).toFixed(2),
    );

    const diferencia = Number(Math.abs(saldoConciliadoExtracto - saldoConciliadoLibros).toFixed(2));

    const consecutivo = `CON-${cuenta.numero_cuenta.slice(-4)}-${dto.periodo_anio}${String(dto.periodo_mes).padStart(2, '0')}`;

    // Buscar si ya existía una previa en proceso y sobrescribirla
    let conciliacion = await this.conciliacionRepo.findOne({
      where: {
        empresa_id: empresaId,
        cuenta_bancaria_id: cuenta.id,
        periodo_anio: dto.periodo_anio,
        periodo_mes: dto.periodo_mes,
      },
    });

    if (conciliacion) {
      await this.partidaRepo.delete({ conciliacion_id: conciliacion.id });
    } else {
      conciliacion = this.conciliacionRepo.create({
        empresa_id: empresaId,
        cuenta_bancaria_id: cuenta.id,
        extracto_id: extracto.id,
        consecutivo,
        periodo_anio: dto.periodo_anio,
        periodo_mes: dto.periodo_mes,
        elaborado_por: usuario?.email || 'Contador',
      });
    }

    conciliacion.fecha_conciliacion = new Date(dto.fecha_conciliacion);
    conciliacion.saldo_extracto_bancario = saldoExtracto;
    conciliacion.saldo_libros_contables = saldoLibros;
    conciliacion.total_cheques_en_transito = Number(totalChequesTransito.toFixed(2));
    conciliacion.total_consignaciones_en_transito = Number(totalConsignacionesTransito.toFixed(2));
    conciliacion.total_notas_debito_pendientes = Number(totalNotasDebitoPendientes.toFixed(2));
    conciliacion.total_notas_credito_pendientes = Number(totalNotasCreditoPendientes.toFixed(2));
    conciliacion.saldo_conciliado_extracto = saldoConciliadoExtracto;
    conciliacion.saldo_conciliado_libros = saldoConciliadoLibros;
    conciliacion.diferencia_descuadre = diferencia;
    conciliacion.estado = EstadoConciliacion.EN_PROCESO;
    conciliacion.observaciones = dto.observaciones;
    conciliacion.partidas = partidas;

    const guardada = await this.conciliacionRepo.save(conciliacion);

    await this.auditoriaService.registrarLog({
      empresa_id: empresaId,
      usuario_id: usuario?.id || null,
      usuario_email: usuario?.email || 'admin@pacyolo.com',
      accion: 'EJECUTAR_CONCILIACION_BANCARIA',
      modulo: 'TESORERIA',
      entidad_id: guardada.id,
      datos_nuevos: {
        consecutivo,
        diferencia,
        saldoExtracto,
        saldoLibros,
      },
    });

    return guardada;
  }

  async obtenerConciliacionPorId(empresaId: string, id: string): Promise<ConciliacionBancaria> {
    const conc = await this.conciliacionRepo.findOne({
      where: { id, empresa_id: empresaId },
      relations: { cuenta_bancaria: true, extracto: true, partidas: true },
    });
    if (!conc) throw new NotFoundException('Conciliación bancaria no encontrada');
    return conc;
  }

  async aprobarConciliacion(empresaId: string, id: string, usuario: any): Promise<ConciliacionBancaria> {
    const conc = await this.obtenerConciliacionPorId(empresaId, id);

    if (Number(conc.diferencia_descuadre) > 0.05) {
      throw new BadRequestException(
        `No se puede aprobar la conciliación porque presenta una diferencia de descuadre de $${conc.diferencia_descuadre.toLocaleString()}`,
      );
    }

    conc.estado = EstadoConciliacion.APROBADA;
    conc.aprobado_por = usuario?.email || 'Revisor Fiscal';
    const guardada = await this.conciliacionRepo.save(conc);

    await this.auditoriaService.registrarLog({
      empresa_id: empresaId,
      usuario_id: usuario?.id || null,
      usuario_email: usuario?.email || 'admin@pacyolo.com',
      accion: 'APROBAR_CONCILIACION_BANCARIA',
      modulo: 'TESORERIA',
      entidad_id: guardada.id,
      datos_nuevos: { consecutivo: conc.consecutivo, aprobado_por: conc.aprobado_por },
    });

    return guardada;
  }

  // =========================================================================
  // 8. CAUSACIÓN RÁPIDA DE NOTAS BANCARIAS EN 1 CLIC (4x1000 GMF, COMISIONES)
  // =========================================================================

  async causarNotaBancaria(empresaId: string, dto: CausarNotaBancariaDto, usuario: any): Promise<{ asiento: Asiento; lineaConciliada: ExtractoBancarioLinea }> {
    const cuenta = await this.obtenerCuentaBancariaPorId(empresaId, dto.cuenta_bancaria_id);
    const linea = await this.extractoLineaRepo.findOne({ where: { id: dto.extracto_linea_id } });
    if (!linea) throw new NotFoundException('Línea de extracto no encontrada');

    if (linea.conciliado) {
      throw new BadRequestException('Esta partida del extracto ya fue conciliada previamente');
    }

    const cuentaContrapartida = await this.pucRepo.findOne({ where: { id: dto.cuenta_contrapartida_id } });
    if (!cuentaContrapartida) throw new NotFoundException('Cuenta contrapartida no encontrada');

    const monto = Number(linea.valor);
    const esDebitoExtracto = linea.tipo_movimiento === TipoMovimientoExtracto.DEBITO;

    // Para notas débito (GMF, comisión): Gasto al Débito vs Banco al Crédito
    // Para notas crédito (intereses): Banco al Débito vs Ingreso al Crédito
    const lineasAsiento = esDebitoExtracto
      ? [
          {
            cuenta_id: cuentaContrapartida.id,
            tercero_id: dto.tercero_banco_id,
            debito: monto,
            credito: 0,
            glosa_detalle: `${dto.tipo_nota} - ${linea.descripcion}`,
          },
          {
            cuenta_id: cuenta.cuenta_puc_id,
            tercero_id: dto.tercero_banco_id,
            debito: 0,
            credito: monto,
            glosa_detalle: `Débito bancario extracto (${linea.referencia || 'S/R'})`,
          },
        ]
      : [
          {
            cuenta_id: cuenta.cuenta_puc_id,
            tercero_id: dto.tercero_banco_id,
            debito: monto,
            credito: 0,
            glosa_detalle: `Crédito bancario extracto (${linea.referencia || 'S/R'})`,
          },
          {
            cuenta_id: cuentaContrapartida.id,
            tercero_id: dto.tercero_banco_id,
            debito: 0,
            credito: monto,
            glosa_detalle: `${dto.tipo_nota} - ${linea.descripcion}`,
          },
        ];

    const asiento = await this.asientosService.create({
          empresa_id: empresaId,
      tipo_comprobante: TipoComprobante.DIA,
      fecha_contable: dto.fecha_asiento,
      glosa_general: `Causación bancaria: ${linea.descripcion} (${dto.tipo_nota})`,
      lineas: lineasAsiento,
    });

    // Marcar extracto_linea como conciliada
    linea.conciliado = true;
    linea.asiento_linea_id = asiento.id;
    const lineaActualizada = await this.extractoLineaRepo.save(linea);

    await this.auditoriaService.registrarLog({
      empresa_id: empresaId,
      usuario_id: usuario?.id || null,
      usuario_email: usuario?.email || 'admin@pacyolo.com',
      accion: 'CAUSAR_NOTA_BANCARIA',
      modulo: 'TESORERIA',
      entidad_id: linea.id,
      datos_nuevos: { asiento_id: asiento.id, tipo_nota: dto.tipo_nota, monto },
    });

    return { asiento, lineaConciliada: lineaActualizada };
  }
}
