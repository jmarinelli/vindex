# Voz y Tono — VinDex

## Principio central

**VinDex es infraestructura, no autoridad.**

La plataforma registra, documenta y preserva. No verifica, no certifica, no avala. El profesional
(verificador, taller) es quien pone su nombre, su experiencia y su reputación detrás de cada
verificación. VinDex le da las herramientas para que ese trabajo quede documentado de forma
permanente, inmutable y accesible.

---

## Jerarquía de mensajes

### Para verificadores (audiencia primaria)

1. **VinDex es tu herramienta profesional** — te ayuda a documentar, presentar y compartir tu trabajo
2. **Tu marca va adelante** — los reportes llevan tu nombre, tu logo, tu contacto. La plataforma queda en segundo plano
3. **Tu trabajo se acumula** — cada verificación construye tu historial profesional y tu reputación

### Para compradores (audiencia secundaria)

1. **Accedé a lo que un profesional documentó** — no es VinDex quien dice que el auto está bien, es el verificador
2. **Lo que se firmó no se puede cambiar** — inmutabilidad como garantía de integridad
3. **Todo es transparente** — quién verificó, cuándo, para quién, a qué kilometraje

---

## Vocabulario

### Usamos

| Término | Contexto |
|---|---|
| **documentado/a** | "Historial documentado", "verificación documentada" |
| **registrado/a** | "Verificador registrado", "registrado en VinDex" |
| **firmado/a** | "Firmada por [nombre]" — describe la acción concreta del verificador |
| **vinculado/a** | "Vinculado al VIN" — el dato queda asociado permanentemente al vehículo |
| **profesional** | "Informe profesional", "un profesional evalúa" — término genérico para verificadores y talleres |
| **verificador** | "Verificador registrado" — término específico para quienes hacen verificaciones vehiculares |
| **verificación** | "Verificación vehicular", "verificación pre-compra" — el servicio que realiza el verificador |
| **inmutable** | "Inmutable por diseño" — propiedad técnica, no juicio de valor |
| **transparente** | "Transparencia total" — todo es visible, nada oculto |

### No usamos

| Término | Por qué |
|---|---|
| **verificado por VinDex** | Implica que VinDex es quien valida. No lo es — el profesional es quien firma |
| **certificado** | Sugiere una certificación formal que VinDex no otorga |
| **garantizado** | VinDex no garantiza el estado del vehículo, documenta lo que el profesional encontró |
| **aprobado** | VinDex no aprueba ni desaprueba — registra |
| **inspector verificado** | Suena a que VinDex validó las credenciales. Usamos "verificador registrado" |
| **firma digital** | Tiene peso legal específico (ley 25.506, PKI) que VinDex no implementa. Usamos "inspección firmada" |
| **firmado digitalmente** | Misma razón. Usamos "firmado por [nombre]" sin el adverbio |

### Casos especiales

- **"Verificación" como sección del reporte** → pasa a ser **"Inspección firmada"**. Lo que se
  muestra es que alguien firmó el reporte, no que VinDex lo verificó.
- **"Verificado en [logo]" en el footer** → pasa a ser **"Registrado en [logo]"**. El footer
  indica dónde vive el registro, no quién lo avala.
- **"Inspector verificado" como badge** → pasa a ser **"Verificador registrado"**. Indica que el
  verificador tiene cuenta activa en la plataforma.

### Terminología de roles

- **"Verificador"** es el término para el MVP. Alineado con el mercado argentino donde se habla
  de "verificaciones vehiculares" y "verificadores".
- **"Profesional"** es el término genérico que sirve como paraguas cuando la audiencia incluye
  verificadores y talleres. Se usará más en la v2.
- **"Inspector"** se deja de usar en el copy público. Puede mantenerse en código interno y
  nombres de componentes hasta un refactor posterior.
- **URLs:** el perfil público en `/inspector/[slug]` debería migrar a una ruta genérica
  (`/pro/[slug]` o `/profile/[slug]`) en la implementación. Decisión pendiente.

---

## Tono

### Directo y concreto
Decimos lo que es sin adornos. No exageramos ni hacemos promesas que no podemos cumplir.

- **Sí:** "Cada verificación queda firmada y vinculada al VIN."
- **No:** "¡VinDex garantiza la calidad de tu próximo auto!"

### Profesional pero cercano
Hablamos de vos (argentino), sin ser ni demasiado formal ni demasiado suelto.

- **Sí:** "Consultá el historial de un vehículo antes de decidir."
- **No:** "Consulte el historial vehicular para su proceso de decisión de compra."
- **No:** "Chequeá el historial del auto que te gustó!"

### El profesional es el héroe
En toda comunicación, el sujeto de la acción es el verificador o el taller, no VinDex.

- **Sí:** "Firmada por Juan Martínez · Taller del Centro"
- **No:** "Verificada por VinDex"
- **Sí:** "Un profesional evalúa el vehículo"
- **No:** "VinDex evalúa tu vehículo"

### Transparencia, no marketing
No vendemos tranquilidad — mostramos datos. La confianza viene de la información, no de un sello.

- **Sí:** "12 items bien · 3 atención · 1 crítico"
- **No:** "¡Este auto pasó la inspección VinDex!"

---

## Atribución de plataforma

La presencia de VinDex como marca es mínima y funcional:

- **Header:** logo solo, sin texto adicional
- **Footer (páginas públicas):** "Registrado en [logo]" — indica dónde vive el registro
- **Meta tags / OG:** "… | VinDex" como sufijo, nunca como sujeto de la oración
- **Landing page:** VinDex puede ser sujeto ("VinDex construye...") porque es contexto de producto, no atribución de un reporte específico

La regla general: **en cualquier lugar donde un comprador vea un reporte, VinDex es infraestructura. El nombre del verificador va primero y más grande.**

---

## Ejemplos de aplicación

| Ubicación | Antes | Después |
|---|---|---|
| Footer público | Verificado en [logo] | Registrado en [logo] |
| Badge de reporte | ✓ Verificación | ✓ Inspección firmada |
| Badge de verificador | Inspector verificado | Verificador registrado |
| aria-label verificador | "Inspector verificado por VinDex" | "Verificador registrado en VinDex" |
| Meta description reporte | "Inspección pre-compra verificada…" | "Inspección pre-compra documentada…" |
| Meta description perfil | "Inspector verificado en VinDex" | "Verificador registrado en VinDex" |
| Meta title general | "VinDex — Historial vehicular verificado" | "VinDex — Historial vehicular documentado" |
| PWA manifest | "Historial vehicular verificado" | "Historial vehicular documentado" |
| Footer reporte (spec) | "Verificado por VinDex" | "Registrado en VinDex" |
| Landing — "anclado al VIN" | "sellado/anclado al VIN" | "vinculado al VIN" |
| Landing — "inspector" refs | "inspector" / "inspectores" | "verificador" / "verificadores" |
