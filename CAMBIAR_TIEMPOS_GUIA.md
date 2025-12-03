# Guía Rápida: Cambiar Tiempos de Simulación

## 📍 Ubicación del archivo

`/kfc-backend/serverless.yml`

## 🔍 Buscar la State Machine

Presiona `Ctrl+F` y busca: `OrderWorkflowStateMachine`

## ⏱️ Tiempos Configurables

En la sección de `DefinitionString`, verás estos `Wait` states:

### 1. COOKING (Preparación)
```yaml
"WaitForCooking": {
  "Type": "Wait",
  "Seconds": 10,  # ← CAMBIAR ESTE NÚMERO
  "Next": "StartCooking"
},
```

**Qué es:** Tiempo de espera ANTES de marcar como COOKING
**Valor actual:** 10 segundos
**Cambiar a:** Lo que quieras (ej: 30 para 30 segundos)

### 2. PACKING (Empaque)
```yaml
"WaitForPacking": {
  "Type": "Wait",
  "Seconds": 10,  # ← CAMBIAR ESTE NÚMERO
  "Next": "StartPacking"
},
```

**Qué es:** Tiempo de espera ANTES de marcar como PACKING
**Valor actual:** 10 segundos
**Cambiar a:** Lo que quieras (ej: 5 para empaque rápido)

### 3. DELIVERY (Entrega)
```yaml
"WaitForDelivery": {
  "Type": "Wait",
  "Seconds": 5,  # ← CAMBIAR ESTE NÚMERO
  "Next": "StartDelivery"
},
```

**Qué es:** Tiempo de espera ANTES de marcar como DELIVERY
**Valor actual:** 5 segundos
**Cambiar a:** Lo que quieras (ej: 60 para transporte largo)

### 4. COMPLETION (Finalización)
```yaml
"WaitForCompletion": {
  "Type": "Wait",
  "Seconds": 10,  # ← CAMBIAR ESTE NÚMERO
  "Next": "CompleteOrder"
},
```

**Qué es:** Tiempo de espera ANTES de marcar como COMPLETED
**Valor actual:** 10 segundos
**Cambiar a:** Lo que quieras (ej: 0 para completar inmediato)

## 📊 Ejemplos de Configuración

### ⚡ RÁPIDO (Test)
```
WaitForCooking:    2 segundos
WaitForPacking:    2 segundos
WaitForDelivery:   1 segundo
WaitForCompletion: 1 segundo
TOTAL:             ~6 segundos
```

### 🏪 MEDIO (Simulación realista)
```
WaitForCooking:    15 segundos
WaitForPacking:    10 segundos
WaitForDelivery:   10 segundos
WaitForCompletion: 5 segundos
TOTAL:             ~40 segundos
```

### 🍗 LENTO (Realista + buffer)
```
WaitForCooking:    30 segundos
WaitForPacking:    15 segundos
WaitForDelivery:   45 segundos
WaitForCompletion: 10 segundos
TOTAL:             ~100 segundos (1 minuto 40 segundos)
```

## 🚀 Cómo Aplicar Cambios

### Opción 1: Editar y Deploy
1. Abrir `serverless.yml`
2. Cambiar los valores en `Seconds`
3. Guardar
4. Terminal: `serverless deploy`
5. Esperar ~2 minutos a que AWS actualice

### Opción 2: Si ya está deployado (actualizar)
```bash
cd kfc-backend
serverless deploy
```

AWS detectará el cambio en la State Machine y la actualizará.

## ⚠️ Precauciones

- **Mínimo:** 0 segundos (inmediato)
- **Máximo:** 999999 segundos (teóricamente ilimitado)
- **Máximo en práctica:** ~86400 segundos (1 día)

**Nota:** Si pones 0, los pedidos se completarán casi instantáneamente. Probablemente quieras al menos 1-2 segundos.

## 🧪 Testing Rápido

```yaml
# Para test rápido, usa esto:
"WaitForCooking": { "Seconds": 3 },
"WaitForPacking": { "Seconds": 2 },
"WaitForDelivery": { "Seconds": 1 },
"WaitForCompletion": { "Seconds": 1 }
```

Luego:
1. Deploy: `serverless deploy`
2. Crear un pedido
3. Ver cambios en ~7 segundos total

## 📍 Nota Final

Todos los tiempos están en **SEGUNDOS**.
No hay pausa entre el Lambda y el Wait. La secuencia es:
1. Lambda actualiza estado (inmediato)
2. WebSocket broadcast (inmediato)
3. Wait pausa (el tiempo que especifiques)
4. Siguiente Lambda (inmediato)
5. Vuelve a paso 2

¡Todo listo! Cambiar tiempos es muy fácil ahora.
