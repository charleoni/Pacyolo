export enum RolUsuario {
  SUPER_ADMIN = 'SUPER_ADMIN', // Administrador global de la plataforma SaaS
  ADMIN_EMPRESA = 'ADMIN_EMPRESA', // Administrador de la empresa/tenant (crea usuarios, configura impuestos/puc)
  CONTADOR_LIDER = 'CONTADOR_LIDER', // Contador titular (aprueba/rechaza comprobantes, anula asientos, reportes oficiales)
  AUXILIAR_CONTABLE = 'AUXILIAR_CONTABLE', // Auxiliar (causa compras, ventas, recaudos y egresos)
  AUDITOR_CONSULTA = 'AUDITOR_CONSULTA', // Revisor fiscal o auditor externo (solo lectura)
}
