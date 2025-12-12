# 🍷👻 La Previa Maldita

> **Come, bebe y grita.**
> Una experiencia web inmersiva para la gestión de eventos de terror y gastronomía.

![Estado del Proyecto](https://img.shields.io/badge/Estado-Desarrollo-yellow)
![Licencia](https://img.shields.io/badge/Licencia-MIT-blue)

## 📖 Descripción

**La Previa Maldita** es una aplicación web conceptual diseñada para "Terror en el Campus", un evento que combina cine de terror con una experiencia gastronómica previa. 

El proyecto no es solo una landing page informativa, sino una **Single Page Application (SPA)** simulada que ofrece una experiencia de usuario gamificada e inmersiva. El objetivo es sumergir al usuario en la atmósfera del evento desde el primer clic, permitiéndole comprar entradas, adquirir productos temáticos y jugar minijuegos para obtener recompensas.

## ✨ Características Principales

### 🎟️ Sistema de Ticketing y Tienda
- **Selección de Tiers:** Diferenciación entre entradas "Mortal" (General) y "Demonio" (VIP) con precios dinámicos.
- **Carrito de Compras (Logic):** Implementación de un carrito funcional (`cartOverlay`) que permite añadir/eliminar productos y calcular el total en tiempo real.
- **Tienda de Items:** Sección de merchandising ("Máscara Macabra", "Elixir de Vida") integrada con el carrito.

### 🎮 Gamificación Integrada
- **Minijuego "Sobrevive":** Un juego tipo *Whack-a-Ghost* desarrollado en **Vanilla JavaScript** puro, que gestiona puntuaciones, intervalos de tiempo y eventos de clic dinámicos.
- **Sistema de Puntos:** Feedback visual inmediato al interactuar con los elementos del juego.

### 🤖 Asistente Virtual "El Oráculo"
- **Chatbot Interactivo:** Widget flotante que simula una conversación con respuestas aleatorias predefinidas (`botResponses`), añadiendo una capa de interacción narrativa.

### 🎨 UI/UX Inmersiva (Diseño y Animaciones)
- **Efectos Glitch:** Implementación de animaciones CSS avanzadas (`@keyframes`) para títulos y textos.
- **Modo Oscuro Temático:** Uso de variables CSS (`:root`) para una paleta de colores consistente (Negro, Rojo Sangre, Verde Espectral).
- **Tipografía Personalizada:** Integración de Google Fonts (*Creepster*, *Nosifer*) para reforzar la identidad visual.
- **Diseño Responsive:** Adaptable a dispositivos móviles y escritorio usando Flexbox y CSS Grid.

### 🔐 Simulación de Autenticación
- Modal de Login/Registro que manipula el DOM para cambiar el estado de la interfaz de usuario (de "Invitado" a "Usuario Registrado") sin necesidad de backend.

## 🛠️ Tecnologías Utilizadas

* ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white) **Estructura Semántica**
* ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white) **Estilos Avanzados (Grid, Flexbox, Animations)**
* ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black) **Lógica del Cliente (DOM, Arrays, Objects, Intervals)**

## 🚀 Instalación y Uso

Este proyecto es estático, por lo que no requiere instalación de dependencias ni servidores complejos.

1.  **Clonar el repositorio:**
    ```bash
    git clone [https://github.com/Luisparrach22/La_Previa_Maldita.git](https://github.com/Luisparrach22/La_Previa_Maldita.git)
    ```
2.  **Navegar a la carpeta:**
    ```bash
    cd La_Previa_Maldita
    ```
3.  **Ejecutar:**
    Simplemente abre el archivo `index.html` en tu navegador web favorito (Chrome, Firefox, Edge).

    > **Tip:** Para una mejor experiencia de desarrollo, se recomienda usar la extensión "Live Server" en VS Code.

## 📂 Estructura del Proyecto

```text
La_Previa_Maldita/
├── index.html      # Estructura principal y maquetación
├── styles.css      # Variables, animaciones y diseño responsive
├── script.js       # Lógica del juego, carrito, chat y modales
└── README.md       # Documentación del proyecto