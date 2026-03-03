from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse
from utils.auth import get_current_user
from database import file_collection, share_collection, user_collection
from utils.hashing import generate_sha256_bytes
from models import ShareSchema, RevokeSchema, VerifySchema
import os
from datetime import datetime, timezone
from bson import ObjectId

router = APIRouter()

# Use absolute path anchored to this file's directory to avoid CWD issues
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def serialize_doc(doc: dict) -> dict:
    """Convert MongoDB document to a JSON-serializable dict."""
    if not doc:
        return doc
    result = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, datetime):
            result[key] = value.isoformat()
        else:
            result[key] = value
    return result


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    file_bytes = await file.read()

    # 50 MB limit
    if len(file_bytes) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max limit is 50MB.")

    file_hash = generate_sha256_bytes(file_bytes)

    # Save physical file with a unique name to avoid collisions
    safe_filename = f"{ObjectId()}_{file.filename}"
    file_location = os.path.join(UPLOAD_DIR, safe_filename)
    with open(file_location, "wb") as f:
        f.write(file_bytes)

    file_data = {
        "filename": file.filename,
        "stored_filename": safe_filename,
        "path": file_location,
        "hash": file_hash,
        "owner_email": current_user["email"],
        "size": len(file_bytes),
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }

    result = await file_collection.insert_one(file_data)
    return {
        "message": "File uploaded successfully",
        "file_id": str(result.inserted_id),
        "file_hash": file_hash
    }


@router.post("/share")
async def share_file(
    share_data: ShareSchema,
    current_user: dict = Depends(get_current_user)
):
    # Validate ObjectId format
    try:
        file_oid = ObjectId(share_data.file_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid file_id format")

    file_doc = await file_collection.find_one({"_id": file_oid, "owner_email": current_user["email"]})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found or you are not the owner")

    target_user = await user_collection.find_one({"email": share_data.shared_with_email})
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")

    if share_data.shared_with_email == current_user["email"]:
        raise HTTPException(status_code=400, detail="Cannot share a file with yourself")

    now_ts = datetime.now(timezone.utc).timestamp()
    if share_data.expiry_time <= now_ts:
        raise HTTPException(status_code=400, detail="Expiry time must be in the future")

    share_record = {
        "file_id": share_data.file_id,
        "owner_email": current_user["email"],
        "shared_with_email": share_data.shared_with_email,
        "expiry_time": share_data.expiry_time,
        "filename": file_doc["filename"],
        "is_active": True
    }
    await share_collection.update_one(
        {"file_id": share_data.file_id, "shared_with_email": share_data.shared_with_email},
        {"$set": share_record},
        upsert=True
    )
    return {"message": "File shared successfully"}


@router.post("/revoke")
async def revoke_file(
    revoke_data: RevokeSchema,
    current_user: dict = Depends(get_current_user)
):
    result = await share_collection.update_one(
        {
            "file_id": revoke_data.file_id,
            "shared_with_email": revoke_data.revoked_user_email,
            "owner_email": current_user["email"]
        },
        {"$set": {"is_active": False, "expiry_time": 0}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Share record not found")
    return {"message": "Access revoked successfully"}


@router.post("/verify")
async def verify_file(
    verify_data: VerifySchema,
    current_user: dict = Depends(get_current_user)
):
    try:
        file_oid = ObjectId(verify_data.file_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid file_id format")

    file_doc = await file_collection.find_one({"_id": file_oid})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")

    # Check access: owner OR active valid share
    has_access = False
    if file_doc["owner_email"] == current_user["email"]:
        has_access = True
    else:
        share_rec = await share_collection.find_one({
            "file_id": verify_data.file_id,
            "shared_with_email": current_user["email"],
            "is_active": True
        })
        now_ts = datetime.now(timezone.utc).timestamp()
        if share_rec and share_rec["expiry_time"] > now_ts:
            has_access = True

    if not has_access:
        raise HTTPException(status_code=403, detail="Not authorized to verify this file")

    try:
        with open(file_doc["path"], "rb") as f:
            file_bytes = f.read()
        current_hash = generate_sha256_bytes(file_bytes)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File data missing from server")

    is_authentic = current_hash == file_doc["hash"]

    return {
        "file_id": str(file_doc["_id"]),
        "filename": file_doc["filename"],
        "original_hash": file_doc["hash"],
        "current_hash": current_hash,
        "is_authentic_on_server": is_authentic
    }


@router.get("/myfiles")
async def get_my_files(current_user: dict = Depends(get_current_user)):
    cursor = file_collection.find({"owner_email": current_user["email"]})
    files = [serialize_doc(doc) for doc in await cursor.to_list(length=100)]
    return {"files": files}


@router.get("/shared")
async def get_shared_files(current_user: dict = Depends(get_current_user)):
    now_ts = datetime.now(timezone.utc).timestamp()
    cursor = share_collection.find({
        "shared_with_email": current_user["email"],
        "is_active": True,
        "expiry_time": {"$gt": now_ts}
    })
    shares = [serialize_doc(doc) for doc in await cursor.to_list(length=100)]
    return {"shared_files": shares}


@router.get("/download/{file_id}")
async def download_file(
    file_id: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        file_oid = ObjectId(file_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid file_id format")

    file_doc = await file_collection.find_one({"_id": file_oid})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")

    # Check access: owner OR active valid share
    has_access = False
    if file_doc["owner_email"] == current_user["email"]:
        has_access = True
    else:
        share_rec = await share_collection.find_one({
            "file_id": file_id,
            "shared_with_email": current_user["email"],
            "is_active": True
        })
        now_ts = datetime.now(timezone.utc).timestamp()
        if share_rec and share_rec["expiry_time"] > now_ts:
            has_access = True

    if not has_access:
        raise HTTPException(status_code=403, detail="Not authorized to download this file")

    file_path = file_doc.get("path")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File data missing from server")

    return FileResponse(
        path=file_path,
        filename=file_doc["filename"],
        media_type="application/octet-stream"
    )
