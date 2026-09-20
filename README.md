Warlus CRM

Descripción



Warlus CRM es un sistema web orientado a la gestión de servicios de pintura y detailing de vehículos y aeronaves de Warlus Car Detailing. El proyecto forma parte de una propuesta de transformación digital y adopta prácticas DEVOPS para organizar el desarrollo, control de versiones, pruebas, despliegue y colaboración del equipo.



Objetivo



Desarrollar una solución CRM que permita centralizar la gestión de clientes, servicios, solicitudes, pedidos y procesos relacionados con las operaciones de Warlus Car Detailing.



Arquitectura



El sistema está organizado mediante una arquitectura basada en microservicios.



Los servicios definidos inicialmente son:



Auth: gestión de autenticación y acceso de usuarios.

Catálogo: administración de servicios y productos disponibles.

Pedidos: gestión de solicitudes y pedidos de los clientes.

Pagos: gestión de información relacionada con pagos.

Tecnologías

Git

GitHub

Docker

Docker Compose

PostgreSQL

Redis

Azure DevOps

Azure Boards

Azure Repos

Azure Pipelines

Azure Test Plans

Estructura del repositorio

warlus-crm/

├── src/

│   ├── auth/

│   ├── catalogo/

│   ├── pedidos/

│   └── pagos/

├── docs/

├── docker/

├── tests/

├── .gitignore

├── .env.example

└── README.md

Configuración



El proyecto dispone de un archivo .env.example que contiene las variables de entorno requeridas como referencia.



Para trabajar localmente se deberá crear un archivo .env basado en .env.example.



El archivo .env no debe almacenarse en GitHub.



Control de versiones



El código fuente se administra mediante Git y GitHub. Los cambios realizados por el equipo deberán registrarse mediante commits para mantener trazabilidad sobre el desarrollo del sistema.



DEVOPS



El proyecto integrará GitHub con Azure DevOps para gestionar:



Planificación mediante Azure Boards.

Repositorios mediante Azure Repos.

Integración continua mediante Azure Pipelines.

Gestión de pruebas mediante Azure Test Plans.

Estado del proyecto



Implementación DEVOPS 1 en desarrollo.

