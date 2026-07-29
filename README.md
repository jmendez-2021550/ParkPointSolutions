# Parqueo_Inteligente

API REST para un sistema de estacionamiento inteligente que incluye monitoreo de disponibilidad en tiempo real, reservas con pagos digitales automatizados, mapa interactivo de espacios libres y control de acceso mediante reconocimiento de placas (LPR) o códigos QR, todo centralizado en un dashboard administrativo con analíticas de ocupación y horas pico.

## ¿Qué es este proyecto?

Parqueo_Inteligente es una solución completa para la gestión de estacionamientos modernos. Los usuarios pueden crear una cuenta, visualizar espacios disponibles en tiempo real, reservar espacios, realizar pagos digitales, acceder mediante reconocimiento de placas o QR, y los administradores pueden monitorear la ocupación y obtener analíticas de operación.

## ¿Qué necesito para que funcione?

Antes de empezar, necesitas tener instalado en tu computadora:

- **Node.js** (versión 18 o superior)

## Funcionalidades de precios dinámicos

- El sistema ajusta el `priceCents` automáticamente según la demanda y la ocupación:
  - Alta ocupación (>= umbral alto) → factor multiplicador (por defecto 1.5).
  - Baja ocupación (<= umbral bajo) → factor reductivo (por defecto 0.8).
  - Umbrales y multiplicadores configurables mediante variables de entorno.

### Endpoints de precios

1. **Cotización** (cualquiera puede consultar)
   ```http
   GET /api/v1/pricing/quote?baseCents=5000&startAt=2026-03-03T10:00:00Z
   ```
   Responde con JSON que incluye el precio recomendado y la tasa de ocupación actual.

2. **Aplicación automática**: al crear una reserva (`POST /api/v1/parking/reservations`),
   si se omite `priceCents` o se envía `0` el middleware `applyDynamicPrice` calculará el precio
   antes de persistir la reserva.

Estos endpoints se agregan en 
`src/pricing/pricing.routes.js` y la lógica está en `src/pricing/pricing.service.js`.

### Variables de entorno para precios dinámicos

Puedes controlar el comportamiento del algoritmo mediante las siguientes variables:

```text
DEFAULT_BASE_PRICE_CENTS=5000          # precio base si no se especifica en la petición
PRICING_HIGH_THRESHOLD=0.8             # tasa de ocupación considerada "alta"
PRICING_LOW_THRESHOLD=0.3              # tasa de ocupación considerada "baja"
PRICING_HIGH_MULT=1.5                  # multiplicador cuando la ocupación es alta
PRICING_LOW_MULT=0.8                   # multiplicador cuando la ocupación es baja
```

Todos estos valores tienen establecidos valores por defecto dentro de `config.js`,
pero puedes ajustarlos en tu `.env` para experimentar con distintas estrategias.

## Sistema de Usuarios Favoritos

El sistema identifica automáticamente a los usuarios más activos (que más reservan) en el último mes y les otorga el estatus de "Favorito". Los usuarios favoritos reciben beneficios como precios reducidos (10% de descuento) en sus reservas.

### Funcionalidades de Favoritos

- **Detección automática**: Cada mes, el sistema calcula los top 10 usuarios por número de reservas completadas.
- **Notificación por email**: Los nuevos favoritos reciben un email personalizado notificándoles su estatus y beneficios.
- **Descuento automático**: Al reservar, si el usuario es favorito, se aplica automáticamente un 10% de descuento sobre el precio dinámico.
- **Mantenimiento mensual**: El estatus se revisa mensualmente; si un usuario deja de estar en el top, pierde el beneficio hasta el próximo mes.

### Endpoints de Favoritos

1. **Procesar Favoritos** (solo administradores)
   ```http
   POST /api/v1/favorites/process
   ```
   Ejecuta el cálculo mensual de favoritos, actualiza la base de datos y envía emails a los nuevos favoritos.

### Cómo funciona

- Los datos se almacenan en la tabla `favorites` en PostgreSQL.
- La lógica está en `src/favorites/favorites.service.js`.
- Se integra con el sistema de precios en `src/pricing/pricing.service.js` para aplicar descuentos.
- Los emails se envían usando el servicio existente en `helpers/email-service.js`.

- **pnpm** (gestor de paquetes, es más rápido que npm)
- **PostgreSQL** (base de datos principal)
- **MongoDB** (para guardar datos complementarios)
- **Docker** (opcional, pero recomendado para ejecutar PostgreSQL fácilmente)

## Pasos para hacer funcionar el proyecto

### Paso 1: Clonar o descargar el proyecto

Descarga el proyecto a tu computadora. Una vez que lo tengas, abre una terminal en la carpeta del proyecto.

### Paso 2: Instalar las dependencias

En la terminal, escribe:

```bash
pnpm install
```

Esto descargará todas las librerías que necesita el proyecto.

### Paso 3: Configurar las variables de entorno

Necesitas un archivo llamado `.env` en la raíz del proyecto. Este archivo tiene información importante como contraseñas y configuraciones. Ya debe estar incluido en el proyecto, pero verifica que tenga estas configuraciones:

```
NODE_ENV=development
PORT=3005

DB_HOST=localhost
DB_PORT=5436
DB_NAME=PARQUEO_INTELIGENTE_DB
DB_USERNAME=root
DB_PASSWORD=admin

MONGODB_URI=mongodb://localhost:27017/Parqueo_Inteligente
MONGODB_DB_NAME=Parqueo_Inteligente

JWT_SECRET=<genera_una_clave_larga_y_aleatoria>
JWT_EXPIRES_IN=30m

FRONTEND_URL=http://localhost:5173
STRIPE_SECRET_KEY=tu_clave_stripe_aqui
```

**Nota:** Si quieres cambiar alguno de estos valores (como la contraseña o el puerto), puedes editar el archivo `.env`.

### Paso 4: Configurar la base de datos PostgreSQL

Tienes dos opciones:

**Opción A: Usar Docker (recomendado, más fácil)**

1. Asegúrate de tener Docker instalado
2. En la terminal, accede a la carpeta del proyecto
3. Ejecuta:

```bash
docker-compose up -d
```

Esto creará un contenedor con PostgreSQL automáticamente.

**Opción B: Instalar PostgreSQL en tu computadora**

1. Descarga PostgreSQL desde https://www.postgresql.org/download/
2. Durante la instalación, recuerda la contraseña que pongas
3. Crea una base de datos llamada `PARQUEO_INTELIGENTE_DB`
4. Actualiza los valores en el archivo `.env` con tus datos

### Paso 5: Configurar MongoDB

MongoDB guarda la colección `reservations` (copia de las reservas que viven en PostgreSQL).
La variable que lee el backend es **`MONGODB_URI`**, en `Backend/ParkingService/.env`.

**Opción A: Docker (por defecto)**

`docker-compose up -d` ya levanta el contenedor `parkpointsolutions_mongo` en el puerto 27017.
Los datos quedan en el volumen de Docker `parkpointsolutions_mongo_data`.

Para verlo en MongoDB Compass conéctate a:

```
mongodb://localhost:27017
```

y abre la base de datos **`Parqueo_Inteligente`** (no aparece hasta que se crea la primera reserva).

**Opción B: MongoDB Atlas (nube)**

1. Crea una cuenta y un clúster gratuito M0 en https://www.mongodb.com/cloud/atlas
2. *Database Access* → crea un usuario con rol `readWrite` sobre `Parqueo_Inteligente`
3. *Network Access* → agrega tu IP (o `0.0.0.0/0` solo para pruebas)
4. *Connect → Drivers* → copia la cadena `mongodb+srv://...`
5. Ponla en `Backend/ParkingService/.env`:

```
MONGODB_URI=mongodb+srv://<usuario>:<password>@<cluster>.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=Parqueo_Inteligente
```

6. (Opcional) Migra los datos que ya tengas en local hacia Atlas:

```bash
cd Backend/ParkingService
npm run migrate:atlas
```

> Si la contraseña tiene caracteres especiales (`@`, `#`, `/`, `:`), debes codificarla en URL.

**Si al conectar sale `querySrv ECONNREFUSED`**

Significa que Node no puede resolver registros DNS de tipo SRV (pasa cuando un adaptador
de WSL, Docker o una VPN deja `127.0.0.1` como servidor DNS). Compruébalo con:

```bash
node -e "console.log(require('dns').getServers())"
```

Si devuelve `[ '127.0.0.1' ]`, usa la **cadena estándar** en vez de la `mongodb+srv://`.
En Atlas: *Connect → Drivers*, y en el selector de versión del driver elige **2.2.12 or later**;
te dará una cadena con los tres nodos del replica set, que no necesita SRV:

```
MONGODB_URI=mongodb://<usuario>:<password>@<nodo-00>:27017,<nodo-01>:27017,<nodo-02>:27017/?ssl=true&replicaSet=<replicaSet>&authSource=admin&retryWrites=true&w=majority
```

### Paso 6: Configurar Stripe (Pagos digitales)

1. Crea una cuenta en https://stripe.com
2. Obtén tu `STRIPE_SECRET_KEY` desde el dashboard
3. Actualiza la variable `STRIPE_SECRET_KEY` en el archivo `.env`

### Paso 7: Iniciar el servidor

En la terminal, ejecuta:

```bash
pnpm dev
```

Debe aparecer un mensaje como este:

```
Parqueo Inteligente API Server running on port 3005
Health check: http://localhost:3005/api/v1/health
```

¡Listo! El servidor está funcionando.

## Rutas principales de la API

### Autenticación
- `POST /api/v1/auth/register` - Crear una nueva cuenta
- `POST /api/v1/auth/login` - Iniciar sesión
- `POST /api/v1/auth/verify-email` - Verificar correo electrónico
- `POST /api/v1/auth/forgot-password` - Solicitar recuperación de contraseña
- `POST /api/v1/auth/reset-password` - Cambiar contraseña

### Estacionamiento
- `GET /api/v1/parking` - Ver todos los espacios disponibles
- `POST /api/v1/parking/reservations` - Crear una reserva
- `GET /api/v1/parking/reservations/:id` - Ver detalles de una reserva
- `PUT /api/v1/parking/reservations/:id` - Actualizar una reserva
- `DELETE /api/v1/parking/reservations/:id` - Cancelar una reserva

### Usuarios
- `GET /api/v1/users/profile` - Ver tu perfil
- `PUT /api/v1/users/profile` - Actualizar tu perfil
- `DELETE /api/v1/users/:id` - Eliminar tu cuenta

## Dudas o problemas

Si algo no funciona:

1. Verifica que PostgreSQL esté funcionando
2. Verifica que MongoDB esté funcionando
3. Revisa que el puerto 3005 no esté siendo usado por otra aplicación
4. Revisa que los datos en el archivo `.env` sean correctos
5. Verifica que tu conexión a Stripe esté configurada correctamente

¡Eso es todo! Ya puedes empezar a desarrollar o usar la aplicación.
