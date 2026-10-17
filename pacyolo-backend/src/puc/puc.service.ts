import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { PucCuenta } from './entities/puc.entity.js';
import { CreatePucCuentaDto } from './dto/create-puc-cuenta.dto.js';
import { PUC_COLOMBIA_NIIF_SEED } from './seeds/puc-colombia-niif.seed.js';

@Injectable()
export class PucService {
  constructor(
    @InjectRepository(PucCuenta)
    private readonly pucRepo: Repository<PucCuenta>,
  ) {}

  /**
   * Siembra el catálogo estándar NIIF para una empresa en particular
   */
  async sembrarPucEmpresa(empresaId: string): Promise<{ total_cuentas: number; mensaje: string }> {
    const existeConteo = await this.pucRepo.count({ where: { empresa_id: empresaId } });
    if (existeConteo > 0) {
      return {
        total_cuentas: existeConteo,
        mensaje: `La empresa ya cuenta con ${existeConteo} cuentas en su PUC.`,
      };
    }

    const mapaCodigoId = new Map<string, string>();

    // 1. Insertar primero las cuentas en orden para asegurar que los padres existan
    for (const item of PUC_COLOMBIA_NIIF_SEED) {
      const parentId = item.parent_codigo ? mapaCodigoId.get(item.parent_codigo) ?? null : null;

      const nueva = this.pucRepo.create({
        empresa_id: empresaId,
        codigo: item.codigo,
        nombre: item.nombre,
        nivel: item.nivel,
        clase: item.clase,
        naturaleza: item.naturaleza,
        permite_movimiento: item.permite_movimiento,
        exige_tercero: item.exige_tercero,
        es_cuenta_banco: item.es_cuenta_banco ?? false,
        parent_id: parentId ?? undefined,
      });

      const guardada = await this.pucRepo.save(nueva);
      mapaCodigoId.set(item.codigo, guardada.id);
    }

    return {
      total_cuentas: PUC_COLOMBIA_NIIF_SEED.length,
      mensaje: `Catálogo NIIF Colombia estándar sembrado exitosamente (${PUC_COLOMBIA_NIIF_SEED.length} cuentas).`,
    };
  }

  async findAll(empresaId: string): Promise<PucCuenta[]> {
    return await this.pucRepo.find({
      where: { empresa_id: empresaId, activo: true },
      order: { codigo: 'ASC' },
    });
  }

  async findAuxiliares(empresaId: string): Promise<PucCuenta[]> {
    return await this.pucRepo.find({
      where: {
        empresa_id: empresaId,
        permite_movimiento: true,
        activo: true,
      },
      order: { codigo: 'ASC' },
    });
  }

  async getTree(empresaId: string): Promise<PucCuenta[]> {
    return await this.pucRepo.find({
      where: { empresa_id: empresaId, parent_id: IsNull(), activo: true },
      relations: {
        children: {
          children: {
            children: {
              children: true,
            },
          },
        },
      },
      order: { codigo: 'ASC' },
    });
  }

  async findOne(id: string): Promise<PucCuenta> {
    const cuenta = await this.pucRepo.findOne({
      where: { id },
      relations: { parent: true, children: true },
    });
    if (!cuenta) {
      throw new NotFoundException(`Cuenta PUC con ID ${id} no encontrada`);
    }
    return cuenta;
  }

  async findByCodigo(empresaId: string, codigo: string): Promise<PucCuenta | null> {
    return await this.pucRepo.findOne({
      where: { empresa_id: empresaId, codigo: codigo.trim() },
    });
  }

  async create(dto: CreatePucCuentaDto): Promise<PucCuenta> {
    const codigoLimpio = dto.codigo.trim();
    const existe = await this.pucRepo.findOne({
      where: { empresa_id: dto.empresa_id, codigo: codigoLimpio },
    });

    if (existe) {
      throw new ConflictException(
        `Ya existe una cuenta con el código ${codigoLimpio} en esta empresa`,
      );
    }

    const nueva = this.pucRepo.create({
      ...dto,
      codigo: codigoLimpio,
    });

    return await this.pucRepo.save(nueva);
  }
}
