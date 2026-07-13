"""
backend/routes/upload.py
R2 Upload endpoint for design PNGs and other files
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
import boto3
import os
import uuid
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["upload"])

# Configure Cloudflare R2
R2_ENDPOINT = os.getenv("R2_ENDPOINT_URL")  # e.g., https://abc123.r2.cloudflarestorage.com
R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_BUCKET = os.getenv("R2_BUCKET_NAME", "swapmyface")
R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL")  # e.g., https://pub-xxxxx.r2.dev

# Initialize S3 client (R2 is S3-compatible)
s3_client = boto3.client(
    's3',
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    region_name='auto'
)

@router.post("/upload-to-r2")
async def upload_to_r2(
    file: UploadFile = File(...),
    file_type: str = "design"  # "design", "photo", "cutout"
):
    """
    Upload file to Cloudflare R2
    
    Args:
        file: The file to upload (PNG, JPG, etc)
        file_type: Type of file (design, photo, cutout) for folder organization
    
    Returns:
        {"url": "https://r2.dev/orders/design-123.png"}
    """
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Check file size (max 20MB)
        file_content = await file.read()
        if len(file_content) > 20 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large (max 20MB)")
        
        # Generate unique filename
        file_ext = file.filename.split('.')[-1]
        unique_id = str(uuid.uuid4())[:8]
        timestamp = datetime.utcnow().strftime("%Y%m%d")
        
        # Organize by type
        if file_type == "design":
            s3_key = f"orders/{timestamp}/design-{unique_id}.png"
        elif file_type == "photo":
            s3_key = f"uploads/{timestamp}/photo-{unique_id}.{file_ext}"
        elif file_type == "cutout":
            s3_key = f"uploads/{timestamp}/cutout-{unique_id}.png"
        else:
            s3_key = f"uploads/{timestamp}/{file.filename}"
        
        # Upload to R2
        logger.info(f"Uploading {file_type} to R2: {s3_key}")
        
        s3_client.put_object(
            Bucket=R2_BUCKET,
            Key=s3_key,
            Body=file_content,
            ContentType=file.content_type
        )
        
        # Generate public URL
        public_url = f"{R2_PUBLIC_URL}/{s3_key}"
        
        logger.info(f"Successfully uploaded: {public_url}")
        
        return {
            "success": True,
            "url": public_url,
            "key": s3_key,
            "type": file_type
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"R2 upload error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload file: {str(e)}"
        )

@router.post("/upload-design-png")
async def upload_design_png(file: UploadFile = File(...)):
    """
    Dedicated endpoint for uploading canvas design PNG
    (convenience wrapper for upload-to-r2 with type="design")
    """
    return await upload_to_r2(file, file_type="design")

@router.delete("/delete-from-r2")
async def delete_from_r2(s3_key: str):
    """
    Delete a file from R2 (used when order is deleted)
    
    Args:
        s3_key: The S3 key of the file to delete (e.g., "orders/20260713/design-abc123.png")
    """
    try:
        logger.info(f"Deleting from R2: {s3_key}")
        
        s3_client.delete_object(
            Bucket=R2_BUCKET,
            Key=s3_key
        )
        
        return {"success": True, "deleted": s3_key}
        
    except Exception as e:
        logger.error(f"R2 delete error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete file: {str(e)}"
        )
