# Matriz de Pruebas de Calidad - Motor de Promociones

Casos de prueba para validación del motor de promociones y descuentos.

| ID | Módulo | Escenario | Condición | Resultado Esperado | Prioridad |
|---|---|---|---|---|---|
| QA-01 | Existencia | Código inexistente | Código NOEXISTE | Rechazar con invalid_code. No continuar con demás reglas | Crítica |
| QA-02 | Existencia | Código vacío | Código "" o null | Rechazar solicitud por dato inválido. Sin error interno | Crítica |
| QA-03 | Existencia | Código con espacios | Código " SUMMER15 " | Normalizar o rechazar controladamente. Decisión documentada | Alta |
| QA-04 | Existencia | Mayúsculas/minúsculas | summer15 vs SUMMER15 | Definir si case-sensitive. Recomen: normalizar a mayúsculas | Alta |
| QA-05 | Vigencia | Código aún no vigente | Fecha actual < startDate | Rechazar con expired_coupon | Crítica |
| QA-06 | Vigencia | Código expirado | Fecha actual > endDate | Rechazar con expired_coupon | Crítica |
| QA-07 | Vigencia | Fecha = startDate | Fecha actual = startDate | Válido si está activo | Alta |
| QA-08 | Vigencia | Fecha = endDate | Fecha actual = endDate | Definir inclusividad. Recomen: vigente hasta fin de fecha | Alta |
| QA-09 | Estado | Código en draft | Estado ≠ active | Rechazar con invalid_code | Crítica |
| QA-10 | Estado | Código pausado | Estado paused | Rechazar con invalid_code | Crítica |
| QA-11 | Estado | Código expirado | Estado expired | Rechazar con invalid_code o expired_coupon. Mantener consistencia | Alta |
| QA-12 | Orden validación | Inexistente + expirado | No existe en BD | Devolver solo invalid_code (se valida primero) | Crítica |
| QA-13 | Orden validación | Expirado + inactivo | Fuera de fecha + paused | Devolver expired_coupon (vigencia antes que estado) | Crítica |
| QA-14 | Compra mínima | Subtotal < mínimo | Subtotal $49.99, mín $50 | Rechazar con min_amount_required | Crítica |
| QA-15 | Compra mínima | Subtotal = mínimo | Subtotal $50, mín $50 | Delimitar: TDR dice "superar", rechazar si = | Crítica |
| QA-16 | Compra mínima | Subtotal > mínimo | Subtotal $50.01, mín $50 | Permitir continuar | Alta |
| QA-17 | Compra mínima | Subtotal cero | Subtotal $0 | Rechazar con min_amount_required. No descuento negativo | Alta |
| QA-18 | Compra mínima | Subtotal negativo | Subtotal -$20 | Rechazar como inválida. Fuera del dominio permitido | Crítica |
| QA-19 | Categoría | Categoría autorizada | Pertenece a configuradas | Permitir continuar | Alta |
| QA-20 | Categoría | Categoría no autorizada | Fuera de lista | Rechazar con invalid_code | Crítica |
| QA-21 | Categoría | Categoría hija de autorizada | Padre configurado | Permitir si soporta jerarquía padre/hijo | Alta |
| QA-22 | Categoría | Categoría inexistente | categoryId inválido | Rechazar controladamente. Sin error interno | Alta |
| QA-23 | Primera compra | Usuario sin órdenes previas | Historial vacío | Permitir first_order_only | Crítica |
| QA-24 | Primera compra | Usuario con orden pagada | Historial con compra completada | Rechazar con code_already_used | Crítica |
| QA-25 | Primera compra | Usuario con orden en carrito | Orden pendiente/actual | Permitir (currentOrders no cuenta en historial) | Crítica |
| QA-26 | Primera compra | Usuario con orden cancelada | Solo órdenes canceladas | Permitir (no son válidas en historial) | Alta |
| QA-27 | Límite por usuario | Debajo del límite | Límite 3, tiene 2 usos | Permitir | Crítica |
| QA-28 | Límite por usuario | Exactamente en límite | Límite 3, tiene 3 usos | Rechazar con usage_limit_reached | Crítica |
| QA-29 | Límite por usuario | Usos pendientes | Límite 3, 2 pagados + 4 pendientes | Permitir (solo cuentan pagados) | Crítica |
| QA-30 | Límite global | Debajo del límite | Límite 100, 99 pagados | Permitir | Crítica |
| QA-31 | Límite global | Alcanzó límite | Límite 100, 100 pagados | Rechazar con usage_limit_reached | Crítica |
| QA-32 | Límite global | Muchos pendientes | 100 pendientes + 10 pagados | Contar solo los 10 pagados | Crítica |
| QA-33 | Monto global | Debajo del límite | Límite $1,000, acumulado $950 | Permitir si nuevo descuento no supera límite | Crítica |
| QA-34 | Monto global | Nuevo descuento supera restante | Límite $1,000, acumulado $990, descuento $20 | Rechazar con maximum_discount_reached | Crítica |
| QA-35 | Monto global | Monto = límite | Acumulado $980, descuento $20 | Permitir y dejar en $1,000 | Alta |
| QA-36 | Uso restringido | Usuario autorizado | Existe en restricted_user_mappings | Permitir continuar | Crítica |
| QA-37 | Uso restringido | Usuario no autorizado | No existe en relación | Rechazar con restricted_usage | Crítica |
| QA-38 | Uso restringido | Lista vacía | Regla activa sin usuarios | Rechazar a todos. O considerar configuración inválida | Alta |
| QA-39 | Descuento fijo | Valor < subtotal | Descuento $10, subtotal $100 | Retornar $10 | Crítica |
| QA-40 | Descuento fijo | Valor > subtotal | Descuento $150, subtotal $100 | Retornar $100 (no superar subtotal) | Crítica |
| QA-41 | Descuento fijo | Valor = subtotal | Descuento $100, subtotal $100 | Retornar $100; total final $0 | Alta |
| QA-42 | Porcentaje | Porcentaje normal | 15% sobre $100 | Retornar $15 | Crítica |
| QA-43 | Porcentaje | Decimales | 12.5% sobre $80 | Retornar $10 (aplicar política de redondeo) | Alta |
| QA-44 | Porcentaje | Superior a 100% | 150% sobre $100 | Rechazar o limitar a $100. No superar subtotal | Crítica |
| QA-45 | Porcentaje | Negativo | -10% | Rechazar configuración como inválida | Crítica |
| QA-46 | Tiered | Sin órdenes previas | Tramos: 0→5%, 3→10%, 10→15% | Aplicar 5% | Crítica |
| QA-47 | Tiered | Exactamente en tramo | 3 órdenes previas | Aplicar 10% | Crítica |
| QA-48 | Tiered | Entre dos tramos | 7 órdenes previas | Aplicar tramo más alto: 10% | Crítica |
| QA-49 | Tiered | En tramo superior | 10+ órdenes previas | Aplicar 15% | Crítica |
| QA-50 | Tiered | Tramos desordenados | Almacenados 10, 0, 3 | Motor debe ordenarlos o seleccionar mayor minOrders elegible | Alta |
| QA-51 | Tiered | Sin tramos configurados | Tipo tiered sin configuración | Rechazar como error controlado. No calcular 0 silenciosamente | Alta |
| QA-52 | Post-cálculo | Descuento < máximo | Descuento $20, tope $50 | Retornar $20 | Alta |
| QA-53 | Post-cálculo | Descuento > máximo | Descuento $70, tope $50 | Retornar $50 | Crítica |
| QA-54 | Post-cálculo | Descuento = máximo | Descuento $50, tope $50 | Retornar $50 | Alta |
| QA-55 | Configuración | Código sin reglas configurables | Activo y vigente | Calcular descuento normalmente tras reglas fijas | Crítica |
| QA-56 | Configuración | Regla desactivada | isActive = false | No evaluar la regla | Alta |
| QA-57 | Configuración | Regla desconocida | ruleType no implementado | Rechazar controladamente o ignorar según política. Recomen: rechazar | Alta |
| QA-58 | Configuración | JSON incompleto | min_purchase_amount sin minAmount | Rechazar configuración inválida. Sin valores arbitrarios | Crítica |
| QA-59 | Configuración | Regla duplicada | Dos min_purchase_amount activas | Definir: rechazar configuración o usar más restrictiva. Recomen: impedir duplicados | Media |
| QA-60 | Integración | Tipos de orden diferentes | ServiceOrder, ProductOrder, SubscriptionOrder | Todas funcionan si implementan OrderableInterface | Alta |
| QA-61 | Integración | Orden sin contexto | getOrderContext() devuelve null | Rechazar solicitud inválida controladamente | Crítica |
| QA-62 | Persistencia | Registrar uso exitoso | Validación + cálculo OK | Crear registro con código, orden, comprador, monto, indicador pago | Alta |
| QA-63 | Persistencia | Validación fallida | Alguna regla bloquea | No registrar uso del código | Crítica |
| QA-64 | Idempotencia | Misma orden dos veces | Mismo orderId + código | No registrar dos usos ni aplicar dos veces descuento | Crítica |
| QA-65 | HTTP | Solicitud válida | Cuerpo completo, datos correctos | Respuesta exitosa con valid: true + monto descuento | Crítica |
| QA-66 | HTTP | Campo obligatorio ausente | Sin código, orden o comprador | Respuesta 400 con mensaje entendible | Crítica |
| QA-67 | HTTP | Tipo incorrecto | Subtotal como texto no numérico | Respuesta 400; no convertir silenciosamente | Alta |
| QA-68 | HTTP | Código rechazado | Cualquier regla falla | Respuesta controlada con código semántico | Crítica |
| QA-69 | Seguridad | Manipulación subtotal | Cliente envía subtotal distinto | Obtener subtotal de orden del sistema, no confiar cliente | Crítica |
| QA-70 | Concurrencia | Último cupo usado simultáneamente | Dos solicitudes cuando queda 1 uso | Posible condición de carrera. Proponer transacción serializable o bloqueo en /apply | Crítica |

## Notas

- **Crítica**: Bloquea lanzamiento, debe estar 100% funcional
- **Alta**: Importante, afecta experiencia o datos
- **Media**: Deseable, optimización o mejora futura

## Próximos Pasos

1. Implementar pruebas para cada caso QA
2. Ajustar clases según resultados
3. Validar coherencia en flujos de validación, cálculo y post-cálculo
