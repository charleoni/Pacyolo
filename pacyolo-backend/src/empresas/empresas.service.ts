import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Empresa } from './entities/empresa.entity.js';
import { CreateEmpresaDto } from './dto/create-empresa.dto.js';
import { calcularDigitoVerificacion } from '../common/utils/dian-nit.util.js';

@Injectable()
export class EmpresasService {
  constructor(
    @InjectRepository(Empresa)
    private readonly empresaRepo: Repository<Empresa>,
  ) {}

  async create(dto: CreateEmpresaDto): Promise<Empresa> {
    const nitLimpio = dto.nit.trim();
    const existe = await this.empresaRepo.findOne({ where: { nit: nitLimpio } });
    if (existe) {
      throw new ConflictException(`Ya existe una empresa con el NIT ${nitLimpio}`);
    }

    const dvCalculado = dto.dv ? dto.dv : String(calcularDigitoVerificacion(nitLimpio));
    const apiKey = `pcy_${randomBytes(24).toString('hex')}`;

    const nueva = this.empresaRepo.create({
      ...dto,
      nit: nitLimpio,
      dv: dvCalculado,
      api_key_integracion: apiKey,
    });

    return await this.empresaRepo.save(nueva);
  }

  async findAll(): Promise<Empresa[]> {
    return await this.empresaRepo.find({
      order: { razon_social: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Empresa> {
    const empresa = await this.empresaRepo.findOne({ where: { id } });
    if (!empresa) {
      throw new NotFoundException(`Empresa con ID ${id} no encontrada`);
    }
    return empresa;
  }

  async findByNit(nit: string): Promise<Empresa | null> {
    return await this.empresaRepo.findOne({ where: { nit: nit.trim() } });
  }

  async regenerarApiKey(id: string): Promise<{ api_key: string }> {
    const empresa = await this.findOne(id);
    empresa.api_key_integracion = `pcy_${randomBytes(24).toString('hex')}`;
    await this.empresaRepo.save(empresa);
    return { api_key: empresa.api_key_integracion };
  }
}
