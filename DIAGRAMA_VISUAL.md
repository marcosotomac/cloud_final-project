# Diagrama Visual: Cómo Funciona el Flujo Automático

## 📱 Vista Frontend (Lo que ve el empleado)

```
┌─────────────────────────────────────────────────────────────┐
│                    SISTEMA KFC OPERACIONES                  │
│                        Pedidos En Vivo                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PEDIDOS ACTIVOS                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Pedido #KFC-241202-ABC123                                 │
│  Cliente: Juan Pablo                                        │
│  Estado: 🔵 RECEIVED                                        │
│  Hora: 14:00:10                                            │
│  Tiempo: 10s desde creación                                │
│  ┌─────────────────────────────────────────────────┐       │
│  │ ■ PENDING  ✓ RECEIVED  ○ COOKING ○ PACKING...│       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  Pedido #KFC-241202-DEF456                                 │
│  Cliente: María García                                      │
│  Estado: 🟡 COOKING                                        │
│  Hora: 13:59:35                                            │
│  Tiempo: 25s desde creación                                │
│  ┌─────────────────────────────────────────────────┐       │
│  │ ■ PENDING  ✓ RECEIVED  ✓ COOKING ○ PACKING...│       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  Pedido #KFC-241202-GHI789                                 │
│  Cliente: Carlos López                                      │
│  Estado: 🟢 DELIVERY                                       │
│  Hora: 13:58:05                                            │
│  Tiempo: 55s desde creación                                │
│  ┌─────────────────────────────────────────────────┐       │
│  │ ■ PENDING  ✓ RECEIVED  ✓ COOKING ✓ PACKING...│       │
│  │ ✓ DELIVERY  ○ COMPLETED                        │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  [Actualización automática cada 10-15 segundos]            │
│  Sin intervención manual del operario                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## ⏱️ Timeline: Qué Sucede en Cada Segundo

```
SEGUNDO 0: CLIENTE REALIZA PEDIDO
   ├─ POST /tenants/{tenantId}/orders
   ├─ Backend crea orden en DynamoDB
   ├─ Status: PENDING
   └─ Backend llama: start_order_workflow()

SEGUNDO 0.5: STEP FUNCTIONS INICIA
   ├─ AWS Step Functions recibe instrucción
   ├─ State Machine comienza ejecución
   └─ Primer estado: ReceiveOrder Lambda

SEGUNDO 1: RECEIVE ORDER LAMBDA
   ├─ Obtiene pedido de DynamoDB
   ├─ Actualiza status a RECEIVED
   ├─ WebSocket broadcast: "order_update"
   ├─ Frontend recibe evento
   ├─ UI actualiza: PENDING → RECEIVED ✓
   └─ State Machine: "ir a WaitForCooking"

SEGUNDO 1-11: ESPERA (Wait 10 segundos)
   ├─ Step Functions en pausa
   ├─ Nada sucede en backend
   ├─ Frontend NO actualiza (esperando)
   └─ Operario sigue viendo RECEIVED

SEGUNDO 11: START COOKING LAMBDA
   ├─ Obtiene pedido de DynamoDB
   ├─ Actualiza status a COOKING
   ├─ WebSocket broadcast: "order_update"
   ├─ Frontend recibe evento
   ├─ UI actualiza: RECEIVED → COOKING ✓
   └─ State Machine: "ir a WaitForPacking"

SEGUNDO 11-21: ESPERA (Wait 10 segundos)
   ├─ Step Functions en pausa
   └─ Operario viendo COOKING

SEGUNDO 21: START PACKING LAMBDA
   ├─ Actualiza status a PACKING
   ├─ WebSocket broadcast
   ├─ UI actualiza: COOKING → PACKING ✓
   └─ State Machine: "ir a WaitForDelivery"

SEGUNDO 21-26: ESPERA (Wait 5 segundos)
   └─ Operario viendo PACKING

SEGUNDO 26: START DELIVERY LAMBDA
   ├─ Actualiza status a DELIVERY
   ├─ WebSocket broadcast
   ├─ UI actualiza: PACKING → DELIVERY ✓
   └─ State Machine: "ir a WaitForCompletion"

SEGUNDO 26-36: ESPERA (Wait 10 segundos)
   └─ Operario viendo DELIVERY

SEGUNDO 36: COMPLETE ORDER LAMBDA
   ├─ Actualiza status a COMPLETED
   ├─ WebSocket broadcast
   ├─ UI actualiza: DELIVERY → COMPLETED ✓
   ├─ Pedido se mueve a historial
   └─ State Machine: "FIN"

TOTAL: ~36 segundos de inicio a fin
```

## 🔌 Flujo de Datos: Backend → Frontend

```
┌──────────────────────────────────────────────────────────────┐
│  BACKEND (AWS)                                               │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ DynamoDB: Tabla de Órdenes                            │ │
│  │ ┌─────────────────────────────────────┐               │ │
│  │ │ orderId: ABC123                     │               │ │
│  │ │ status: COOKING  ← Actualizado ✓   │ ◄─┐           │ │
│  │ │ customerId: 123                     │   │           │ │
│  │ │ total: $35.50                       │   │           │ │
│  │ │ items: [...]                        │   │           │ │
│  │ │ updatedAt: 2024-12-02T14:00:11Z    │   │           │ │
│  │ └─────────────────────────────────────┘   │           │ │
│  └────────────────────────────────────────────┼───────────┘ │
│                                               │              │
│  ┌────────────────────────────────────────────┼───────────┐ │
│  │ Lambda Function: sfn_cooking_handler()    │           │ │
│  │                                            │           │ │
│  │ 1. get_item(order)                         │           │ │
│  │    └─ Obtiene de DynamoDB ────────────────┘           │ │
│  │                                                         │ │
│  │ 2. update_item(status = "COOKING")                    │ │
│  │    └─ Actualiza en DynamoDB ────────┐                │ │
│  │                                       │                │ │
│  │ 3. broadcast_order_update(...)  ◄────┘                │ │
│  │    └─ Construye mensaje WebSocket                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                       │                                      │
│                       └─► WebSocket API                      │
│                           │                                  │
│                           │ {                               │
│                           │   "type": "order_update",       │
│                           │   "payload": {                  │
│                           │     "orderId": "ABC123",        │
│                           │     "status": "COOKING",        │
│                           │     "order": {...}              │
│                           │   }                             │
│                           │ }                               │
└──────────────────────────────────────────────────────────────┘
                           │
                           │ (enviado a todos los clientes
                           │  conectados a este tenant)
                           │
                           ⬇
┌──────────────────────────────────────────────────────────────┐
│  FRONTEND (React)                                            │
│                                                              │
│  websocket.service.ts                                       │
│  ├─ on("order_update", callback)                           │
│  │  └─ Recibe mensaje del backend                         │
│  │                                                          │
│  └─► emit("orderUpdated", data)                           │
│      │                                                      │
│      └─► useOrderNotifications hook                       │
│          │                                                  │
│          └─► queryClient.invalidateQueries()              │
│              │                                              │
│              └─► React Query refetch de orders             │
│                  │                                          │
│                  └─► Orders.tsx componente                 │
│                      │                                      │
│                      └─► Estado se actualiza               │
│                          │                                  │
│                          └─► UI renderiza:                 │
│                              "Status: COOKING"             │
│                                                              │
│  ✨ Usuario ve cambio sin hacer nada ✨                    │
│  (NO necesita: refrescar, clickear botones, esperar)       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 🎬 Escena 1: Cliente Realiza Pedido

```
CLIENTE (Frontend):                SERVIDOR:
  Click "Confirmar Pedido"
       │
       ├─► POST /orders
            │
            ├─► Backend procesa
            │
            └─► Crea pedido
                Status: PENDING
                
                ├─► Guardar en DynamoDB ✓
                │
                ├─► Broadcast WebSocket
                │   (new_order)
                │   └─► Frontend: "Nuevo pedido recibido"
                │       Toast: "Pedido guardado" ✓
                │
                └─► start_order_workflow()
                    └─► Step Functions INICIA
                        (SIN esperar respuesta)
                        
Cliente ve:
✓ "Pedido confirmado"
✓ Pantalla se actualiza
✓ Aparece en lista

Automáticamente:
Step Functions comenzó silenciosamente
A los 1 segundo:
├─ Pasa a RECEIVED
└─ Frontend lo ve (sin hacer nada)
```

## 🎬 Escena 2: Monitoreo Automático

```
OPERARIO:                          SISTEMA:
  Abre dashboard de pedidos
       │
       ├─ Ve 3 pedidos en vivo
       │
       ├─ No hace NADA
       │
       └─ Espera...
       
       
       
       (15 segundos después)
       │
       ├─ SORPRESA: Pedido #1 cambió
       │  de RECEIVED a COOKING
       │
       └─ ¿Qué pasó?
          Todo automático del backend
          
       
       (10 segundos después)
       │
       ├─ Otro cambio: COOKING → PACKING
       │
       ├─ Otro cambio: PACKING → DELIVERY
       │
       └─ Pedido #1 está LISTO
          (SIN que el operario hiciera nada)

El operario solo OBSERVA.
El sistema hace TODO.
```

## 🏗️ Arquitectura: Componentes

```
                    ┌─────────────────────┐
                    │  AWS Step Functions │
                    │  State Machine      │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┼─────────────┐
                 │             │             │
            ┌────▼─┐      ┌────▼─┐      ┌────▼─┐
            │Lambda│      │Lambda│      │Lambda│ ...
            │Recv. │      │Cook. │      │Pack. │
            └────┬─┘      └────┬─┘      └────┬─┘
                 │             │             │
                 └─────────────┼─────────────┘
                               │
                        ┌──────▼──────┐
                        │ DynamoDB    │
                        │ (órdenes)   │
                        └──────┬──────┘
                               │
                        ┌──────▼──────┐
                        │ WebSocket   │
                        │ API         │
                        └──────┬──────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
              ┌─────▼────┐          ┌─────▼────┐
              │ Frontend  │          │ Frontend │
              │ Operario  │          │ Cliente  │
              └───────────┘          └──────────┘
```

## ✅ Resumen: ¿Cómo Funciona?

| Paso | Lo Que Sucede | Quién | Cuándo |
|------|---------------|-------|--------|
| 1 | Cliente crea pedido | Cliente | T=0s |
| 2 | Backend guarda en DynamoDB | Backend | T=0s |
| 3 | Step Functions inicia | AWS | T=0.5s |
| 4 | Lambda actualiza status | AWS | T=1s |
| 5 | WebSocket broadcast | Backend | T=1.1s |
| 6 | Frontend actualiza UI | React | T=1.2s |
| 7 | Espera X segundos | AWS (State Machine) | T=1.2s a T=11s |
| 8 | Vuelve al paso 4 | AWS | T=11s |
| N | Pedido COMPLETED | Sistema | T=36s |

**RESULTADO:** Pedido fluye automáticamente sin intervención = ✅ ÉXITO

```
                    ANTES VS AHORA
                    
ANTES (Manual):
  Crear pedido → Empleado clickea "Cocinar"
  (espera) → Empleado clickea "Empacar"
  (espera) → Empleado clickea "Entregar"
  (espera) → Empleado clickea "Completar"
  ❌ Requiere 4 clicks por pedido
  ❌ Propenso a errores humanos
  ❌ Lento y tedioso

AHORA (Automático):
  Crear pedido → ✨ AUTOMÁTICO ✨
  → RECEIVED (1s)
  → COOKING (11s)
  → PACKING (21s)
  → DELIVERY (26s)
  → COMPLETED (36s)
  ✅ CERO intervención
  ✅ 100% confiable
  ✅ Rápido y eficiente
```

¡El futuro está aquí! 🚀
