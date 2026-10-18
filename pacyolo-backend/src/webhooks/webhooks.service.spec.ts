import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebhooksService } from './webhooks.service.js';

describe('WebhooksService', () => {
  let service: WebhooksService;
  let mockWebhookRepo: any;
  let mockLogRepo: any;
  let mockEmpresaRepo: any;

  beforeEach(() => {
    mockWebhookRepo = {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn().mockImplementation((val) => ({ id: 'webhook-uuid-1', ...val })),
      save: vi.fn().mockImplementation((val) => Promise.resolve({ id: 'webhook-uuid-1', ...val })),
      remove: vi.fn().mockResolvedValue(undefined),
    };

    mockLogRepo = {
      find: vi.fn(),
      create: vi.fn().mockImplementation((val) => ({ id: 'log-uuid-1', ...val })),
      save: vi.fn().mockImplementation((val) => Promise.resolve({ id: 'log-uuid-1', ...val })),
    };

    mockEmpresaRepo = {
      findOne: vi.fn(),
    };

    service = new WebhooksService(mockWebhookRepo, mockLogRepo, mockEmpresaRepo);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe calcular la firma HMAC-SHA256 correctamente y de forma determinista', () => {
    const payload = JSON.stringify({ evento: 'factura_venta.aprobada', valor: 1000 });
    const secreto = 'whsec_test_secret_1234';

    const firma1 = service.calcularFirma(payload, secreto);
    const firma2 = service.calcularFirma(payload, secreto);

    expect(firma1).toBeDefined();
    expect(firma1).toBe(firma2);
    expect(firma1).toHaveLength(64); // Hex sha256 = 64 chars
  });

  it('debe crear una suscripción a webhook con secreto autogenerado si no se provee', async () => {
    mockEmpresaRepo.findOne.mockResolvedValueOnce({ id: 'empresa-uuid-1' });

    const res = await service.create({
      empresa_id: 'empresa-uuid-1',
      nombre: 'Webhook ERP',
      url_destino: 'https://mi-erp.com/webhook',
      eventos: ['factura_venta.contabilizada'],
    });

    expect(res.id).toBe('webhook-uuid-1');
    expect(res.secreto_firma).toMatch(/^whsec_[0-9a-f]{48}$/);
    expect(mockWebhookRepo.save).toHaveBeenCalled();
  });
});
