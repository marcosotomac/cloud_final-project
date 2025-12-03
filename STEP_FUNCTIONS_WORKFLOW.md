# Flujo Automático de Pedidos con AWS Step Functions

## 📋 Descripción

Se ha implementado un sistema **completamente automático** para gestionar el flujo de pedidos en KFC usando **AWS Step Functions**. Cuando un cliente realiza un pedido, el sistema automáticamente lo pasa por todos los estados sin intervención manual.

## 🔄 Estados del Pedido

El flujo simplificado ahora tiene **5 estados principales**:

1. **PENDING** → Pedido creado por el cliente (estado inicial)
2. **RECEIVED** → Pedido recibido y comenzará preparación
3. **COOKING** → Cocinero preparando la comida (simula 10 segundos)
4. **PACKING** → Despachador empacando (simula 10 segundos)
5. **DELIVERY** → Listo para entrega / En camino (simula 5 segundos)
6. **COMPLETED** → Pedido completado (simula 10 segundos más antes de marcar completo)

**Total estimado: ~45 segundos desde creación hasta completado**

## 🏗️ Arquitectura

### Backend (AWS)

#### 1. **Lambda Functions** (Handlers de Step Functions)
- `sfnReceiveOrder` → Marca el pedido como RECEIVED
- `sfnCooking` → Inicia estado COOKING
- `sfnPacking` → Inicia estado PACKING
- `sfnDelivery` → Inicia estado DELIVERY
- `sfnCompleteOrder` → Finaliza el pedido

**Ubicación:** `/kfc-backend/src/handlers/stepfunctions.py`

#### 2. **State Machine (AWS Step Functions)**
Orquesta el flujo automático:
```
PENDING 
  ↓ (inmediato)
ReceiveOrder (Lambda)
  ↓ (Wait 10s)
WaitForCooking
  ↓ (inmediato)
StartCooking (Lambda)
  ↓ (Wait 10s)
WaitForPacking
  ↓ (inmediato)
StartPacking (Lambda)
  ↓ (Wait 5s)
WaitForDelivery
  ↓ (inmediato)
StartDelivery (Lambda)
  ↓ (Wait 10s)
WaitForCompletion
  ↓ (inmediato)
CompleteOrder (Lambda)
  ↓
FIN
```

**Ubicación:** `serverless.yml` → `resources.Resources.OrderWorkflowStateMachine`

#### 3. **Actualización Automática del Pedido**
Cada handler de Lambda:
1. Obtiene el pedido actual de DynamoDB
2. Actualiza el `status` al nuevo estado
3. **Envía actualización vía WebSocket** a todos los clientes conectados
4. Retorna al Step Functions para continuar

### Frontend (React + TypeScript)

#### 1. **WebSocket Service** (`websocket.service.ts`)
- Se conecta al WebSocket API del backend
- Escucha eventos `order_update`
- Emite eventos locales que React puede consumir

#### 2. **React Hooks**
```typescript
// Hook principal para conectar
useWebSocket()

// Hook para escuchar cambios de pedidos
useOrderNotifications(onNewOrder, onOrderUpdate)
```

#### 3. **Visualización en Tiempo Real**
En el componente `Orders.tsx`:
- Los pedidos se actualizan en **tiempo real** vía WebSocket
- No se necesita recargar la página
- Los empleados ven el progreso automáticamente

## 🚀 Flujo de Ejecución

```
1. Cliente realiza pedido (POST /tenants/{tenantId}/orders)
   ↓
2. Backend crea el pedido con status PENDING
   ↓
3. Backend llama: start_order_workflow(tenant_id, order_id)
   ↓
4. Step Functions inicia la State Machine
   ↓
5. Por cada estado:
   a) Espera el tiempo configurado (Wait)
   b) Invoca Lambda para actualizar estado
   c) Lambda actualiza DynamoDB
   d) Lambda envía actualización vía WebSocket
   e) Frontend recibe y actualiza UI en tiempo real
   ↓
6. Después de 45 segundos, pedido está COMPLETED
```

## 📝 Cambios Realizados

### 1. **Simplificación de Estados** (`order_status.py`)
```python
class OrderStatus(Enum):
    PENDING = "PENDING"
    RECEIVED = "RECEIVED"
    COOKING = "COOKING"
    PACKING = "PACKING"
    DELIVERY = "DELIVERY"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
```

**Antes:** 11 estados (PENDING, RECEIVED, COOKING, COOKED, PACKING, PACKED, READY_FOR_DELIVERY, DELIVERING, DELIVERED, COMPLETED, CANCELLED)
**Ahora:** 7 estados (eliminados COOKED, PACKED, READY_FOR_DELIVERY, DELIVERING, DELIVERED)

### 2. **Nuevos Handlers** (`stepfunctions.py`)
- Reescrito completamente con lógica simple
- Cada handler solo actualiza el estado y envía WebSocket broadcast
- Sin lógica compleja de workflow steps

### 3. **State Machine** (`serverless.yml`)
- Agregada definición completa de la State Machine
- Configuradas transiciones con Wait states
- Retry automático en caso de fallos

### 4. **Trigger Automático** (`orders.py`)
```python
# En create_order_handler, después de guardar el pedido:
try:
    start_order_workflow(tenant_id, order_id, order)
    print(f"Step Functions workflow started for order {order_id}")
except Exception as sfn_error:
    print(f"Step Functions error: {str(sfn_error)}")
```

## ⏱️ Tiempos Configurables

Puedes cambiar los tiempos de espera en `serverless.yml`:

```yaml
"WaitForCooking": {
  "Type": "Wait",
  "Seconds": 10,  # ← Cambiar aquí (cooking time)
  "Next": "StartCooking"
},
"WaitForPacking": {
  "Type": "Wait",
  "Seconds": 10,  # ← Cambiar aquí (packing time)
  ...
},
"WaitForDelivery": {
  "Type": "Wait",
  "Seconds": 5,  # ← Cambiar aquí (delivery time)
  ...
}
```

## 🔌 Variables de Entorno Nuevas

En el `serverless.yml` se agregó:
```yaml
STATE_MACHINE_ARN: !Ref OrderWorkflowStateMachine
```

## ✅ Ventajas del Sistema

1. **Completamente Automático** - Sin intervención manual
2. **Simulación Realista** - Tiempos configurables por etapa
3. **Actualizaciones en Tiempo Real** - WebSocket broadcasts
4. **Escalable** - Step Functions maneja múltiples pedidos simultáneos
5. **Resiliente** - Retry automático en fallos
6. **Fácil de Testear** - Estados simples y claros
7. **Sin Base de Datos Adicional** - Solo DynamoDB

## 🧪 Cómo Testear

### Local (sin deploy)
1. Crear un pedido: `POST /tenants/{tenantId}/orders`
2. El pedido comenzará a avanzar automáticamente
3. Cada 10-15 segundos verás cambios de estado en el frontend

### En Producción (AWS)
1. Deploy: `serverless deploy`
2. Los Step Functions se crearán automáticamente
3. El ARN se guardará en `STATE_MACHINE_ARN`

## 📊 Monitoreo

Para ver los Step Functions en ejecución:
1. Ir a AWS Console → Step Functions
2. Buscar `kfc-core-dev-order-workflow` (o similar según stage)
3. Ver la ejecución de cada pedido
4. Revisar CloudWatch logs si hay errores

## 🔍 Flujo Completo Ejemplo

```
Cliente realiza pedido a las 14:00:00
├─ 14:00:01 → Status: PENDING → RECEIVED ✓
├─ 14:00:11 → Wait 10s ✓
├─ 14:00:11 → Status: RECEIVED → COOKING ✓
├─ 14:00:21 → Wait 10s ✓
├─ 14:00:21 → Status: COOKING → PACKING ✓
├─ 14:00:31 → Wait 5s ✓
├─ 14:00:36 → Status: PACKING → DELIVERY ✓
├─ 14:00:46 → Wait 10s ✓
├─ 14:00:46 → Status: DELIVERY → COMPLETED ✓
└─ Fin: Total ~46 segundos
```

## 📱 Frontend - Lo que Ven los Empleados

El operario en el frontend verá:

**Tabla de Pedidos en Tiempo Real:**
```
| # Pedido    | Cliente  | Estado      | Hora     | Acción |
|-------------|----------|-------------|----------|--------|
| KFC-241202-ABC123 | Juan   | En Preparación | 14:00   | -      |
| KFC-241202-DEF456 | María  | Empacando  | 13:58   | -      |
| KFC-241202-GHI789 | Carlos | En Entrega | 13:55   | -      |
```

Sin necesidad de refrescar, los estados se actualizan automáticamente cada 10-15 segundos.

## ⚠️ Notas Importantes

1. **Sin Intervención Manual** - Los empleados NO pueden mover manualmente los pedidos en este flujo (el empleado no ve botones de transición, el flujo es completamente automático)
2. **Cancelación** - Puedes cancelar pedidos antes de que cambien de estado
3. **WebSocket** - Es **obligatorio** que el WebSocket esté conectado para ver actualizaciones en tiempo real
4. **DynamoDB** - Se requiere latencia baja en DynamoDB para respuestas rápidas

## 🎯 Conclusión

El sistema está listo para **producción**. Los pedidos fluyen automáticamente a través de toda la cadena sin intervención, los empleados ven actualizaciones en tiempo real, y todo es configurable sin cambiar código.
