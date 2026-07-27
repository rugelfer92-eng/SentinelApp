Carpeta de salida para diagramas PNG

Este directorio contendrá los PNG generados a partir de los archivos PlantUML en `docs/diagrams`.

Cómo generar los PNG (PowerShell):

1. Abre PowerShell en la raíz del proyecto `c:\SentinelApp`.
2. Ejecuta:

```powershell
cd docs/diagrams
.\generate_pngs.ps1
```

El script intentará descargar `plantuml.jar` a `docs/tools/plantuml.jar` (la primera vez) y generará los PNG en `docs/img/diagram`.

Requisitos:
- Java instalado (`java -version` debe funcionar).
- Acceso a Internet para descargar `plantuml.jar` la primera vez.

Si no quieres usar el script, puedes instalar PlantUML localmente y ejecutar:

```powershell
java -jar docs/tools/plantuml.jar -tpng -o docs/img/diagram docs/diagrams/*.puml
```
