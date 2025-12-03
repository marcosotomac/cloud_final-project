#!/bin/bash
# Script de Testing: Crear un pedido y ver cómo fluye automáticamente

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

# Variables - CAMBIAR ESTOS VALORES
API_BASE="http://localhost:3001"  # Si es local
# API_BASE="https://api.ejemplo.com"  # Si es producción
TENANT_ID="tenant-123"            # Tu tenant ID
AUTH_TOKEN="tu-token-aqui"        # Token JWT del usuario autenticado
CUSTOMER_ID="customer-123"        # ID del cliente

# ============================================================================
# TEST 1: CREAR UN PEDIDO
# ============================================================================

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  TEST 1: Crear un Pedido                                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

curl -X POST "$API_BASE/tenants/$TENANT_ID/orders" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "'$CUSTOMER_ID'",
    "customerName": "Juan Pérez",
    "customerPhone": "+34 612 345 678",
    "customerEmail": "juan@example.com",
    "items": [
      {
        "itemId": "item-1",
        "name": "Combo Familiar",
        "price": 25.50,
        "quantity": 1
      },
      {
        "itemId": "item-2",
        "name": "Bebida Cola 2L",
        "price": 3.50,
        "quantity": 1
      }
    ],
    "orderType": "delivery",
    "deliveryAddress": "Calle Principal 123, Apt 4B",
    "deliveryNotes": "Sonar timbre 3 veces",
    "paymentMethod": "CASH",
    "estimatedDeliveryTime": 45
  }' | jq .

# Guardar el order ID de la respuesta
# Ejemplo: "orderId": "01ARZ3NDEKTSV4RRFFQ"

echo ""
echo "✓ Pedido creado. Copia el orderId de la respuesta anterior."
echo ""

# ============================================================================
# TEST 2: OBTENER EL PEDIDO (debe estar en PENDING inicialmente)
# ============================================================================

read -p "Ingresa el orderId: " ORDER_ID

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  TEST 2: Obtener Pedido (PENDING)                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

curl -X GET "$API_BASE/tenants/$TENANT_ID/orders/$ORDER_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN" | jq .

echo ""
echo "Status actual: PENDING"
echo ""

# ============================================================================
# TEST 3: ESPERAR Y VER EL CAMBIO A RECEIVED
# ============================================================================

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  TEST 3: Esperando 15 segundos...                         ║"
echo "║  El pedido debería pasar a RECEIVED automáticamente       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

for i in {15..1}; do
  echo -ne "\rEsperando: $i segundos...    "
  sleep 1
done
echo -e "\n"

curl -X GET "$API_BASE/tenants/$TENANT_ID/orders/$ORDER_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN" | jq '.status'

echo ""
echo "Status debería ser: RECEIVED"
echo ""

# ============================================================================
# TEST 4: MONITOREAR TODO EL FLUJO
# ============================================================================

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  TEST 4: Monitoreo Completo del Flujo (45s)              ║"
echo "║  Verás los cambios de estado automáticamente              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Estados que esperamos ver
EXPECTED_STATES=("PENDING" "RECEIVED" "COOKING" "PACKING" "DELIVERY" "COMPLETED")
CURRENT_STATE_INDEX=0
START_TIME=$(date +%s)

while true; do
  CURRENT_TIME=$(date +%s)
  ELAPSED=$((CURRENT_TIME - START_TIME))
  
  # Obtener el estado actual
  RESPONSE=$(curl -s -X GET "$API_BASE/tenants/$TENANT_ID/orders/$ORDER_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN")
  
  CURRENT_STATUS=$(echo "$RESPONSE" | jq -r '.status')
  
  if [ "$CURRENT_STATUS" != "${PREVIOUS_STATUS:-}" ]; then
    echo "[$ELAPSED s] Estado: $CURRENT_STATUS ✓"
    PREVIOUS_STATUS="$CURRENT_STATUS"
  fi
  
  # Si llegó a COMPLETED, salir
  if [ "$CURRENT_STATUS" = "COMPLETED" ]; then
    echo ""
    echo "✅ PEDIDO COMPLETADO"
    echo "Tiempo total: $ELAPSED segundos"
    break
  fi
  
  # Timeout después de 60 segundos
  if [ $ELAPSED -gt 60 ]; then
    echo ""
    echo "⚠️  Timeout: pedido aún no completado"
    break
  fi
  
  sleep 2
done

echo ""

# ============================================================================
# TEST 5: OBTENER DETALLE FINAL
# ============================================================================

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  TEST 5: Detalle Final del Pedido                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

curl -X GET "$API_BASE/tenants/$TENANT_ID/orders/$ORDER_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN" | jq .

echo ""
echo "✅ TEST COMPLETADO"
echo ""

# ============================================================================
# ALTERNATIVA: USANDO WEBSOCKET PARA VER ACTUALIZACIONES EN TIEMPO REAL
# ============================================================================

cat << 'EOF'

╔════════════════════════════════════════════════════════════╗
║  ALTERNATIVA: Usar WebSocket para Ver Cambios en Tiempo Real
║  (Método más realista - lo que ven los empleados)        ║
╚════════════════════════════════════════════════════════════╝

1. Abrir browser console (F12)

2. Ejecutar este JavaScript:

```javascript
// Conectar a WebSocket
const ws = new WebSocket('wss://API_ENDPOINT/wss?token=TOKEN&tenantId=TENANT');

ws.onopen = () => {
  console.log('WebSocket conectado');
  // Suscribirse a actualizaciones de órdenes
  ws.send(JSON.stringify({
    action: 'subscribe',
    data: { channels: ['orders'] }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Evento recibido:', message);
  
  if (message.type === 'order_update') {
    console.log(`Pedido ${message.payload.orderId} ahora está: ${message.payload.status}`);
  }
};

ws.onerror = (error) => {
  console.error('Error WebSocket:', error);
};
```

3. Crear un pedido en otra tab

4. Ver cómo el WebSocket recibe actualizaciones automáticas
   sin necesidad de hacer polling (GET requests)

EOF

echo ""
EOF
