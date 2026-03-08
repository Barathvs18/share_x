from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse, Response
from utils.auth import get_current_user
from database import file_collection, share_collection, user_collection, logs_collection
from utils.hashing import generate_sha256_bytes
from models import ShareSchema, RevokeSchema, VerifySchema
import os, mimetypes, base64
from datetime import datetime, timezone
from bson import ObjectId

router = APIRouter()

# ─── Audit Log Helper ────────────────────────────────────────────────────────
async def log_event(
    action: str,
    file_id: str,
    actor_email: str,
    filename: str = "",
    extra: dict = None
):
    """
    Inserts one activity-log document into `file_logs` collection.
    action      – e.g. 'upload', 'view', 'download', 'share', 'revoke', 'verify', 'delete'
    file_id     – string ObjectId of the file
    actor_email – who triggered the action
    filename    – human-readable filename for display
    extra       – optional dict with additional context (e.g. shared_with_email)
    """
    await logs_collection.insert_one({
        "file_id":     file_id,
        "filename":    filename,
        "action":      action,
        "actor_email": actor_email,
        "timestamp":   datetime.now(timezone.utc).isoformat(),
        "extra":       extra or {}
    })

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
    file_id_str = str(result.inserted_id)

    # ── Audit log ────────────────────────────────────────────────────────────
    await log_event(
        action="upload",
        file_id=file_id_str,
        actor_email=current_user["email"],
        filename=file.filename,
        extra={"size_bytes": len(file_bytes), "hash": file_hash}
    )

    return {
        "message": "File uploaded successfully",
        "file_id": file_id_str,
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
        "is_active": True,
        "can_download": share_data.can_download  # True = download allowed, False = view/verify only
    }
    await share_collection.update_one(
        {"file_id": share_data.file_id, "shared_with_email": share_data.shared_with_email},
        {"$set": share_record},
        upsert=True
    )
    # ── Audit log ────────────────────────────────────────────────────────────
    await log_event(
        action="share",
        file_id=share_data.file_id,
        actor_email=current_user["email"],
        filename=file_doc.get("filename", ""),
        extra={
            "shared_with_email": share_data.shared_with_email,
            "can_download": share_data.can_download,
            "expiry_time": share_data.expiry_time
        }
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

    # ── Audit log ────────────────────────────────────────────────────────────
    await log_event(
        action="revoke",
        file_id=revoke_data.file_id,
        actor_email=current_user["email"],
        extra={"revoked_user_email": revoke_data.revoked_user_email}
    )
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
        stored_filename = file_doc.get("stored_filename")
        file_path = os.path.join(UPLOAD_DIR, stored_filename) if stored_filename else file_doc.get("path", "")
        with open(file_path, "rb") as f:
            file_bytes = f.read()
        current_hash = generate_sha256_bytes(file_bytes)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File data missing from server")

    is_authentic = current_hash == file_doc["hash"]

    # ── Audit log ────────────────────────────────────────────────────────────
    await log_event(
        action="verify",
        file_id=str(file_doc["_id"]),
        actor_email=current_user["email"],
        filename=file_doc.get("filename", ""),
        extra={"is_authentic": is_authentic}
    )

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


@router.get("/myshares")
async def get_my_shares(current_user: dict = Depends(get_current_user)):
    """Return all active share records for files owned by the current user."""
    cursor = share_collection.find({
        "owner_email": current_user["email"],
        "is_active": True
    })
    shares = [serialize_doc(doc) for doc in await cursor.to_list(length=200)]
    return {"shares": shares}


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
            # Check if the owner restricted this share to view-only
            if not share_rec.get("can_download", True):
                raise HTTPException(
                    status_code=403,
                    detail="Download not permitted. The owner shared this file as view-only."
                )

    if not has_access:
        raise HTTPException(status_code=403, detail="Not authorized to download this file")

    # Reconstruct path from stored_filename — more reliable than the saved path field
    # (saved path can be stale if server was moved or restarted from a different directory)
    stored_filename = file_doc.get("stored_filename")
    if stored_filename:
        file_path = os.path.join(UPLOAD_DIR, stored_filename)
    else:
        file_path = file_doc.get("path", "")  # fallback for very old records

    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File data missing from server")

    # ── Audit log ────────────────────────────────────────────────────────────
    await log_event(
        action="download",
        file_id=file_id,
        actor_email=current_user["email"],
        filename=file_doc.get("filename", ""),
        extra={"is_owner": file_doc["owner_email"] == current_user["email"]}
    )

    return FileResponse(
        path=file_path,
        filename=file_doc["filename"],
        media_type="application/octet-stream"
    )


# ─── Protected Inline Viewer ─────────────────────────────────────────────────
@router.get("/view/{file_id}")
async def view_file(
    file_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Returns file content as base64 for in-browser viewing.
    Accessible to file owner OR anyone with an active share (view-only or download).
    The frontend is responsible for anti-screenshot UX.
    """
    try:
        file_oid = ObjectId(file_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid file_id format")

    file_doc = await file_collection.find_one({"_id": file_oid})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")

    # Check access
    is_owner = file_doc["owner_email"] == current_user["email"]
    can_download = True  # owner can always do everything

    if not is_owner:
        share_rec = await share_collection.find_one({
            "file_id": file_id,
            "shared_with_email": current_user["email"],
            "is_active": True
        })
        now_ts = datetime.now(timezone.utc).timestamp()
        if not share_rec or share_rec["expiry_time"] <= now_ts:
            raise HTTPException(status_code=403, detail="Not authorized to view this file")
        can_download = share_rec.get("can_download", True)

    # Resolve file path
    stored_filename = file_doc.get("stored_filename")
    file_path = os.path.join(UPLOAD_DIR, stored_filename) if stored_filename else file_doc.get("path", "")

    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File data missing from server")

    # Read and encode as base64
    with open(file_path, "rb") as f:
        file_bytes = f.read()

    mime_type, _ = mimetypes.guess_type(file_doc["filename"])
    if not mime_type:
        mime_type = "application/octet-stream"

    # ── Audit log ────────────────────────────────────────────────────────────
    await log_event(
        action="view",
        file_id=file_id,
        actor_email=current_user["email"],
        filename=file_doc.get("filename", ""),
        extra={"is_owner": is_owner, "can_download": can_download}
    )

    return {
        "filename": file_doc["filename"],
        "mime_type": mime_type,
        "content_b64": base64.b64encode(file_bytes).decode("utf-8"),
        "can_download": can_download,
        "viewer_email": current_user["email"],
        "size": len(file_bytes),
    }


# ─── Delete File ──────────────────────────────────────────────────────────────
@router.delete("/delete/{file_id}")
async def delete_file(
    file_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Permanently deletes a file. Only the owner can delete.
    - Removes the physical file from disk
    - Deletes all share records for this file
    - Removes the file document from MongoDB
    """
    try:
        file_oid = ObjectId(file_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid file_id format")

    file_doc = await file_collection.find_one({"_id": file_oid})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")

    # Only the owner can delete
    if file_doc["owner_email"] != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this file")

    # Remove physical file from disk
    stored_filename = file_doc.get("stored_filename")
    file_path = os.path.join(UPLOAD_DIR, stored_filename) if stored_filename else file_doc.get("path", "")
    if file_path and os.path.exists(file_path):
        os.remove(file_path)

    # ── Audit log (before deletion so filename is still available) ───────────
    await log_event(
        action="delete",
        file_id=file_id,
        actor_email=current_user["email"],
        filename=file_doc.get("filename", ""),
        extra={"size_bytes": file_doc.get("size", 0)}
    )

    # Remove all share records associated with this file
    await share_collection.delete_many({"file_id": file_id})

    # Remove the file document from MongoDB
    await file_collection.delete_one({"_id": file_oid})

    return {"message": "File deleted successfully"}


# ─── File Activity Logs (Owner Only) ─────────────────────────────────────────
@router.get("/logs/{file_id}")
async def get_file_logs(
    file_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Returns the full activity log for a specific file.
    Only the file owner can access logs.
    """
    try:
        file_oid = ObjectId(file_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid file_id format")

    file_doc = await file_collection.find_one({"_id": file_oid})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")

    if file_doc["owner_email"] != current_user["email"]:
        raise HTTPException(status_code=403, detail="Only the file owner can view activity logs")

    cursor = logs_collection.find(
        {"file_id": file_id},
        sort=[("timestamp", -1)],   # newest first
        limit=200
    )
    logs = [serialize_doc(doc) for doc in await cursor.to_list(length=200)]
    return {"file_id": file_id, "filename": file_doc["filename"], "logs": logs}


@router.get("/alllogs")
async def get_all_my_file_logs(
    current_user: dict = Depends(get_current_user)
):
    """
    Returns a combined activity log for ALL files owned by the current user.
    Sorted by newest first.
    """
    # 1. Get all file IDs owned by this user
    cursor = file_collection.find(
        {"owner_email": current_user["email"]},
        {"_id": 1}
    )
    owned = await cursor.to_list(length=500)
    owned_ids = [str(doc["_id"]) for doc in owned]

    if not owned_ids:
        return {"logs": []}

    # 2. Fetch logs for those file IDs
    log_cursor = logs_collection.find(
        {"file_id": {"$in": owned_ids}},
        sort=[("timestamp", -1)],
        limit=500
    )
    logs = [serialize_doc(doc) for doc in await log_cursor.to_list(length=500)]
    return {"logs": logs}
