from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", ""),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", ""),
    MAIL_FROM=os.getenv("MAIL_FROM", "info@lapreviamaldita.com"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=False
)

async def send_ticket_email(email_to: EmailStr, customer_name: str, ticket_codes: List[str]):
    """
    Simulación de envío de correo si no hay credenciales configuradas,
    o envío real si las hay.
    """
    
    # HTML Template simple para el correo
    html = f"""
    <div style="background-color: #000; color: #fff; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; border-bottom: 2px solid #b91c1c; padding-bottom: 10px;">
            <h1 style="color: #ef4444; margin: 0;">🎃 LA PREVIA MALDITA 🎃</h1>
        </div>
        
        <p>Saludos desde el inframundo, {customer_name}...</p>
        
        <p>Tu pacto ha sido sellado. Aquí tienes tus códigos de acceso para la noche del terror:</p>
        
        <div style="background-color: #111; padding: 15px; border-radius: 8px; border: 1px dashed #666; margin: 20px 0;">
            <ul style="list-style: none; padding: 0;">
                {''.join(f'<li style="font-size: 1.2em; color: #fbbf24; margin: 5px 0;">🎟️ {code}</li>' for code in ticket_codes)}
            </ul>
        </div>
        
        <p>Presenta estos códigos (o tu alma) en la entrada.</p>
        
        <p style="font-size: 0.8em; color: #888; margin-top: 30px;">
            No respondas a este correo... los muertos no leen.
        </p>
    </div>
    """

    message = MessageSchema(
        subject="🎟️ Tus Tickets para La Previa Maldita",
        recipients=[email_to],
        body=html,
        subtype=MessageType.html
    )

    # Si no tenemos configuración real, solo imprimimos en consola
    if not os.getenv("MAIL_USERNAME") or "tu_email" in os.getenv("MAIL_USERNAME"):
        print("\n" + "="*50)
        print(f"📧 [SIMULACIÓN EMAIL] Enviando a: {email_to}")
        print(f"Asunto: Tus Tickets para La Previa Maldita")
        print("Contenido: (HTML Generado)")
        print("="*50 + "\n")
        return

    try:
        fm = FastMail(conf)
        await fm.send_message(message)
    except Exception as e:
        print(f"❌ Error enviando email: {e}")


async def send_welcome_email(email_to: EmailStr, username: str):
    """
    Envía un correo de bienvenida al nuevo usuario.
    """
    
    html = f"""
    <div style="background-color: #050505; color: #e0e0e0; padding: 20px; font-family: 'Courier New', monospace; border: 1px solid #333;">
        <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #bb0a1e; font-size: 2em; margin: 0; text-shadow: 2px 2px 4px #000;">👻 BIENVENIDO AL CULTO 👻</h1>
        </div>
        
        <p>Hola, {username}...</p>
        
        <p>Tu alma ha sido registrada exitosamente en nuestros libros oscuros. Ya eres parte oficial de <strong>La Previa Maldita</strong>.</p>
        
        <p>Desde ahora puedes:</p>
        <ul style="color: #aaa;">
            <li>Jugar para ganar almas (y quizás perder la cordura).</li>
            <li>Canjear esas almas por bebidas y merchandising.</li>
            <li>Adquirir tus tickets para el evento principal.</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5500" style="background-color: #bb0a1e; color: #fff; padding: 10px 20px; text-decoration: none; font-weight: bold; border-radius: 5px;">ENTRAR A LA PESADILLA</a>
        </div>
        
        <p style="font-size: 0.8em; color: #666; margin-top: 30px; border-top: 1px solid #333; padding-top: 10px;">
            Si no te has registrado tú... entonces alguien ha vendido tu alma por ti.
        </p>
    </div>
    """

    message = MessageSchema(
        subject="👻 Bienvenido al Culto - La Previa Maldita",
        recipients=[email_to],
        body=html,
        subtype=MessageType.html
    )

    # Simulación si no hay credenciales
    if not os.getenv("MAIL_USERNAME") or "tu_email" in os.getenv("MAIL_USERNAME"):
        print("\n" + "="*50)
        print(f"📧 [SIMULACIÓN EMAIL WELCOME] Enviando a: {email_to}")
        print(f"Asunto: Bienvenido al Culto")
        print("Contenido: (HTML Generado)")
        print("="*50 + "\n")
        return

    try:
        fm = FastMail(conf)
        await fm.send_message(message)
    except Exception as e:
        print(f"❌ Error enviando email de bienvenida: {e}")

