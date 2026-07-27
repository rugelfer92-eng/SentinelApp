# Script para generar PNG desde .puml usando PlantUML
# Uso: Ejecutar en PowerShell desde la raíz del proyecto
# Requisitos: Java instalado (java -version) y acceso a Internet para descargar plantuml.jar la primera vez

$plantumlJar = "$PSScriptRoot\..\tools\plantuml.jar"
$outputDir = "$PSScriptRoot\..\img\diagram"
$pumlDir = "$PSScriptRoot"

if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
    Write-Error "Java no está instalado o no está en PATH. Instala Java y vuelve a ejecutar."
    exit 1
}

# Crear carpeta tools si no existe
$toolsDir = Join-Path $PSScriptRoot '..\tools' | Resolve-Path -Relative | ForEach-Object { $_ }
if (-not (Test-Path (Join-Path $PSScriptRoot '..\tools'))) {
    New-Item -ItemType Directory -Path (Join-Path $PSScriptRoot '..\tools') | Out-Null
}

# Descargar plantuml.jar si no existe
if (-not (Test-Path $plantumlJar)) {
    Write-Output "Descargando plantuml.jar..."
    try {
        $url = 'https://plantuml.com/plantuml.jar'
        Invoke-WebRequest -Uri $url -OutFile $plantumlJar -UseBasicParsing
    } catch {
        Write-Error "No se pudo descargar plantuml.jar desde $url. Descarga manualmente y colócalo en docs/tools/plantuml.jar"
        exit 1
    }
}

# Crear directorio de salida si no existe
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

# Generar PNGs para cada .puml en docs/diagrams
Get-ChildItem -Path $pumlDir -Filter "*.puml" | ForEach-Object {
    $puml = $_.FullName
    Write-Output "Generando PNG para $($_.Name)..."
    java -jar $plantumlJar -tpng -o "$(Resolve-Path $outputDir)" $puml
}

Write-Output "Generación completada. PNGs guardados en $outputDir"