/**
 * @fileoverview Shared TypeScript types for TovoCL restaurant management system
 * Based on the existing PHP system database schema and functionality
 */

// ===== USER & AUTHENTICATION TYPES =====
export interface User {
  usu_codigo: number;
  usu_nombre: string;
  usu_apellidopat: string;
  usu_apellidomat?: string;
  usu_fechacre: Date;
  usu_estado: number;
  usu_email: string;
  usu_password: string;
  rol_codigo: number;
  flg_del: number;
}

export interface Role {
  rol_codigo: number;
  rol_nombre: string;
  rol_cerrarmesa: number;
  rol_crearadiciones: number;
  rol_cancelaradiciones: number;
  rol_crearplatos: number;
  rol_eliminarplatos: number;
  rol_crearbebidas: number;
  rol_eliminarbebidas: number;
  rol_crearclientes: number;
  rol_eliminarclientes: number;
  rol_crearusuarios: number;
  rol_eliminarusuarios: number;
  rol_verventas: number;
  rol_verreportes: number;
  rol_configuracion: number;
  rol_controlstock: number;
  rol_movimientodinero: number;
  rol_arqueos: number;
  rol_propinas: number;
  rol_delivery: number;
  rol_mostrador: number;
  rol_cocina: number;
  rol_administracion: number;
  rol_online: number;
  flg_del: number;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'usu_password'>;
  token: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: number;
  email: string;
  roleId: number;
  iat: number;
  exp: number;
}

// ===== RESTAURANT OPERATIONS TYPES =====
export interface Mesa {
  mes_codigo: number;
  mes_numero: string;
  mes_personas?: number;
  usu_codigo?: number;
  mes_estado: number;
  cme_codigo: number;
  mes_diseno: number;
  mes_fechamodificacion?: Date;
  flg_del: number;
}

export interface CategoriaMesa {
  cme_codigo: number;
  cme_nombre: string;
}

export interface Orden {
  ord_codigo: number;
  usu_codigo: number;
  ord_fecha: Date;
  ord_hora?: string;
  ord_personas?: number;
  ord_comentario?: string;
  cli_codigo?: number;
  ord_estado: string;
  mes_codigo: number;
  ord_fechamnodificacion?: Date;
  ord_descuento?: number;
  ord_porcentaje?: number;
  ord_delivery: number;
  ord_deliverymenuonline: number;
  ord_costoenvio?: number;
  ord_estadodelivery?: number;
  ord_mostrador: number;
  ord_mostradormenuonline: number;
  ord_estadomostrador?: number;
  ord_session_id?: string;
  ord_session_name?: string;
  cup_codigo?: number;
  opm_tipopagoonline?: number;
  ord_fechaprogramaonline?: Date;
  ord_horaprogramaonline?: string;
  flg_del: number;
}

export interface OrdenProducto {
  orp_codigo: number;
  usu_codigo: number;
  ord_codigo?: number;
  pla_codigo?: number;
  beb_codigo?: number;
  orp_cantidad: number;
  orp_precio: number;
  orp_comentario?: string;
  orp_estado: number;
  orp_fechamodificacion?: Date;
  flg_del: number;
}

// ===== PRODUCT MANAGEMENT TYPES =====
export interface Plato {
  pla_codigo: number;
  cat_codigo: number;
  pla_nombre: string;
  pla_descripcion?: string;
  pla_imagen?: string;
  pla_stockminimo?: number;
  pla_stocktotal?: number;
  pla_precio: number;
  pla_costo?: number;
  pla_estado: number;
  pla_vender: number;
  pla_control: number;
  ico_codigo?: number;
  col_codigo?: number;
  pla_favorito: number;
  pla_menu: number;
  coc_codigo?: number;
  pla_cocina: number;
  pla_menuqr: number;
  pla_timepreparacion?: number;
  flg_del: number;
}

export interface Bebida {
  beb_codigo: number;
  beb_nombre: string;
  beb_descripcion?: string;
  beb_imagen?: string;
  cbe_codigo: number;
  beb_stockminimo?: number;
  beb_stocktotal?: number;
  beb_precio: number;
  beb_costo?: number;
  beb_estado: number;
  beb_vender: number;
  beb_control: number;
  ico_codigo?: number;
  col_codigo?: number;
  beb_favorito: number;
  beb_menu: number;
  coc_codigo?: number;
  beb_cocina: number;
  beb_menuqr: number;
  beb_timepreparacion?: number;
  flg_del: number;
}

export interface CategoriaPlato {
  cat_codigo: number;
  cat_nombre: string;
  cat_imagen?: string;
  imo_codigo?: number;
  flg_del: number;
}

export interface CategoriaBebida {
  cbe_codigo: number;
  cbe_nombre: string;
  cbe_imagen?: string;
  imo_codigo?: number;
  flg_del: number;
}

export interface Ingrediente {
  ing_codigo: number;
  ing_nombre: string;
  cin_codigo: number;
  uni_codigo: number;
  ing_costo?: number;
  ing_estado: number;
  flg_del: number;
}

export interface IngredienteProducto {
  ipr_codigo: number;
  ing_codigo?: number;
  pla_codigo?: number;
  beb_codigo?: number;
  ipr_cantidad?: number;
  flg_del: number;
}

// ===== CUSTOMER MANAGEMENT TYPES =====
export interface Cliente {
  cli_codigo: number;
  cli_dni?: number;
  cli_ruc?: string;
  cli_nombre: string;
  cli_apellidopat?: string;
  cli_apellidomat?: string;
  cli_telefono?: string;
  cli_email?: string;
  cli_direccion?: string;
  cli_fechacre: Date;
  cli_estado: number;
  cli_delivery: number;
  cli_mostrador: number;
  cli_online: number;
  cli_password?: string;
  cli_verificacion?: string;
  cli_estadoverificacion?: number;
  flg_del: number;
}

// ===== FINANCIAL TYPES =====
export interface TipoPago {
  tpa_codigo: number;
  tpa_nombre: string;
  tpa_estado: number;
  tpa_delivery: number;
  tpa_estadodelivery: number;
  tpa_mostrador: number;
  tpa_estadomostrador: number;
  tpa_online: number;
  tpa_estadoonline: number;
  flg_del: number;
}

export interface Cupon {
  cup_codigo: number;
  cup_nombre: string;
  cup_numcodigo: string;
  cup_valor: number;
  cup_tipodescuento: number;
  cup_fechainicio: Date;
  cup_fechafin: Date;
  cup_estado: number;
  cup_delivery: number;
  cup_mostrador: number;
  cup_online: number;
  flg_del: number;
}

export interface ArqueoDinero {
  arq_codigo: number;
  arq_fechaapertura: Date;
  arq_hora?: string;
  arq_fechacierre?: Date;
  arq_montoinicial?: number;
  arq_monto: number;
  arq_real?: number;
  arq_diferencia?: number;
  arq_comentario?: string;
  arq_estado: number;
  usu_codigo?: number;
  usu_cierre: number;
  flg_del: number;
}

// ===== SYSTEM CONFIGURATION TYPES =====
export interface Variable {
  var_codigo: number;
  var_igv: number;
  var_nombre?: string;
  var_nombreonline?: string;
  var_moneda?: string;
  var_costoenviomenu?: number;
  var_enviodomicilio?: number;
  var_montominimo?: number;
  var_estadomonmin?: number;
  var_estadotipopago?: number;
  var_estadocupon?: number;
  var_estadopropina?: number;
  var_estadoturno?: number;
  var_estadomesa?: number;
  var_estadoplato?: number;
  var_estadobebida?: number;
  var_estadocategoria?: number;
  var_estadocategoriabebida?: number;
  var_estadoingrediente?: number;
  var_estadocategoriaingrediente?: number;
  var_estadounidad?: number;
  var_estadocolor?: number;
  var_estadoicono?: number;
  var_estadocategoriaicono?: number;
  var_estadocategoriaiconoonline?: number;
  var_estadoiconoonline?: number;
  var_estadoimpresora?: number;
  var_estadococina?: number;
  var_estadotimezone?: number;
  var_estadohorario?: number;
  var_estadomensaje?: number;
  var_estadodocumento?: number;
  var_estadotipopago?: number;
  var_estadoturno?: number;
  var_estadousuario?: number;
  var_estadorol?: number;
  var_estadocliente?: number;
  var_estadomesa?: number;
  var_estadoplato?: number;
  var_estadobebida?: number;
  var_estadocategoria?: number;
  var_estadocategoriabebida?: number;
  var_estadoingrediente?: number;
  var_estadocategoriaingrediente?: number;
  var_estadounidad?: number;
  var_estadocolor?: number;
  var_estadoicono?: number;
  var_estadocategoriaicono?: number;
  var_estadocategoriaiconoonline?: number;
  var_estadoiconoonline?: number;
  var_estadoimpresora?: number;
  var_estadococina?: number;
  var_estadotimezone?: number;
  var_estadohorario?: number;
  var_estadomensaje?: number;
  var_estadodocumento?: number;
  flg_del: number;
}

// ===== API RESPONSE TYPES =====
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: number;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ===== REQUEST TYPES =====
export interface CreateUserRequest {
  usu_nombre: string;
  usu_apellidopat: string;
  usu_apellidomat?: string;
  usu_email: string;
  usu_password: string;
  rol_codigo: number;
}

export interface UpdateUserRequest {
  usu_nombre?: string;
  usu_apellidopat?: string;
  usu_apellidomat?: string;
  usu_email?: string;
  usu_password?: string;
  rol_codigo?: number;
  usu_estado?: number;
}

export interface CreateOrderRequest {
  mes_codigo: number;
  ord_personas?: number;
  ord_comentario?: string;
  cli_codigo?: number;
  ord_delivery?: number;
  ord_mostrador?: number;
  cup_codigo?: number;
  opm_tipopagoonline?: number;
}

export interface CreateProductRequest {
  nombre: string;
  descripcion?: string;
  precio: number;
  costo?: number;
  categoria: number;
  imagen?: string;
  stockminimo?: number;
  control?: number;
}

// ===== ENUMS =====
export enum OrderStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  READY = 'ready',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export enum TableStatus {
  AVAILABLE = 0,
  OCCUPIED = 1,
  RESERVED = 2,
  CLEANING = 3
}

export enum UserStatus {
  ACTIVE = 1,
  INACTIVE = 0
}

export enum ProductType {
  PLATE = 'plate',
  BEVERAGE = 'beverage'
}

export enum PaymentType {
  CASH = 1,
  CARD = 2,
  TRANSFER = 3,
  ONLINE = 4
}

export enum DeliveryStatus {
  PENDING = 1,
  PREPARING = 2,
  READY = 3,
  ON_THE_WAY = 4,
  DELIVERED = 5,
  CANCELLED = 6
}
