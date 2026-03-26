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
import stripe
import cloudinary
import cloudinary.uploader
import resend

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Stripe
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY', '')
resend.api_key = os.environ.get('RESEND_API_KEY', '')

# Cloudinary — for storing preview PNGs permanently
cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME', 'dqlrmqhte'),
    api_key=os.environ.get('CLOUDINARY_API_KEY', ''),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET', ''),
    secure=True
)

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
    # categories is now a list to support crossover templates e.g. ["stag", "party"]
    categories: List[str] = Field(default_factory=list)
    # Keep category for backwards compatibility
    category: str = "stag"
    body_image_url: str       # Design PNG - blank body, no head, no text
    product_image_url: str = "" # Product hero image - with sample head + text
    head_placement: Dict[str, Any] = Field(default_factory=lambda: {"x": 0.5, "y": 0.22, "scale": 0.9, "rotation": 0})
    text_fields: Dict[str, Any] = Field(default_factory=lambda: {
        "title": {"font": "Anton", "size": 48, "color": "#FFFFFF", "outline": "#000000"},
        "subtitle": {"font": "Anton", "size": 32, "color": "#FFFFFF", "outline": "#000000"}
    })
    is_popular: bool = False
    is_new: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TemplateCreate(BaseModel):
    name: str
    categories: List[str] = ["stag"]
    category: Optional[str] = None
    body_image_url: str
    product_image_url: Optional[str] = ""
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
    head_placement: Dict[str, Any] = Field(default_factory=lambda: {"x": 0.5, "y": 0.22, "scale": 0.9, "rotation": 0})
    preview_url: Optional[str] = None
    front_print_url: Optional[str] = None
    back_print_url: Optional[str] = None
    original_photo_url: Optional[str] = None
    price: float = 19.99
    back_price: float = 2.50

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str = Field(default_factory=lambda: f"PT-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}")
    customer_email: str
    customer_name: str
    items: List[Dict[str, Any]]
    total_amount: float
    currency: str = "GBP"
    status: str = "pending"
    stripe_payment_intent_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    gdpr_consent: bool = False

class OrderCreate(BaseModel):
    customer_email: str
    customer_name: str
    items: List[Dict[str, Any]]
    gdpr_consent: bool

class PaymentIntentCreate(BaseModel):
    items: List[Dict[str, Any]]
    customer_email: Optional[str] = None

# ============ TEMPLATES ENDPOINTS ============

@api_router.get("/")
async def root():
    return {"message": "PartyTees API is running", "version": "2.0.0"}

@api_router.get("/templates")
async def get_templates(category: Optional[str] = None, popular: Optional[bool] = None):
    query = {}
    if category:
        # Match against the new categories list
        query["categories"] = {"$in": [category.lower()]}
    if popular is not None:
        query["is_popular"] = popular
    
    templates = await db.templates.find(query, {"_id": 0}).to_list(100)
    return templates

@api_router.get("/templates/{template_id}")
async def get_template(template_id: str):
    template = await db.templates.find_one({"id": template_id}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@api_router.post("/templates")
async def create_template(template: TemplateCreate):
    categories = template.categories
    if not categories and template.category:
        categories = [template.category.lower()]

    template_obj = Template(
        name=template.name,
        categories=categories,
        category=categories[0] if categories else "stag",
        body_image_url=template.body_image_url,
        product_image_url=template.product_image_url or "",
        head_placement=template.head_placement or {"x": 0.5, "y": 0.22, "scale": 0.9, "rotation": 0},
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

@api_router.delete("/templates/{template_id}")
async def delete_template(template_id: str):
    result = await db.templates.delete_one({"id": template_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template deleted", "id": template_id}

@api_router.post("/templates/seed")
async def seed_templates():
    """Seed default templates from Cloudinary"""
    default_templates = [
        {
            "id": "hip-hop-king",
            "name": "Hip Hop King",
            "categories": ["stag", "party"],
            "category": "stag",
            "body_image_url": "https://res.cloudinary.com/dqlrmqhte/image/upload/v1773762298/HipHopKingDESIGN-Stag-6_zs17oa.png",
            "product_image_url": "https://res.cloudinary.com/dqlrmqhte/image/upload/v1773762289/HipHipKing-Stag-6_qsbgsw.jpg",
            "head_placement": {"x": 0.5, "y": 0.22, "scale": 0.9, "rotation": 0},
            "text_fields": {
                "title": {"font": "Anton", "size": 48, "color": "#FFFFFF", "outline": "#000000"},
                "subtitle": {"font": "Anton", "size": 32, "color": "#FFD700", "outline": "#000000"}
            },
            "is_popular": True,
            "is_new": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "bodybuilder",
            "name": "Bodybuilder",
            "categories": ["stag", "party"],
            "category": "stag",
            "body_image_url": "https://res.cloudinary.com/dqlrmqhte/image/upload/v1773763080/BodybuilderDESIGN-Stag-16_xr0gyt.png",
            "product_image_url": "https://res.cloudinary.com/dqlrmqhte/image/upload/v1773763096/BodyBuilder-Stag-16_swgojr.jpg",
            "head_placement": {"x": 0.5, "y": 0.22, "scale": 0.9, "rotation": 0},
            "text_fields": {
                "title": {"font": "Anton", "size": 48, "color": "#FFFFFF", "outline": "#000000"},
                "subtitle": {"font": "Anton", "size": 32, "color": "#FFFFFF", "outline": "#000000"}
            },
            "is_popular": True,
            "is_new": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "superhero-stag",
            "name": "Superhero Stag",
            "categories": ["stag"],
            "category": "stag",
            "body_image_url": "https://res.cloudinary.com/dqlrmqhte/image/upload/v1773763083/SuperheroDESIGN-Stag-2_ejhssm.png",
            "product_image_url": "https://res.cloudinary.com/dqlrmqhte/image/upload/v1773763095/Superhero-Stag-2_k24w6h.jpg",
            "head_placement": {"x": 0.5, "y": 0.22, "scale": 0.9, "rotation": 0},
            "text_fields": {
                "title": {"font": "Anton", "size": 48, "color": "#FFD700", "outline": "#000000"},
                "subtitle": {"font": "Anton", "size": 32, "color": "#FFFFFF", "outline": "#000000"}
            },
            "is_popular": False,
            "is_new": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.templates.delete_many({})
    await db.templates.insert_many(default_templates)
    
    return {"message": "Templates seeded successfully", "count": len(default_templates)}

# ============ IMAGE UPLOAD & HEAD CUTOUT ============

@api_router.post("/upload/photo")
async def upload_photo(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    file_id = str(uuid.uuid4())
    content = await file.read()
    
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    original_path = ORIGINALS_DIR / f"{file_id}.{ext}"
    
    async with aiofiles.open(original_path, "wb") as f:
        await f.write(content)
    
    try:
        img = Image.open(io.BytesIO(content))
        width, height = img.size
        quality_warning = None
        if width < 500 or height < 500:
            quality_warning = "Image resolution is low. For best print quality, use images at least 500x500 pixels."
    except Exception as e:
        logger.error(f"Error reading image: {e}")
        raise HTTPException(status_code=400, detail="Invalid image file")
    
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
    photo = await db.photos.find_one({"id": file_id}, {"_id": 0})
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    original_path = Path(photo["original_path"])
    if not original_path.exists():
        raise HTTPException(status_code=404, detail="Original file not found")
    
    async with aiofiles.open(original_path, "rb") as f:
        image_data = await f.read()
    
    head_id = str(uuid.uuid4())
    head_path = HEADS_DIR / f"{head_id}.png"
    
    if use_manual_crop:
        try:
            img = Image.open(io.BytesIO(image_data))
            width, height = img.size
            left = int(crop_x * width)
            top = int(crop_y * height)
            right = int((crop_x + crop_width) * width)
            bottom = int((crop_y + crop_height) * height)
            cropped = img.crop((left, top, right, bottom))
            if cropped.mode != "RGBA":
                cropped = cropped.convert("RGBA")
            cropped.save(head_path, "PNG")
        except Exception as e:
            logger.error(f"Error cropping image: {e}")
            raise HTTPException(status_code=500, detail="Error processing image")
    else:
        # Try cutout.pro face cutout first (mattingType=3 = face + hair only)
        cutout_pro_key = os.environ.get("CUTOUT_PRO_API_KEY")
        # Fallback: remove.bg whole background removal
        remove_bg_key = os.environ.get("REMOVE_BG_API_KEY")

        if cutout_pro_key:
            try:
                logger.info("Using cutout.pro face cutout API")
                response = requests.post(
                    "https://www.cutout.pro/api/v1/matting?mattingType=3",
                    files={"file": ("photo.jpg", image_data, "image/jpeg")},
                    headers={"APIKEY": cutout_pro_key}
                )
                if response.status_code == 200:
                    # Auto-crop transparent pixels so bounding box hugs the face tightly
                    cutout_img = Image.open(io.BytesIO(response.content)).convert("RGBA")
                    bbox = cutout_img.getbbox()  # returns (left, top, right, bottom) of non-transparent area
                    if bbox:
                        cutout_img = cutout_img.crop(bbox)
                    cutout_img.save(head_path, "PNG")
                    logger.info(f"cutout.pro face cutout successful, cropped to {cutout_img.size}")
                else:
                    logger.warning(f"cutout.pro API failed: {response.status_code} — {response.text}")
                    img = Image.open(io.BytesIO(image_data)).convert("RGBA")
                    img.save(head_path, "PNG")
            except Exception as e:
                logger.error(f"cutout.pro error: {e}")
                img = Image.open(io.BytesIO(image_data)).convert("RGBA")
                img.save(head_path, "PNG")

        elif remove_bg_key:
            try:
                logger.info("Using remove.bg API (fallback)")
                response = requests.post(
                    "https://api.remove.bg/v1.0/removebg",
                    files={"image_file": image_data},
                    data={"size": "auto"},
                    headers={"X-Api-Key": remove_bg_key}
                )
                if response.status_code == 200:
                    cutout_img = Image.open(io.BytesIO(response.content)).convert("RGBA")
                    bbox = cutout_img.getbbox()
                    if bbox:
                        cutout_img = cutout_img.crop(bbox)
                    cutout_img.save(head_path, "PNG")
                else:
                    logger.warning(f"remove.bg API failed: {response.status_code}")
                    img = Image.open(io.BytesIO(image_data)).convert("RGBA")
                    img.save(head_path, "PNG")
            except Exception as e:
                logger.error(f"remove.bg error: {e}")
                img = Image.open(io.BytesIO(image_data)).convert("RGBA")
                img.save(head_path, "PNG")

        else:
            logger.info("No API key found — using original image without cutout")
            img = Image.open(io.BytesIO(image_data))
            if img.mode != "RGBA":
                img = img.convert("RGBA")
            img.save(head_path, "PNG")
    
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

@api_router.post("/upload/preview")
async def upload_preview(file: UploadFile = File(...)):
    """
    Accepts the flattened canvas PNG from the browser (full composite design)
    and uploads it to Cloudinary for permanent storage.
    Returns a public Cloudinary URL saved against the order.
    """
    preview_id = str(uuid.uuid4())
    image_data = await file.read()

    # Try Cloudinary first (permanent storage, survives Railway redeploys)
    cloudinary_api_key = os.environ.get('CLOUDINARY_API_KEY', '')
    if cloudinary_api_key:
        try:
            result = cloudinary.uploader.upload(
                image_data,
                public_id=f"previews/{preview_id}",
                folder="swap_my_face_previews",
                resource_type="image",
                format="png"
            )
            preview_url = result.get('secure_url')
            logger.info(f"Preview uploaded to Cloudinary: {preview_url}")
            return {"preview_url": preview_url, "id": preview_id, "storage": "cloudinary"}
        except Exception as e:
            logger.warning(f"Cloudinary upload failed, falling back to local: {e}")

    # Fallback: save locally (note: resets on Railway redeploy)
    preview_path = PRINTS_DIR / f"{preview_id}.png"
    try:
        # Validate it's a real image
        img = Image.open(io.BytesIO(image_data))
        img.save(preview_path, "PNG")
        preview_url = f"/api/files/prints/{preview_id}.png"
        logger.info(f"Preview saved locally: {preview_url}")
        return {"preview_url": preview_url, "id": preview_id, "storage": "local"}
    except Exception as e:
        logger.error(f"Preview save failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to save preview")

# ============ FILE SERVING ============

@api_router.get("/files/originals/{filename}")
async def get_original_file(filename: str):
    file_path = ORIGINALS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, headers={"Access-Control-Allow-Origin": "*"})

@api_router.get("/files/heads/{filename}")
async def get_head_file(filename: str):
    file_path = HEADS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, headers={"Access-Control-Allow-Origin": "*"})

@api_router.get("/files/prints/{filename}")
async def get_print_file(filename: str):
    file_path = PRINTS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, headers={"Access-Control-Allow-Origin": "*"})

# ============ STRIPE PAYMENTS ============

@api_router.post("/payments/create-intent")
async def create_payment_intent(data: PaymentIntentCreate):
    """Create a Stripe PaymentIntent for the cart items"""
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    
    # Calculate total in pence (Stripe uses smallest currency unit)
    total_pence = 0
    for item in data.items:
        base_price = item.get("price", 19.99)
        quantity = item.get("quantity", 1)
        has_back = item.get("hasBackPrint", False)
        back_price = item.get("backPrice", 2.50) if has_back else 0
        total_pence += int((base_price + back_price) * quantity * 100)
    
    if total_pence < 30:  # Stripe minimum
        raise HTTPException(status_code=400, detail="Order total too low")
    
    try:
        intent = stripe.PaymentIntent.create(
            amount=total_pence,
            currency="gbp",
            payment_method_types=["card", "paypal"],
            metadata={
                "customer_email": data.customer_email or "",
                "item_count": str(len(data.items))
            }
        )
        return {
            "client_secret": intent.client_secret,
            "amount": total_pence,
            "currency": "gbp"
        }
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/payments/webhook")
async def stripe_webhook(request_body: bytes = None):
    """Handle Stripe webhook events"""
    return {"status": "ok"}

@api_router.post("/payments/create-checkout")
async def create_checkout_session(data: dict):
    """Create a Stripe hosted Checkout Session"""
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")

    items = data.get("items", [])
    order_id = data.get("order_id", "")
    customer_email = data.get("customer_email", "")
    success_url = data.get("success_url", "")
    cancel_url = data.get("cancel_url", "")

    # Get tier pricing
    tiers, back_print_price_config = await get_pricing_config()
    total_qty = sum(item.get("quantity", 1) for item in items)
    tier_price = get_tier_price(tiers, total_qty)

    line_items = []
    for item in items:
        # Use tier price (passed from frontend) or recalculate
        base_price = item.get("price", tier_price)
        has_back = item.get("hasBackPrint", False)
        back_price = item.get("backPrice", back_print_price_config) if has_back else 0
        unit_amount = int((base_price + back_price) * 100)
        name = item.get("templateName", "Custom T-Shirt")
        size = item.get("size", "")
        line_items.append({
            "price_data": {
                "currency": "gbp",
                "product_data": {"name": name, "description": f"Size: {size}" if size else ""},
                "unit_amount": unit_amount,
            },
            "quantity": item.get("quantity", 1),
        })

    # Add shipping as a line item if express
    shipping_cost = data.get("shipping_cost", 0)
    shipping_method = data.get("shipping_method", "standard")
    if shipping_cost and shipping_cost > 0:
        line_items.append({
            "price_data": {
                "currency": "gbp",
                "product_data": {"name": f"{'Express' if shipping_method == 'express' else 'Standard'} Delivery", "description": "3–5 working days" if shipping_method == "express" else "5–8 working days"},
                "unit_amount": int(shipping_cost * 100),
            },
            "quantity": 1,
        })

    # Apply discount code as negative line item
    discount_code = data.get("discount_code", "").upper().strip()
    discount_percent = 0
    if discount_code:
        doc = await db.discount_codes.find_one({"code": discount_code, "active": True})
        if doc:
            discount_percent = doc.get("percent_off", 0)
            # Calculate subtotal (items only, not shipping)
            items_total = sum(
                int((item.get("price", 19.99) + (item.get("backPrice", 2.50) if item.get("hasBackPrint") else 0)) * item.get("quantity", 1) * 100)
                for item in items
            )
            discount_amount = int(items_total * discount_percent / 100)
            if discount_amount > 0:
                line_items.append({
                    "price_data": {
                        "currency": "gbp",
                        "product_data": {"name": f"Discount ({discount_code} — {discount_percent}% off)"},
                        "unit_amount": -discount_amount,
                    },
                    "quantity": 1,
                })
            # Increment usage count
            await db.discount_codes.update_one({"code": discount_code}, {"$inc": {"uses": 1}})

    if not line_items:
        raise HTTPException(status_code=400, detail="No items")

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=line_items,
            mode="payment",
            customer_email=customer_email or None,
            success_url=success_url + "?session_id={CHECKOUT_SESSION_ID}",
            cancel_url=cancel_url,
            metadata={"order_id": order_id},
        )
        return {"checkout_url": session.url, "session_id": session.id}
    except stripe.error.StripeError as e:
        logger.error(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# ============ EMAIL NOTIFICATIONS ============

async def send_order_notification(order: dict):
    """Send new order notification email via Resend"""
    if not resend.api_key:
        logger.warning("RESEND_API_KEY not set — skipping email notification")
        return
    try:
        items = order.get("items", [])
        item_rows = ""
        for i, item in enumerate(items):
            back = f" + back name: {item.get('backName','')}" if item.get('hasBackPrint') else ""
            item_rows += f"""
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:8px 12px;">{i+1}</td>
              <td style="padding:8px 12px;">{item.get('templateName','')}</td>
              <td style="padding:8px 12px;">{item.get('shirtType','').capitalize()} {item.get('size','')}</td>
              <td style="padding:8px 12px;">{item.get('titleText','')} {item.get('subtitleText','')}</td>
              <td style="padding:8px 12px;">£{(item.get('price', 0) + (item.get('backPrice',0) if item.get('hasBackPrint') else 0)):.2f}{back}</td>
            </tr>"""

        html = f"""
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#FF2E63;padding:24px;border-radius:12px 12px 0 0;">
            <h1 style="color:white;margin:0;font-size:24px;">🎉 New Order Received!</h1>
            <p style="color:rgba(255,255,255,0.9);margin:4px 0 0;">Swap My Face Tees</p>
          </div>
          <div style="background:#f9f9f9;padding:24px;border-radius:0 0 12px 12px;border:1px solid #eee;">

            <div style="background:white;border-radius:8px;padding:16px;margin-bottom:16px;border:1px solid #eee;">
              <h2 style="margin:0 0 12px;color:#252A34;font-size:16px;">📋 Order Details</h2>
              <p style="margin:4px 0;"><strong>Order:</strong> {order.get('order_number','')}</p>
              <p style="margin:4px 0;"><strong>Total:</strong> £{order.get('total_amount',0):.2f}</p>
              <p style="margin:4px 0;"><strong>Date:</strong> {order.get('created_at','')[:19].replace('T',' ')}</p>
            </div>

            <div style="background:white;border-radius:8px;padding:16px;margin-bottom:16px;border:1px solid #eee;">
              <h2 style="margin:0 0 12px;color:#252A34;font-size:16px;">👤 Customer</h2>
              <p style="margin:4px 0;"><strong>Name:</strong> {order.get('customer_name','')}</p>
              <p style="margin:4px 0;"><strong>Email:</strong> <a href="mailto:{order.get('customer_email','')}">{order.get('customer_email','')}</a></p>
              <p style="margin:4px 0;"><strong>Phone:</strong> <a href="tel:{order.get('customer_phone','')}">{order.get('customer_phone','')}</a></p>
            </div>

            <div style="background:white;border-radius:8px;padding:16px;margin-bottom:16px;border:1px solid #eee;">
              <h2 style="margin:0 0 12px;color:#252A34;font-size:16px;">👕 Items ({len(items)} shirt{'s' if len(items)!=1 else ''})</h2>
              <table style="width:100%;border-collapse:collapse;font-size:13px;">
                <thead>
                  <tr style="background:#f5f5f5;">
                    <th style="padding:8px 12px;text-align:left;">#</th>
                    <th style="padding:8px 12px;text-align:left;">Template</th>
                    <th style="padding:8px 12px;text-align:left;">Size</th>
                    <th style="padding:8px 12px;text-align:left;">Text</th>
                    <th style="padding:8px 12px;text-align:left;">Price</th>
                  </tr>
                </thead>
                <tbody>{item_rows}</tbody>
              </table>
            </div>

            <div style="text-align:center;padding:16px;">
              <a href="https://www.swapmyface.co.uk/admin" 
                 style="background:#FF2E63;color:white;padding:12px 32px;border-radius:50px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block;">
                View in Admin Panel →
              </a>
            </div>
          </div>
        </div>"""

        resend.Emails.send({
            "from": "Swap My Face Tees <orders@swapmyface.co.uk>",
            "to": ["support@swapmyface.co.uk"],
            "subject": f"🎉 New Order #{order.get('order_number','')} — £{order.get('total_amount',0):.2f}",
            "html": html,
        })
        logger.info(f"Order notification email sent for {order.get('order_number','')}")
    except Exception as e:
        logger.error(f"Failed to send order notification: {e}")

# ============ CART & ORDERS ============

@api_router.post("/orders")
async def create_order(order_data: OrderCreate):
    if not order_data.gdpr_consent:
        raise HTTPException(status_code=400, detail="GDPR consent is required")
    
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

    # Send email notification in background (don't block the response)
    try:
        import asyncio
        asyncio.create_task(send_order_notification(order))
    except Exception as e:
        logger.error(f"Could not schedule email notification: {e}")

    return order

@api_router.get("/orders")
async def get_orders(status: Optional[str] = None):
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
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@api_router.patch("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str):
    valid_statuses = ["pending", "processing", "completed", "shipped"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    result = await db.orders.update_one({"id": order_id}, {"$set": {"status": status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Status updated", "status": status}

@api_router.get("/orders/{order_id}/download")
async def download_order_files(order_id: str):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    zip_filename = f"order_{order.get('order_number', order_id)}.zip"
    zip_path = UPLOAD_DIR / zip_filename

    def fetch_url(url, timeout=10):
        try:
            resp = requests.get(url, timeout=timeout)
            return resp.content if resp.status_code == 200 else None
        except Exception as e:
            logger.error(f"Fetch failed {url}: {e}")
            return None

    try:
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Human-readable summary
            lines = [
                f"ORDER: {order.get('order_number', order_id)}",
                f"Customer: {order.get('customer_name', '')}",
                f"Email: {order.get('customer_email', '')}",
                f"Phone: {order.get('customer_phone', '')}",
                f"Status: {order.get('status', '')}",
                f"Total: £{order.get('total_amount', 0):.2f}",
                f"Date: {order.get('created_at', '')}",
                "", "ITEMS:",
            ]
            for idx, item in enumerate(order.get("items", [])):
                lines += [
                    f"", f"  Person {idx+1}:",
                    f"    Template: {item.get('templateName', '')}",
                    f"    Size: {item.get('size', '')} ({item.get('shirtType', '')})",
                    f"    Title: {item.get('titleText', '')}",
                    f"    Subtitle: {item.get('subtitleText', '')}",
                    f"    Back Print: {'Yes - ' + item.get('backName','') if item.get('hasBackPrint') else 'No'}",
                    f"    Face URL: {item.get('headUrl') or item.get('head_url') or 'N/A'}",
                    f"    Original: {item.get('originalPhotoUrl') or item.get('original_photo_url') or 'N/A'}",
                ]
            zipf.writestr("order_summary.txt", "\n".join(lines))
            zipf.writestr("order_details.json", json.dumps(order, indent=2, default=str))

            for idx, item in enumerate(order.get("items", [])):
                p = f"Person{idx+1:02d}"

                # Face PNG - Cloudinary or local
                head_url = item.get("headUrl") or item.get("head_url", "")
                if head_url:
                    if head_url.startswith("http"):
                        data = fetch_url(head_url)
                        if data: zipf.writestr(f"{p}_Face.png", data)
                    elif head_url.startswith("/api/files/heads/"):
                        filename = head_url.split("/")[-1]
                        local = HEADS_DIR / filename
                        if local.exists():
                            zipf.write(local, f"{p}_Face.png")

                # Original photo
                orig = item.get("originalPhotoUrl") or item.get("original_photo_url", "")
                if orig and orig.startswith("http"):
                    data = fetch_url(orig)
                    if data:
                        ext = orig.split(".")[-1].split("?")[0][:4] or "jpg"
                        zipf.writestr(f"{p}_OriginalPhoto.{ext}", data)

                # Preview
                preview = item.get("previewUrl", "")
                if preview and preview.startswith("http"):
                    data = fetch_url(preview)
                    if data: zipf.writestr(f"{p}_Preview.jpg", data)

        return FileResponse(zip_path, filename=zip_filename, media_type="application/zip",
                           headers={"Content-Disposition": f"attachment; filename={zip_filename}"})
    except Exception as e:
        logger.error(f"Error creating zip: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating download: {str(e)}")

# ============ PRICING ============

DEFAULT_TIERS = [
    {"min_qty": 1,  "max_qty": 1,    "price": 17.99, "label": "1 shirt"},
    {"min_qty": 2,  "max_qty": 6,    "price": 15.99, "label": "2–6 shirts"},
    {"min_qty": 7,  "max_qty": 12,   "price": 13.99, "label": "7–12 shirts"},
    {"min_qty": 13, "max_qty": 20,   "price": 12.99, "label": "13–20 shirts"},
    {"min_qty": 21, "max_qty": 9999, "price": 11.99, "label": "21+ shirts"},
]

async def get_pricing_config():
    config = await db.config.find_one({"key": "pricing"})
    tiers = config.get("tiers", DEFAULT_TIERS) if config else DEFAULT_TIERS
    back_print_price = config.get("back_print_price", 2.50) if config else 2.50
    return tiers, back_print_price

def get_tier_price(tiers, quantity):
    for tier in sorted(tiers, key=lambda t: t["min_qty"]):
        if tier["min_qty"] <= quantity <= tier["max_qty"]:
            return tier["price"]
    return tiers[-1]["price"] if tiers else 17.99

@api_router.get("/pricing")
async def get_pricing():
    tiers, back_print_price = await get_pricing_config()
    lowest = min(t["price"] for t in tiers)
    return {
        "tiers": tiers,
        "back_print_price": back_print_price,
        "base_price": tiers[0]["price"],
        "lowest_price": lowest,
        "currency": "GBP",
        "currency_symbol": "£",
    }

@api_router.patch("/admin/pricing")
async def update_pricing(data: dict):
    update = {}
    if "back_print_price" in data:
        update["back_print_price"] = float(data["back_print_price"])
    if "tiers" in data:
        update["tiers"] = data["tiers"]
    if not update:
        raise HTTPException(status_code=400, detail="No valid fields")
    await db.config.update_one(
        {"key": "pricing"},
        {"$set": {**update, "key": "pricing"}},
        upsert=True
    )
    return {"message": "Pricing updated"}

# ── Discount Codes ──────────────────────────────────────────────────────────

@api_router.get("/admin/discount-codes")
async def get_discount_codes():
    codes = await db.discount_codes.find({}, {"_id": 0}).to_list(100)
    return codes

@api_router.post("/admin/discount-codes")
async def create_discount_code(data: dict):
    code = data.get("code", "").upper().strip()
    percent = int(data.get("percent_off", 0))
    if not code or not (1 <= percent <= 100):
        raise HTTPException(status_code=400, detail="Invalid code or percent")
    existing = await db.discount_codes.find_one({"code": code})
    if existing:
        raise HTTPException(status_code=400, detail="Code already exists")
    doc = {
        "code": code,
        "percent_off": percent,
        "active": True,
        "uses": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.discount_codes.insert_one(doc)
    return doc

@api_router.delete("/admin/discount-codes/{code}")
async def delete_discount_code(code: str):
    await db.discount_codes.delete_one({"code": code.upper()})
    return {"message": "Deleted"}

@api_router.patch("/admin/discount-codes/{code}")
async def toggle_discount_code(code: str, data: dict):
    await db.discount_codes.update_one({"code": code.upper()}, {"$set": {"active": data.get("active", True)}})
    return {"message": "Updated"}

@api_router.post("/validate-discount")
async def validate_discount(data: dict):
    code = data.get("code", "").upper().strip()
    if not code:
        raise HTTPException(status_code=400, detail="No code provided")
    doc = await db.discount_codes.find_one({"code": code})
    if not doc:
        raise HTTPException(status_code=404, detail="Invalid discount code")
    if not doc.get("active", True):
        raise HTTPException(status_code=400, detail="This code is no longer active")
    return {"code": code, "percent_off": doc["percent_off"], "valid": True}

# ============ ADMIN STATS ============

@api_router.get("/admin/stats")
async def get_admin_stats():
    total_orders = await db.orders.count_documents({})
    pending_orders = await db.orders.count_documents({"status": "pending"})
    total_templates = await db.templates.count_documents({})
    total_photos = await db.photos.count_documents({})
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

# ============ REVIEWS ============

@api_router.get("/reviews")
async def get_reviews(approved_only: bool = True):
    query = {"approved": True} if approved_only else {}
    reviews = await db.reviews.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return reviews

@api_router.post("/reviews")
async def submit_review(
    name: str = Form(...),
    text: str = Form(...),
    rating: int = Form(5),
    location: str = Form(''),
    event: str = Form(''),
    photo: Optional[UploadFile] = File(None)
):
    photo_url = None
    if photo and photo.filename:
        try:
            contents = await photo.read()
            if contents:
                result = cloudinary.uploader.upload(contents, folder="reviews", resource_type="image")
                photo_url = result.get("secure_url")
        except Exception as e:
            logger.error(f"Review photo upload failed: {e}")

    review = {
        "id": str(uuid.uuid4()),
        "name": name,
        "text": text,
        "rating": max(1, min(5, rating)),
        "location": location,
        "event": event,
        "photo_url": photo_url,
        "verified": False,
        "approved": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reviews.insert_one(review)
    return {"message": "Review submitted for approval"}

@api_router.get("/admin/reviews")
async def get_all_reviews():
    reviews = await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return reviews

@api_router.patch("/admin/reviews/{review_id}")
async def update_review(review_id: str, updates: dict):
    allowed = {"name", "text", "rating", "location", "event", "verified", "approved"}
    clean = {k: v for k, v in updates.items() if k in allowed}
    if not clean:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    result = await db.reviews.update_one({"id": review_id}, {"$set": clean})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"message": "Review updated"}

@api_router.post("/admin/reviews/{review_id}/update")
async def update_review_with_photo(
    review_id: str,
    name: str = Form(...),
    text: str = Form(...),
    rating: int = Form(5),
    location: str = Form(''),
    event: str = Form(''),
    verified: str = Form('true'),
    photo: Optional[UploadFile] = File(None)
):
    photo_url = None
    if photo and photo.filename:
        try:
            import cloudinary.uploader
            contents = await photo.read()
            result = cloudinary.uploader.upload(contents, folder="reviews", resource_type="image")
            photo_url = result.get("secure_url")
        except Exception as e:
            logger.error(f"Review photo upload failed: {e}")

    updates = {
        "name": name, "text": text,
        "rating": max(1, min(5, rating)),
        "location": location, "event": event,
        "verified": verified.lower() == 'true',
    }
    if photo_url:
        updates["photo_url"] = photo_url

    result = await db.reviews.update_one({"id": review_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"message": "Review updated"}

@api_router.delete("/admin/reviews/{review_id}")
async def delete_review(review_id: str):
    await db.reviews.delete_one({"id": review_id})
    return {"message": "Review deleted"}

@api_router.post("/admin/reviews")
async def admin_add_review(
    name: str = Form(...),
    text: str = Form(...),
    rating: int = Form(5),
    location: str = Form(''),
    event: str = Form(''),
    verified: str = Form('true'),
    photo: Optional[UploadFile] = File(None)
):
    photo_url = None
    if photo and photo.filename:
        try:
            contents = await photo.read()
            if contents:
                result = cloudinary.uploader.upload(contents, folder="reviews", resource_type="image")
                photo_url = result.get("secure_url")
        except Exception as e:
            logger.error(f"Review photo upload failed: {e}")

    review = {
        "id": str(uuid.uuid4()),
        "name": name, "text": text,
        "rating": max(1, min(5, rating)),
        "location": location, "event": event,
        "photo_url": photo_url,
        "verified": verified.lower() == "true",
        "approved": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reviews.insert_one(review)
    return review

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
    logger.info("PartyTees API v2 starting up...")
    await db.templates.create_index("id", unique=True)
    await db.templates.create_index("categories")
    await db.photos.create_index("id", unique=True)
    await db.head_cutouts.create_index("id", unique=True)
    await db.orders.create_index("id", unique=True)
    await db.orders.create_index("order_number", unique=True)
    logger.info("Database indexes created")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
