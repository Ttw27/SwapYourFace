from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import base64
import aiofiles
import requests
from PIL import Image
import io
import json
import zipfile
import shutil

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create directories for file storage
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
ORIGINALS_DIR = UPLOAD_DIR / "originals"
ORIGINALS_DIR.mkdir(exist_ok=True)
HEADS_DIR = UPLOAD_DIR / "heads"
HEADS_DIR.mkdir(exist_ok=True)
PRINTS_DIR = UPLOAD_DIR / "prints"
PRINTS_DIR.mkdir(exist_ok=True)

# Create the main app
app = FastAPI(title="PartyTees API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ MODELS ============

class Template(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str  # "stag" or "hen"
    body_image_url: str
    head_placement: Dict[str, Any] = Field(default_factory=lambda: {"x": 0.5, "y": 0.15, "scale": 1.0, "rotation": 0})
    text_fields: Dict[str, Any] = Field(default_factory=lambda: {
        "title": {"font": "Anton", "size": 48, "color": "#FFFFFF", "outline": "#000000"},
        "subtitle": {"font": "Anton", "size": 32, "color": "#FFFFFF", "outline": "#000000"}
    })
    is_popular: bool = False
    is_new: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TemplateCreate(BaseModel):
    name: str
    category: str
    body_image_url: str
    head_placement: Optional[Dict[str, Any]] = None
    text_fields: Optional[Dict[str, Any]] = None
    is_popular: Optional[bool] = False
    is_new: Optional[bool] = True

class HeadCutout(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    original_file_id: str
    original_url: str
    head_url: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CartItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    template_id: str
    template_name: str
    head_cutout_id: Optional[str] = None
    title_text: str = ""
    subtitle_text: str = ""
    back_name: Optional[str] = None
    back_number: Optional[str] = None
    has_back_print: bool = False
    size: str = "M"
    quantity: int = 1
    head_placement: Dict[str, Any] = Field(default_factory=lambda: {"x": 0.5, "y": 0.15, "scale": 1.0, "rotation": 0})
    preview_url: Optional[str] = None
    front_print_url: Optional[str] = None
    back_print_url: Optional[str] = None
    original_photo_url: Optional[str] = None
    price: float = 19.99
    back_price: float = 2.50

class BulkOrderItem(BaseModel):
    template_id: str
    template_name: str
    head_cutout_id: Optional[str] = None
    title_text: str = ""
    subtitle_text: str = ""
    has_back_print: bool = False
    back_names: List[str] = []  # List of names for each shirt
    single_back_name: Optional[str] = None  # Single name for all shirts
    head_placement: Dict[str, Any] = Field(default_factory=lambda: {"x": 0.5, "y": 0.15, "scale": 1.0, "rotation": 0})
    sizes: Dict[str, int] = Field(default_factory=lambda: {"S": 0, "M": 0, "L": 0, "XL": 0, "2XL": 0, "3XL": 0})
    preview_url: Optional[str] = None
    front_print_url: Optional[str] = None
    original_photo_url: Optional[str] = None

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str = Field(default_factory=lambda: f"PT-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}")
    customer_email: str
    customer_name: str
    items: List[Dict[str, Any]]
    total_amount: float
    currency: str = "GBP"
    status: str = "pending"  # pending, processing, completed, shipped
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    gdpr_consent: bool = False

class OrderCreate(BaseModel):
    customer_email: str
    customer_name: str
    items: List[Dict[str, Any]]
    gdpr_consent: bool

# ============ TEMPLATES ENDPOINTS ============

@api_router.get("/")
async def root():
    return {"message": "PartyTees API is running", "version": "1.0.0"}

@api_router.get("/templates", response_model=List[Template])
async def get_templates(category: Optional[str] = None, popular: Optional[bool] = None):
    query = {}
    if category:
        query["category"] = category.lower()
    if popular is not None:
        query["is_popular"] = popular
    
    templates = await db.templates.find(query, {"_id": 0}).to_list(100)
    return templates

@api_router.get("/templates/{template_id}", response_model=Template)
async def get_template(template_id: str):
    template = await db.templates.find_one({"id": template_id}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@api_router.post("/templates", response_model=Template)
async def create_template(template: TemplateCreate):
    template_obj = Template(
        name=template.name,
        category=template.category.lower(),
        body_image_url=template.body_image_url,
        head_placement=template.head_placement or {"x": 0.5, "y": 0.15, "scale": 1.0, "rotation": 0},
        text_fields=template.text_fields or {
            "title": {"font": "Anton", "size": 48, "color": "#FFFFFF", "outline": "#000000"},
            "subtitle": {"font": "Anton", "size": 32, "color": "#FFFFFF", "outline": "#000000"}
        },
        is_popular=template.is_popular,
        is_new=template.is_new
    )
    
    doc = template_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.templates.insert_one(doc)
    return template_obj

@api_router.post("/templates/seed")
async def seed_templates():
    """Seed default templates"""
    default_templates = [
        {
            "id": "disco",
            "name": "Disco King",
            "category": "stag",
            "body_image_url": "https://customer-assets.emergentagent.com/job_party-tees/artifacts/upc1s63s_Stag-9.png",
            "head_placement": {"x": 0.5, "y": 0.08, "scale": 0.4, "rotation": 0},
            "text_fields": {
                "title": {"font": "Anton", "size": 48, "color": "#FFD700", "outline": "#000000"},
                "subtitle": {"font": "Anton", "size": 32, "color": "#FFFFFF", "outline": "#000000"}
            },
            "is_popular": True,
            "is_new": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "caveman",
            "name": "Caveman",
            "category": "stag",
            "body_image_url": "https://customer-assets.emergentagent.com/job_party-tees/artifacts/kud67bmp_Stag-12.png",
            "head_placement": {"x": 0.5, "y": 0.05, "scale": 0.35, "rotation": 0},
            "text_fields": {
                "title": {"font": "Anton", "size": 48, "color": "#8B4513", "outline": "#000000"},
                "subtitle": {"font": "Anton", "size": 32, "color": "#FFFFFF", "outline": "#000000"}
            },
            "is_popular": True,
            "is_new": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "lifeguard",
            "name": "Lifeguard",
            "category": "stag",
            "body_image_url": "https://customer-assets.emergentagent.com/job_party-tees/artifacts/weetxjo5_Stag-14.png",
            "head_placement": {"x": 0.5, "y": 0.05, "scale": 0.35, "rotation": 0},
            "text_fields": {
                "title": {"font": "Anton", "size": 48, "color": "#FF0000", "outline": "#FFFFFF"},
                "subtitle": {"font": "Anton", "size": 32, "color": "#FFFFFF", "outline": "#000000"}
            },
            "is_popular": False,
            "is_new": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Clear existing templates
    await db.templates.delete_many({})
    
    # Insert new templates
    await db.templates.insert_many(default_templates)
    
    return {"message": "Templates seeded successfully", "count": len(default_templates)}

# ============ IMAGE UPLOAD & HEAD CUTOUT ============

@api_router.post("/upload/photo")
async def upload_photo(file: UploadFile = File(...)):
    """Upload a photo and save original"""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate unique ID
    file_id = str(uuid.uuid4())
    
    # Read file content
    content = await file.read()
    
    # Check file size (max 10MB)
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")
    
    # Get file extension
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    
    # Save original
    original_path = ORIGINALS_DIR / f"{file_id}.{ext}"
    async with aiofiles.open(original_path, "wb") as f:
        await f.write(content)
    
    # Check image dimensions
    try:
        img = Image.open(io.BytesIO(content))
        width, height = img.size
        
        # Warn if image is too small
        quality_warning = None
        if width < 500 or height < 500:
            quality_warning = "Image resolution is low. For best print quality, use images at least 500x500 pixels."
    except Exception as e:
        logger.error(f"Error reading image: {e}")
        raise HTTPException(status_code=400, detail="Invalid image file")
    
    # Store metadata in database
    photo_doc = {
        "id": file_id,
        "original_filename": file.filename,
        "original_path": str(original_path),
        "original_url": f"/api/files/originals/{file_id}.{ext}",
        "width": width,
        "height": height,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.photos.insert_one(photo_doc)
    
    return {
        "id": file_id,
        "original_url": f"/api/files/originals/{file_id}.{ext}",
        "width": width,
        "height": height,
        "quality_warning": quality_warning
    }

@api_router.post("/upload/remove-background")
async def remove_background(
    file_id: str = Form(...),
    use_manual_crop: bool = Form(False),
    crop_x: float = Form(0),
    crop_y: float = Form(0),
    crop_width: float = Form(1),
    crop_height: float = Form(1)
):
    """Remove background from uploaded photo using remove.bg API or manual crop"""
    
    # Get the photo from database
    photo = await db.photos.find_one({"id": file_id}, {"_id": 0})
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    # Read original file
    original_path = Path(photo["original_path"])
    if not original_path.exists():
        raise HTTPException(status_code=404, detail="Original file not found")
    
    async with aiofiles.open(original_path, "rb") as f:
        image_data = await f.read()
    
    head_id = str(uuid.uuid4())
    head_path = HEADS_DIR / f"{head_id}.png"
    
    if use_manual_crop:
        # Manual crop - user will adjust on frontend
        try:
            img = Image.open(io.BytesIO(image_data))
            width, height = img.size
            
            # Calculate crop coordinates
            left = int(crop_x * width)
            top = int(crop_y * height)
            right = int((crop_x + crop_width) * width)
            bottom = int((crop_y + crop_height) * height)
            
            # Crop image
            cropped = img.crop((left, top, right, bottom))
            
            # Convert to RGBA if not already
            if cropped.mode != "RGBA":
                cropped = cropped.convert("RGBA")
            
            # Save cropped image
            cropped.save(head_path, "PNG")
            
        except Exception as e:
            logger.error(f"Error cropping image: {e}")
            raise HTTPException(status_code=500, detail="Error processing image")
    else:
        # Try remove.bg API
        remove_bg_key = os.environ.get("REMOVE_BG_API_KEY")
        
        if remove_bg_key:
            try:
                response = requests.post(
                    "https://api.remove.bg/v1.0/removebg",
                    files={"image_file": image_data},
                    data={"size": "auto"},
                    headers={"X-Api-Key": remove_bg_key}
                )
                
                if response.status_code == 200:
                    async with aiofiles.open(head_path, "wb") as f:
                        await f.write(response.content)
                else:
                    logger.warning(f"remove.bg API failed: {response.status_code}")
                    # Fallback to just copying the original
                    img = Image.open(io.BytesIO(image_data))
                    if img.mode != "RGBA":
                        img = img.convert("RGBA")
                    img.save(head_path, "PNG")
            except Exception as e:
                logger.error(f"remove.bg API error: {e}")
                # Fallback
                img = Image.open(io.BytesIO(image_data))
                if img.mode != "RGBA":
                    img = img.convert("RGBA")
                img.save(head_path, "PNG")
        else:
            # No API key - just convert to PNG with transparency support
            logger.info("No remove.bg API key found, using original image")
            img = Image.open(io.BytesIO(image_data))
            if img.mode != "RGBA":
                img = img.convert("RGBA")
            img.save(head_path, "PNG")
    
    # Store head cutout metadata
    head_doc = {
        "id": head_id,
        "original_file_id": file_id,
        "original_url": photo["original_url"],
        "head_url": f"/api/files/heads/{head_id}.png",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.head_cutouts.insert_one(head_doc)
    
    return {
        "id": head_id,
        "original_file_id": file_id,
        "original_url": photo["original_url"],
        "head_url": f"/api/files/heads/{head_id}.png"
    }

# ============ FILE SERVING ============

@api_router.get("/files/originals/{filename}")
async def get_original_file(filename: str):
    file_path = ORIGINALS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

@api_router.get("/files/heads/{filename}")
async def get_head_file(filename: str):
    file_path = HEADS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

@api_router.get("/files/prints/{filename}")
async def get_print_file(filename: str):
    file_path = PRINTS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

# ============ PRINT GENERATION ============

@api_router.post("/generate-print")
async def generate_print(
    template_id: str = Form(...),
    head_cutout_id: str = Form(None),
    title_text: str = Form(""),
    subtitle_text: str = Form(""),
    head_x: float = Form(0.5),
    head_y: float = Form(0.15),
    head_scale: float = Form(1.0),
    head_rotation: float = Form(0),
    generate_back: bool = Form(False),
    back_name: str = Form(""),
    back_number: str = Form("")
):
    """Generate print-ready PNG files"""
    
    # Get template
    template = await db.templates.find_one({"id": template_id}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    print_id = str(uuid.uuid4())
    
    # For MVP, we'll store the configuration and return URLs
    # In production, you'd composite the images here using Pillow
    
    print_doc = {
        "id": print_id,
        "template_id": template_id,
        "head_cutout_id": head_cutout_id,
        "title_text": title_text,
        "subtitle_text": subtitle_text,
        "head_placement": {
            "x": head_x,
            "y": head_y,
            "scale": head_scale,
            "rotation": head_rotation
        },
        "has_back": generate_back,
        "back_name": back_name,
        "back_number": back_number,
        "front_url": f"/api/files/prints/{print_id}_front.png",
        "back_url": f"/api/files/prints/{print_id}_back.png" if generate_back else None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.prints.insert_one(print_doc)
    
    return {
        "id": print_id,
        "front_url": print_doc["front_url"],
        "back_url": print_doc["back_url"],
        "config": print_doc
    }

# ============ CART & ORDERS ============

@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate):
    """Create a new order"""
    if not order_data.gdpr_consent:
        raise HTTPException(status_code=400, detail="GDPR consent is required")
    
    # Calculate total
    total = 0.0
    for item in order_data.items:
        base_price = item.get("price", 19.99)
        quantity = item.get("quantity", 1)
        has_back = item.get("has_back_print", False)
        back_price = item.get("back_price", 2.50) if has_back else 0
        total += (base_price + back_price) * quantity
    
    order = Order(
        customer_email=order_data.customer_email,
        customer_name=order_data.customer_name,
        items=order_data.items,
        total_amount=total,
        gdpr_consent=order_data.gdpr_consent
    )
    
    doc = order.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.orders.insert_one(doc)
    
    return order

@api_router.get("/orders", response_model=List[Order])
async def get_orders(status: Optional[str] = None):
    """Get all orders (admin)"""
    query = {}
    if status:
        query["status"] = status
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for order in orders:
        if isinstance(order['created_at'], str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
    
    return orders

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    """Get single order"""
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@api_router.patch("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str):
    """Update order status"""
    valid_statuses = ["pending", "processing", "completed", "shipped"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Status updated", "status": status}

@api_router.get("/orders/{order_id}/download")
async def download_order_files(order_id: str):
    """Download all files for an order as ZIP"""
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Create temporary zip file
    zip_filename = f"order_{order['order_number']}.zip"
    zip_path = UPLOAD_DIR / zip_filename
    
    try:
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Add order details as JSON
            order_json = json.dumps(order, indent=2, default=str)
            zipf.writestr("order_details.json", order_json)
            
            # Add item files
            for idx, item in enumerate(order.get("items", [])):
                person_prefix = f"Person{idx+1:02d}"
                
                # Try to add original photo
                if item.get("original_photo_url"):
                    original_filename = item["original_photo_url"].split("/")[-1]
                    original_path = ORIGINALS_DIR / original_filename
                    if original_path.exists():
                        zipf.write(original_path, f"{person_prefix}_Original.{original_path.suffix}")
                
                # Try to add head cutout
                if item.get("head_cutout_id"):
                    head_path = HEADS_DIR / f"{item['head_cutout_id']}.png"
                    if head_path.exists():
                        zipf.write(head_path, f"{person_prefix}_Head.png")
        
        return FileResponse(
            zip_path,
            filename=zip_filename,
            media_type="application/zip"
        )
    except Exception as e:
        logger.error(f"Error creating zip: {e}")
        raise HTTPException(status_code=500, detail="Error creating download file")

# ============ PRICING ============

@api_router.get("/pricing")
async def get_pricing():
    """Get current pricing"""
    return {
        "base_price": 19.99,
        "back_print_price": 2.50,
        "currency": "GBP",
        "currency_symbol": "£",
        "quantity_discounts": [
            {"min_qty": 10, "discount_percent": 5},
            {"min_qty": 20, "discount_percent": 10},
            {"min_qty": 50, "discount_percent": 15}
        ]
    }

# ============ STATS (Admin) ============

@api_router.get("/admin/stats")
async def get_admin_stats():
    """Get admin dashboard stats"""
    total_orders = await db.orders.count_documents({})
    pending_orders = await db.orders.count_documents({"status": "pending"})
    total_templates = await db.templates.count_documents({})
    total_photos = await db.photos.count_documents({})
    
    # Calculate total revenue
    orders = await db.orders.find({}, {"total_amount": 1, "_id": 0}).to_list(1000)
    total_revenue = sum(o.get("total_amount", 0) for o in orders)
    
    return {
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "total_templates": total_templates,
        "total_photos": total_photos,
        "total_revenue": round(total_revenue, 2),
        "currency": "GBP"
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    logger.info("PartyTees API starting up...")
    # Create indexes
    await db.templates.create_index("id", unique=True)
    await db.templates.create_index("category")
    await db.photos.create_index("id", unique=True)
    await db.head_cutouts.create_index("id", unique=True)
    await db.orders.create_index("id", unique=True)
    await db.orders.create_index("order_number", unique=True)
    logger.info("Database indexes created")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
