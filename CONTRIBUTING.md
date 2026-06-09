# Guía de contribución — StockGlow

## Setup inicial (obligatorio al clonar)

Después de clonar el repositorio ejecuta:

    pnpm install

Esto activa Husky automáticamente. Sin este paso los
hooks de git no funcionan y tus commits serán rechazados
al intentar pushear.

---

## Convención de ramas

El hook pre-push valida automáticamente el nombre de
la rama antes de cada push. Si no cumple el formato,
el push es bloqueado.

Formato: tipo/descripcion-en-kebab-case

| Prefijo    | Uso                          | Ejemplo                        |
|------------|------------------------------|--------------------------------|
| feature/   | Nueva funcionalidad          | feature/inventory-plugin       |
| fix/       | Corrección de bug            | fix/stock-negative-value       |
| hotfix/    | Corrección urgente en main   | hotfix/clerk-token-expired     |
| release/   | Preparación de versión       | release/v1.0.0                 |
| chore/     | Mantenimiento                | chore/update-dependencies      |

Ramas permanentes: main y develop (no se eliminan).

---

## Convención de commits

El hook commit-msg valida cada mensaje antes de
confirmar el commit. Formato obligatorio:

    tipo(scope): descripción en minúsculas

### Tipos permitidos

| Tipo       | Uso                                          |
|------------|----------------------------------------------|
| feat       | Nueva funcionalidad                          |
| fix        | Corrección de bug                            |
| chore      | Mantenimiento, dependencias                  |
| docs       | Documentación                                |
| test       | Pruebas                                      |
| refactor   | Refactorización sin cambio de comportamiento |
| ci         | Cambios en pipeline de CI/CD                 |
| hotfix     | Corrección urgente                           |

### Scopes permitidos

| Scope      | Área                              |
|------------|-----------------------------------|
| setup      | Configuración inicial del repo    |
| ci         | GitHub Actions y pipeline         |
| deps       | Dependencias                      |
| auth       | Plugin de autenticación           |
| inventory  | Plugin de inventario              |
| sales      | Plugin de ventas                  |
| alerts     | Plugin de alertas                 |
| db         | Schema, migraciones, seeds        |
| api        | Configuración base del servidor   |
| web        | Frontend React                    |
| shared     | Paquete compartido de tipos       |
| docs       | Documentación del proyecto        |

### Reglas adicionales

- El scope es obligatorio — sin scope el commit es rechazado
- La descripción va en minúsculas
- Máximo 80 caracteres en la línea del header
- Sin punto final en la descripción

### Ejemplos válidos

    feat(inventory): agregar endpoint de variantes con validación zod
    fix(sales): liberar redis lock en bloque finally
    chore(deps): actualizar fastify a v4.28
    docs(api): documentar endpoints de inventario con swagger
    test(db): agregar prueba de aislamiento rls entre tenants
    ci(setup): agregar workflow de github actions

### Ejemplos inválidos

    feat: agregar variantes         ← falta el scope
    Feat(inventory): Agregar algo   ← tipo en mayúscula
    feat(stock): agregar variantes  ← scope no permitido
    feat(inventory): agregar variantes de productos con tonos y precios. ← más de 80 chars y tiene punto

---

## Flujo GitFlow

1. Asegúrate de estar en develop actualizado
       git checkout develop
       git pull origin develop

2. Crea tu rama desde develop
       git checkout -b feature/nombre-del-issue

3. Trabaja en tu rama con commits que sigan la convención

4. Antes de abrir el PR, asegúrate de que tu rama
   está actualizada con develop
       git fetch origin
       git rebase origin/develop

5. Abre el PR hacia develop con el formato establecido

6. Requiere 1 aprobación antes de mergear

7. Se usa squash merge para mantener el historial limpio

---

## Formato de Pull Request

Título:
    [ISSUE-XX] Descripción corta en español

Body:
    ## Qué hace este PR
    Descripción de los cambios.

    ## Issues que cierra
    Closes #XX

    ## Cómo probarlo
    Pasos para verificar que funciona.

    ## Checklist
    - [ ] Los tests pasan localmente
    - [ ] El linter no reporta errores
    - [ ] La documentación está actualizada si aplica

---

## ¿Por qué estas reglas?

Husky ejecuta tres hooks automáticamente:

- pre-commit  — corre el linter sobre los archivos modificados
- commit-msg  — valida el formato del mensaje del commit
- pre-push    — valida el nombre de la rama antes de pushear

GitHub agrega una segunda línea de defensa:
las branch protection rules en main y develop
bloquean merges sin PR aprobado, independiente
de lo que haya pasado en local.