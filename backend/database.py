from motor.motor_asyncio import AsyncIOMotorClient
import os
import ssl
from dotenv import load_dotenv

load_dotenv()

MONGO_DETAILS = os.getenv("MONGO_URL", "mongodb://localhost:27017")

# Create a TLS context that is compatible with older OpenSSL versions
tls_context = ssl.create_default_context()
tls_context.check_hostname = False
tls_context.verify_mode = ssl.CERT_NONE

client = AsyncIOMotorClient(
    MONGO_DETAILS,
    tls=True,
    tlsAllowInvalidCertificates=True,   # Fixes TLS handshake errors on some systems
)

database = client.secure_file_share
user_collection = database.get_collection("users")
file_collection = database.get_collection("files")
share_collection = database.get_collection("shares")
logs_collection  = database.get_collection("file_logs")
