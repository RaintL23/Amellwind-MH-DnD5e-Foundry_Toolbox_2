# Borrador: Artificiero 2024 de Amellwind — Planos de Material Effects

> **Estado: borrador de diseño.** No es regla del proyecto ni está enlazado desde `docs/domain/index.md`. No hay cambios de código asociados. Cuando se cierre, la regla definitiva iría en `docs/domain/features-builder.md` (y la guía del personaje).
>
> Los números de planos conocidos, efectos activos y niveles de desbloqueo son los del Artificiero 2024 y se mantienen tal cual: el único cambio respecto a 2024 es que los planos pasan de objetos mágicos a Material Effects. Verificados contra el dato EFA (`class-artificer.json` del mirror de 5etools): coinciden.

## 1. Punto de partida

**Amellwind (2014)** — [`gtmh-patreon.md`](../../public/data/gtmh-patreon/gtmh-patreon.md) líneas 2386-2392:

- El Artificiero no gana atunaciones extra. Gana **+1 ranura de material en arma y armadura** a niveles 10, 14 y 18.
- Las **infusiones** son materiales temporales: se colocan en una ranura durante un descanso largo, sustituyen al material normal como activo (sin destruirlo) y duran hasta que se retiran en un descanso largo, se olvidan o el artificiero deja el grupo.
- En equipo ajeno, la infusión ocupa 2 ranuras en lugar de 1.

**2024** quita las infusiones y las sustituye por *Replicate Magic Item* con **planos** (lista limitada de objetos mágicos que se desbloquea por nivel).

**Qué se conserva y qué se cambia:**

| Elemento | Decisión |
| --- | --- |
| +1 ranura de material a niv. 10/14/18 | **Se conserva** y no se toca (tampoco a nivel 18). Coincide con Magic Item Adept/Savant/Master de 2024. |
| Material temporal que sustituye al activo sin destruirlo | **Se conserva.** Es la mecánica de colocación de las infusiones. |
| Infusiones (lista de la guía) | **Se elimina.** |
| Replicate Magic Item (objetos mágicos) | **Se sustituye** por réplica de Material Effects. En la mesa no hay objetos mágicos. |

## 2. Reglas de Replicate Material Effect

**Replicate Material Effect** sustituye a Replicate Magic Item.

1. **Planos.** El Artificiero conoce un número limitado de planos. Cada plano es un Material Effect de una **lista cerrada** (sección 5), no del catálogo entero.
2. **Cambiar planos.** Al subir de nivel puede cambiar uno de sus planos, igual que en 2024.
3. **Réplica.** Al terminar un descanso largo puede crear efectos nuevos, cada uno basado en un plano distinto. Cada efecto se coloca en una ranura de arma o armadura **propia o de una criatura dispuesta**, sustituyendo al material activo (que queda debajo, intacto).
4. **Duración.** Como en EFA, el efecto no caduca con el descanso largo: dura **hasta que el Artificiero decida retirarlo**. Además desaparece si:
   - sustituye el plano con el que se creó (desaparece al instante);
   - supera el máximo de efectos activos (desaparece el más antiguo);
   - el Artificiero muere (desaparece 1d4 días después).
5. **Equipo ajeno.** Cuenta como **2** de los efectos activos (misma idea que las infusiones, que ocupaban 2 ranuras).
6. **Sin duplicados.** No se puede conocer ni activar dos veces el mismo efecto (cuentan como el mismo todas sus versiones, p. ej. Divine Blessing y Divine Blessing+), y una criatura no puede recibir una réplica de un efecto que ya tiene activo por un material real.
7. **Sin atunación.** No entran efectos cuyo texto exige estar atunado al arma o armadura.
8. **Usos limitados.** Los usos del efecto se recuperan al terminar un descanso largo, que es cuando se crean los efectos. Si el original tenía una recarga más larga que un descanso largo (por ejemplo, Guts: 2 días), se trata como un uso por descanso largo.

### Niveles de la lista

La lista se actualiza en los niveles **2, 6, 10 y 14**, que siguen los saltos de la tabla de planos de 2024. La lista no está atada a una rareza: cada efecto está en el nivel que mejor encaja con su balance, aunque su rareza en el catálogo sea otra.

### Cantidades

Los de 2024 (columnas *Plans Known* y *Magic Items* de EFA), sin cambios. Entre estos niveles los valores no cambian:

| Nivel | Planos conocidos | Efectos activos |
| --- | --- | --- |
| 2 | 4 | 2 |
| 6 | 5 | 3 |
| 10 | 6 | 4 |
| 14 | 7 | 5 |
| 18 | 8 | 6 |

### Magic Item Tinker (nivel 6)

En EFA añade tres opciones a Replicate Magic Item. Aquí se adaptan dos; *Charge Magic Item* no aplica porque los Material Effects no usan cargas de objeto.

**Drain Magic Item.** Como acción adicional, el Artificiero toca un efecto replicado activo a 5 pies o menos y lo hace desaparecer, convirtiendo su energía en un espacio de conjuro. El nivel del espacio depende de la **rareza del Material Effect activo** (columna *Rareza* de la sección 5):

| Rareza del efecto | Nivel del espacio |
| --- | --- |
| Common | 1 |
| Uncommon | 2 |
| Rare | 2 |
| Very Rare | 3 |

Una vez usado, no puede volver a usarse hasta terminar un descanso largo. El espacio creado desaparece al terminar un descanso largo. El plano sigue conocido, y el material original que estaba debajo vuelve a ser el activo.

**Transmute Magic Item.** Como acción de Magia, el Artificiero toca un efecto replicado activo a 5 pies o menos y lo transforma en otro efecto de un plano que conozca y que no tenga activo. El nuevo efecto debe ser del mismo tipo de equipo (arma o armadura) que el que sustituye. Una vez usado, no puede volver a usarse hasta terminar un descanso largo.

## 3. Una sola lista que evoluciona

El Artificiero no maneja listas distintas: tiene **una única lista de planos** (sección 5) que se actualiza cuando la característica evoluciona, en los niveles 2, 6, 10 y 14.

- Al llegar a un nivel de desbloqueo se **añaden** los efectos de ese nivel.
- Algunos efectos son una versión mejor de otro que ya estaba (Divine Blessing, Evade Extender, Stamina Surge…). Cuando se desbloquea la versión mejor, **sustituye** a la anterior, que deja de estar disponible.
- Un plano aprendido de un efecto sustituido **pasa solo a su nueva versión**, sin gastar otro plano. Sigue contando como un único plano y un único efecto activo.
- Un efecto no se puede aprender hasta el nivel que lo añade a la lista.

Ejemplo: un Artificiero de nivel 2 con **Divine Blessing** reduce daño con 1d4. Al llegar a nivel 6 la lista cambia Divine Blessing por Divine Blessing+ y su plano pasa a 1d6; a nivel 10, a 1d8; a nivel 14, a 1d10.

## 4. Criterios para entrar en la lista

**Entra:** efectos básicos y útiles, genéricos para cualquier arma o armadura.

**No entra:**

- **Generadores de botín o recursos** (Botanist, Geologist, Luck, Pack Rat, Capturer, Bounty Hunter, Carving Celebrity, Hunter, Honey Hunter). Replicarlos sería botín infinito y rompe el bucle de caza.
- **Específicos de un tipo de arma** (Artillery, Horn Maestro, Bonus Shot, Rapid Fire, Soul of the Dragoon, Punish Draw, FastCharge…).
- **Referencias a otra tabla** (Blast Coat, Capacity Boost, Mushroomancer+): son `isReference` en el catálogo.
- **Dependen de recursos de clase o suben/fijan atributos.**
- **Exigen atunación** en su texto (Well Rested, Earplugs, Shield, Speed Eating, Constitution, Wind Barrier).
- **Descartados por balance** (Iron Wall, Good Luck, Honed Blade, Health Boost, Heat Guard, Stamina Surge+2, Ammo Saver+).

## 5. Lista de planos

Es una sola lista. Cada tabla muestra lo que se **añade** al desbloquear ese nivel. Las filas con **Sustituye a** son una versión mejorada de un efecto de un nivel anterior: al desbloquearse, ese efecto anterior **deja de estar disponible** y queda reemplazado por el nuevo.

Marcas: **`W`** arma · **`A`** armadura. La columna *Rareza* es la del catálogo y solo se usa en Drain Magic Item (sección 2); no condiciona en qué nivel está el efecto.

### Nivel 2 (7 efectos)

| Efecto | Slot | Rareza | Qué da | Sustituye a |
| --- | --- | --- | --- | --- |
| Divine Blessing | A | Common | Reduce el daño recibido en 1d4 | |
| Recovery Speed | A | Common | Los Dados de Golpe curan el doble | |
| Detect | A | Common | +1 a Percepción pasiva | |
| Team Player | A | Common | Ayudar como acción adicional, 2/descanso largo | |
| Marathon Runner | A | Common | +5 pies de velocidad | |
| Taunt | W | Common | Reacción para redirigir un ataque hacia ti | |
| Current Resist | W | Common | Inmune a corrientes de agua | |

### Nivel 6 (+12, 18 disponibles)

| Efecto | Slot | Rareza | Qué da | Sustituye a |
| --- | --- | --- | --- | --- |
| **Divine Blessing+** | A | Uncommon | Reduce el daño recibido en 1d6 | **Divine Blessing** |
| Guard | A | Common | No te empujan ni te hacen retroceder | |
| Evade Extender (S) | A | Uncommon | +1 a salvaciones de Destreza | |
| Stamina Surge | A | Uncommon | Haste a uno mismo, 1/día; 3 niveles de agotamiento al terminar | |
| Guts | A | Uncommon | Caes a 1 PG en lugar de 0, un uso por réplica | |
| Spider Climb | A | Uncommon | Trepar por paredes y techos | |
| Negate Bleeding | A | Uncommon | Inmune a efectos de herida | |
| Critical Draw | W | Uncommon | Primer asalto: crítico con 17+ | |
| Partbreaker | W | Uncommon | +1d4 en crítico | |
| Ammo Saver | W | Uncommon | La munición no se gasta con 17-20 | |
| Stamina Drain | W | Uncommon | Reduce 5 pies la velocidad del objetivo | |
| Sharpening | W | Uncommon | Tras afilar, el primer golpe hace el daño máximo (armas cortantes) | |

### Nivel 10 (+16, 31 disponibles)

| Efecto | Slot | Rareza | Qué da | Sustituye a |
| --- | --- | --- | --- | --- |
| **Divine Blessing+2** | A | Rare | Reduce el daño recibido en 1d8 | **Divine Blessing+** |
| **Evade Extender (M)** | A | Rare | +2 a salvaciones de Destreza | **Evade Extender (S)** |
| **Partbreaker+1** | W | Rare | +1d6 en crítico | **Partbreaker** |
| Hero Shield | A | Uncommon | Inmune al daño físico de criaturas CR 2 o menos | |
| Survivor | A | Rare | Cuando un aliado cae a 0 PG: +1 CA, daño y ataque durante 1 minuto | |
| Wide-Range | A | Rare | Hierbas y antídotos afectan a un radio de 10 pies | |
| Handicraft | A | Rare | Competencia con una herramienta de artesano cada amanecer | |
| Alert | A | Rare | No te pueden sorprender | |
| Rock Steady | A | Rare | No te derriban ni te mueven a la fuerza | |
| Negate Sleep | A | Rare | Inmune a quedar dormido | |
| Tool Specialist | A | Rare | Competencia doble con herramientas (encaja con el Artificiero) | |
| Airborne | A | Rare | Jump a voluntad, solo uno mismo | |
| Critical Eye | W | Rare | Rango de crítico +1 | |
| Weakness Exploit | W | Rare | Daño máximo contra vulnerabilidades | |
| Siege | W | Rare | Doble daño a objetos y estructuras (encaja con el Artificiero) | |
| Status Pursuit | W | Rare | Ventaja en ataques de oportunidad | |

### Nivel 14 (+17, 39 disponibles)

| Efecto | Slot | Rareza | Qué da | Sustituye a |
| --- | --- | --- | --- | --- |
| **Divine Blessing+3** | A | Very Rare | Reduce el daño recibido en 1d10 | **Divine Blessing+2** |
| **Evade Extender (L)** | A | Very Rare | +3 a salvaciones de Destreza | **Evade Extender (M)** |
| **Stamina Surge+1** | A | Rare | Haste a uno mismo, 1/día; 2 niveles de agotamiento al terminar | **Stamina Surge** |
| **Survivor+** | A | Very Rare | Igual que Survivor, con +2 CA, daño y ataque | **Survivor** |
| **Wide-Range+** | A | Very Rare | Radio de 20 pies | **Wide-Range** |
| **Handicraft+2** | A | Very Rare | Competencia con dos herramientas de artesano | **Handicraft** |
| **Critical Draw+** | W | Rare | Primer asalto: crítico con 15+ | **Critical Draw** |
| **Partbreaker+2** | W | Very Rare | +1d8 en crítico | **Partbreaker+1** |
| **Critical Eye+** | W | Very Rare | Rango de crítico +2 | **Critical Eye** |
| Evasion | A | Very Rare | Ventaja en salvaciones de Destreza | |
| Blightproof | A | Very Rare | Inmune a efectos de blight | |
| Critical Boost | W | Very Rare | Dado extra en el daño del crítico | |
| Heavy Polish | W | Very Rare | Ignora resistencia al daño cortante | |
| Elderseal | W | Very Rare | Bloquea acciones con recarga | |
| Strong Attack | W | Very Rare | Empuja 10 pies como acción adicional | |
| Trump Card | W | Very Rare | Ventaja contra criaturas agarradas | |
| Enlightened Blade | W | Very Rare | Ventaja en Arcanos; sube el dado elemental | |

**Resumen:** 7 efectos a nivel 2, 18 a nivel 6, 31 a nivel 10 y 39 a nivel 14. En total pasan por la lista 52 efectos del catálogo, que son 39 planos distintos al final. Ammo Saver no se sustituye (se queda en su versión base), y Stamina Surge+1 y Critical Draw+ no llegan hasta el nivel 14.

## 6. Datos de referencia (del proyecto)

- Catálogo de Common a Very Rare: 87 efectos de arma y 101 de armadura (188 en total). Por rareza y ranura:

| | Common | Uncommon | Rare | Very Rare |
| --- | --- | --- | --- | --- |
| Arma | 9 | 21 | 22 | 35 |
| Armadura | 17 | 25 | 35 | 24 |

- Fuente: `bookData` del supplement GTMH, mapeado en `src/features/amellwind/material-effects/mappers/material-effect.mapper.ts`.
- Slots extra de material del Artificiero: `src/shared/utils/artificer-material-slots.utils.ts`.
