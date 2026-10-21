import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import Config
from app.extensions import db
from app.models.email_log import EmailLog
from app.utils.datetime_helper import utc_now

def send_smtp_email(to_email: str, subject: str, html_content: str, text_content: str = None) -> bool:
    """
    Sends an email via SMTP. Returns True on success, False or raises on error.
    """
    if not Config.SMTP_USER or not Config.SMTP_PASSWORD:
        # SMTP credentials not configured (simulation mode for local dev)
        print(f"[SMTP SIMULATION] Email to {to_email} | Subject: {subject}")
        return True

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = Config.SMTP_DEFAULT_SENDER
    msg['To'] = to_email

    if text_content:
        msg.attach(MIMEText(text_content, 'plain'))
    if html_content:
        msg.attach(MIMEText(html_content, 'html'))

    server = smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT, timeout=10)
    try:
        if Config.SMTP_USE_TLS:
            server.starttls()
        server.login(Config.SMTP_USER, Config.SMTP_PASSWORD)
        server.sendmail(Config.SMTP_DEFAULT_SENDER, [to_email], msg.as_string())
        return True
    finally:
        try:
            server.quit()
        except Exception:
            pass


def send_notification_with_retry(announcement_id: int, user_id: int, to_email: str, subject: str, content: str) -> dict:
    """
    Attempts to send email notification with up to 3 retry attempts.
    Records the outcome in the email_logs table.
    """
    html_body = f"""
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #1a73e8;">Notifikasi SIOMAS</h2>
        <h3>{subject}</h3>
        <p>{content}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <small style="color: #777;">Pesan otomatis dari Sistem Informasi Organisasi Mahasiswa (SIOMAS).</small>
    </div>
    """

    success = False
    last_attempt = 1

    for attempt in range(1, 4):
        last_attempt = attempt
        try:
            success = send_smtp_email(to_email, subject, html_body, text_content=content)
            if success:
                break
        except Exception as e:
            print(f"[SMTP ATTEMPT {attempt} FAILED] {to_email}: {str(e)}")
            success = False

    status = 'Terkirim' if success else 'Gagal'

    try:
        log_entry = EmailLog(
            Announcement_ID=announcement_id,
            User_ID=user_id,
            Attempt_Number=last_attempt,
            Sent_At=utc_now(),
            Status_Pengiriman=status
        )
        db.session.add(log_entry)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"[EMAIL LOG DB ERROR] {str(e)}")

    return {
        "status": status,
        "attempts": last_attempt,
        "recipient": to_email
    }
