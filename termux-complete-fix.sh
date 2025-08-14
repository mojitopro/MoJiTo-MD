
#!/bin/bash

# MoJiTo-MD Bot - Instalación Completa para Termux con Estética Hacker
# Script mejorado con animaciones, gradientes y manejo de señales

# Configurar manejo de señales para evitar cuelgues
trap 'echo -e "\n🚫 Instalación cancelada por el usuario"; exit 1' INT TERM

# Colores y efectos para estética hacker
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[0;37m'
GRAY='\033[0;90m'
BOLD='\033[1m'
DIM='\033[2m'
BLINK='\033[5m'
NC='\033[0m' # No Color

# Gradientes ASCII para efecto hacker
GRADIENT1='\033[38;5;196m'  # Rojo intenso
GRADIENT2='\033[38;5;202m'  # Naranja rojo
GRADIENT3='\033[38;5;208m'  # Naranja
GRADIENT4='\033[38;5;214m'  # Naranja amarillo
GRADIENT5='\033[38;5;220m'  # Amarillo
GRADIENT6='\033[38;5;226m'  # Amarillo brillante

# Función para limpiar pantalla con efecto
clear_screen() {
    printf "\033c"
    sleep 0.1
}

# Función de animación de carga
loading_animation() {
    local duration=$1
    local message=$2
    local chars="⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"
    local i=0
    
    while [ $i -lt $duration ]; do
        for (( j=0; j<${#chars}; j++ )); do
            echo -ne "\r${CYAN}${chars:$j:1} ${message}${NC}"
            sleep 0.1
        done
        ((i++))
    done
    echo ""
}

# Banner de inicio con gradiente
show_hacker_banner() {
    clear_screen
    echo -e "${GRADIENT1}
    ████████████████████████████████████████████████████████████████
    ${GRADIENT2}██                                                            ██
    ${GRADIENT3}██  ███╗   ███╗ ██████╗      ██╗██╗████████╗ ██████╗       ██
    ${GRADIENT4}██  ████╗ ████║██╔═══██╗     ██║██║╚══██╔══╝██╔═══██╗      ██
    ${GRADIENT5}██  ██╔████╔██║██║   ██║     ██║██║   ██║   ██║   ██║      ██
    ${GRADIENT6}██  ██║╚██╔╝██║██║   ██║██   ██║██║   ██║   ██║   ██║      ██
    ${GRADIENT5}██  ██║ ╚═╝ ██║╚██████╔╝╚█████╔╝██║   ██║   ╚██████╔╝      ██
    ${GRADIENT4}██  ╚═╝     ╚═╝ ╚═════╝  ╚════╝ ╚═╝   ╚═╝    ╚═════╝       ██
    ${GRADIENT3}██                                                            ██
    ${GRADIENT2}██            TERMUX INSTALLATION SYSTEM                      ██
    ${GRADIENT1}████████████████████████████████████████████████████████████████
    ${NC}"
    echo ""
    echo -e "${BLINK}${RED}⚠️  INICIANDO PROTOCOLO DE INSTALACIÓN HACKER  ⚠️${NC}"
    echo -e "${DIM}${GRAY}[SISTEMA] Preparando entorno de combate para Termux...${NC}"
    echo ""
    
    # Animación de inicialización
    echo -e "${YELLOW}${BOLD}► INICIALIZANDO SISTEMAS...${NC}"
    loading_animation 3 "Escaneando vulnerabilidades del sistema"
    echo -e "${GREEN}✓ Sistema vulnerable detectado - Procediendo con la infección${NC}"
    echo ""
}

# Función para mostrar progreso con barra
show_progress() {
    local step=$1
    local total=$2
    local message=$3
    local percent=$((step * 100 / total))
    local filled=$((percent / 2))
    local empty=$((50 - filled))
    
    echo -ne "\r${BOLD}${CYAN}["
    printf "%*s" $filled | tr ' ' '█'
    printf "%*s" $empty | tr ' ' '░'
    echo -ne "] ${percent}% ${message}${NC}"
    
    if [ $step -eq $total ]; then
        echo ""
    fi
}

# Función para ejecutar comandos con manejo de señales
safe_execute() {
    local command=$1
    local description=$2
    
    echo -e "${YELLOW}${BOLD}► EJECUTANDO: ${description}${NC}"
    echo -e "${DIM}${GRAY}  CMD: ${command}${NC}"
    
    # Ejecutar comando en background y capturar PID
    eval "$command" &
    local cmd_pid=$!
    
    # Mostrar animación mientras el comando se ejecuta
    while kill -0 $cmd_pid 2>/dev/null; do
        echo -ne "\r${CYAN}⚡ Procesando... ${NC}"
        for i in {1..3}; do
            echo -ne "."
            sleep 0.3
        done
        echo -ne "\r                    \r"
    done
    
    # Esperar a que termine y obtener código de salida
    wait $cmd_pid
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✓ COMPLETADO: ${description}${NC}"
    else
        echo -e "${RED}✗ FALLÓ: ${description}${NC}"
        echo -e "${YELLOW}  Continuando con el siguiente paso...${NC}"
    fi
    
    return $exit_code
}

# Función principal de instalación
main_installation() {
    local total_steps=8
    local current_step=0
    
    # Paso 1: Configurar variables de entorno
    ((current_step++))
    show_progress $current_step $total_steps "Configurando matriz de control"
    sleep 1
    
    export NODE_OPTIONS="--max-old-space-size=512"
    export TERMUX=1
    export TERM=xterm-256color
    export COLORTERM=truecolor
    
    echo -e "${GREEN}✓ Variables de entorno hackeadas exitosamente${NC}"
    echo ""
    
    # Paso 2: Reparar package.json
    ((current_step++))
    show_progress $current_step $total_steps "Infiltrando package.json"
    
    if [ -f "termux-fix-package.sh" ]; then
        safe_execute "timeout 30 bash termux-fix-package.sh" "Reparación de package.json"
    else
        echo -e "${YELLOW}⚠️ termux-fix-package.sh no encontrado, saltando...${NC}"
    fi
    echo ""
    
    # Paso 3: Configurar npm
    ((current_step++))
    show_progress $current_step $total_steps "Comprometiendo NPM"
    
    safe_execute "npm config delete build-from-source 2>/dev/null || true" "Eliminando configuraciones conflictivas"
    safe_execute "npm config delete optional 2>/dev/null || true" "Limpiando configuración NPM"
    echo ""
    
    # Paso 4: Limpiar instalaciones previas
    ((current_step++))
    show_progress $current_step $total_steps "Eliminando evidencia previa"
    
    safe_execute "rm -rf node_modules" "Eliminando node_modules"
    safe_execute "rm -rf package-lock.json" "Eliminando package-lock"
    safe_execute "npm cache clean --force" "Limpiando cache NPM"
    echo ""
    
    # Paso 5: Instalar dependencias críticas
    ((current_step++))
    show_progress $current_step $total_steps "Inyectando dependencias críticas"
    
    echo -e "${RED}${BOLD}⚠️ FASE CRÍTICA - NO INTERRUMPIR ⚠️${NC}"
    loading_animation 2 "Preparando payload principal"
    
    safe_execute "timeout 180 npm install --omit=optional --ignore-scripts --no-audit --no-fund --force" "Instalación de dependencias"
    echo ""
    
    # Paso 6: Verificar Baileys específicamente
    ((current_step++))
    show_progress $current_step $total_steps "Verificando conexión WhatsApp"
    
    if ! npm list @whiskeysockets/baileys >/dev/null 2>&1; then
        safe_execute "timeout 60 npm install @whiskeysockets/baileys@6.7.18 --force" "Instalando Baileys"
    fi
    echo ""
    
    # Paso 7: Verificar archivos críticos
    ((current_step++))
    show_progress $current_step $total_steps "Verificando integridad del sistema"
    
    local files_ok=true
    
    if [ -f "start-termux.js" ]; then
        echo -e "${GREEN}✓ Launcher detectado${NC}"
    else
        echo -e "${RED}✗ Launcher no encontrado${NC}"
        files_ok=false
    fi
    
    if [ -d "node_modules" ]; then
        echo -e "${GREEN}✓ Módulos instalados${NC}"
    else
        echo -e "${RED}✗ Módulos faltantes${NC}"
        files_ok=false
    fi
    
    if [ -f "server/index.js" ] || [ -f "server/index.ts" ]; then
        echo -e "${GREEN}✓ Servidor encontrado${NC}"
    else
        echo -e "${RED}✗ Servidor no encontrado${NC}"
        files_ok=false
    fi
    echo ""
    
    # Paso 8: Finalización
    ((current_step++))
    show_progress $current_step $total_steps "Finalizando infiltración"
    
    loading_animation 2 "Activando sistemas de combate"
    
    # Banner de éxito
    clear_screen
    echo -e "${GRADIENT1}
    ████████████████████████████████████████████████████████████████
    ${GRADIENT2}██                                                            ██
    ${GRADIENT3}██                   ✅ MISIÓN COMPLETADA ✅                  ██
    ${GRADIENT4}██                                                            ██
    ${GRADIENT5}██            MOJITO-MD LISTO PARA EL COMBATE                ██
    ${GRADIENT6}██                                                            ██
    ${GRADIENT5}██  🔥 Sistema infiltrado exitosamente                       ██
    ${GRADIENT4}██  ⚡ Dependencias cargadas                                  ██
    ${GRADIENT3}██  🚀 Launcher armado y listo                               ██
    ${GRADIENT2}██  💥 Bot preparado para dominar WhatsApp                   ██
    ${GRADIENT1}████████████████████████████████████████████████████████████████
    ${NC}"
    
    echo ""
    echo -e "${BLINK}${GREEN}🎯 TODOS LOS SISTEMAS OPERATIVOS${NC}"
    echo ""
    echo -e "${BOLD}${YELLOW}📋 COMANDOS DE COMBATE:${NC}"
    echo -e "${CYAN}   🚀 ${BOLD}node start-termux.js${NC}     - Launcher optimizado"
    echo -e "${CYAN}   ⚡ ${BOLD}npm run dev${NC}              - Modo desarrollo"
    echo -e "${CYAN}   🔧 ${BOLD}node server/index.js${NC}     - Ejecución directa"
    echo ""
    
    if [ "$files_ok" = true ]; then
        echo -e "${GREEN}${BOLD}✅ INSTALACIÓN COMPLETADA - SISTEMA COMPROMETIDO EXITOSAMENTE${NC}"
        echo -e "${YELLOW}💡 Tip: El bot detectará automáticamente que está en Termux y aplicará optimizaciones${NC}"
    else
        echo -e "${RED}${BOLD}⚠️ INSTALACIÓN CON ADVERTENCIAS - REVISAR LOGS${NC}"
        echo -e "${YELLOW}💡 Algunos componentes pueden faltar, pero el sistema debería funcionar${NC}"
    fi
    
    echo ""
    echo -e "${DIM}${GRAY}[SISTEMA] Protocolo de instalación finalizado - Aguardando órdenes...${NC}"
}

# Verificar que estamos en Termux
if [[ ! "$PREFIX" == *"com.termux"* ]] && [[ ! "$TERMUX_VERSION" ]]; then
    clear_screen
    echo -e "${RED}${BOLD}⚠️ ALERTA DE SEGURIDAD ⚠️${NC}"
    echo ""
    echo -e "${YELLOW}Este script está optimizado específicamente para Termux.${NC}"
    echo -e "${CYAN}Detectamos que no estás en un entorno Termux.${NC}"
    echo ""
    echo -e "${WHITE}¿Deseas continuar de todos modos? (y/N):${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo -e "${RED}Instalación cancelada por el usuario.${NC}"
        exit 1
    fi
fi

# Ejecutar instalación principal
show_hacker_banner
sleep 2
main_installation

# Mensaje final
echo ""
echo -e "${BLINK}${PURPLE}🎭 MoJiTo-MD Bot - Listo para conquistar WhatsApp 🎭${NC}"
echo ""
