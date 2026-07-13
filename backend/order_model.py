"""
backend/models/order.py
MongoDB Order schema with file URLs
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class PartyMember(BaseModel):
    """Individual person in an order"""
    templateId: str
    templateName: str
    headCutoutId: Optional[str] = None
    titleText: str  # e.g., "TIM'S"
    subtitleText: str  # e.g., "STAG DO | BENIDORM 2025"
    shirtType: str  # "mens", "womens", "unisex"
    shirtColor: str
    size: str
    hasBackPrint: bool = False
    backName: Optional[str] = None
    backNumber: Optional[str] = None
    headPlacement: dict = {}
    originalPhotoUrl: Optional[str] = None  # Raw photo uploaded by customer
    headUrl: Optional[str] = None  # Face cutout extracted by backend
    previewUrl: Optional[str] = None
    
    # NEW: File URLs saved when order created
    designPngUrl: Optional[str] = None  # PNG export of canvas design
    
    class Config:
        json_schema_extra = {
            "example": {
                "templateId": "gold-guy",
                "templateName": "Gold Guy",
                "titleText": "TIM'S",
                "subtitleText": "STAG DO | BENIDORM 2025",
                "shirtType": "mens",
                "shirtColor": "black",
                "size": "L",
                "originalPhotoUrl": "https://r2.dev/uploads/photo-123.jpg",
                "headUrl": "https://r2.dev/uploads/cutout-456.png",
                "designPngUrl": "https://r2.dev/orders/design-789.png"
            }
        }

class Order(BaseModel):
    """Complete order with multiple people and file URLs"""
    orderId: str = Field(..., description="Unique order ID (ORD-xxxxx)")
    customerName: str
    email: str
    phone: Optional[str] = None
    
    # Order details
    partyMembers: List[PartyMember]
    quantity: int = 1
    totalPrice: float
    
    # Shipping
    shippingAddress: Optional[dict] = None
    
    # Payment
    paymentIntentId: Optional[str] = None
    status: str = "pending"  # pending, completed, shipped, cancelled
    
    # Metadata
    source: str = "website"  # "website", "amazon", "etsy", "manual"
    notes: Optional[str] = None
    
    # Timestamps
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    completedAt: Optional[datetime] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "orderId": "ORD-123456",
                "customerName": "John Smith",
                "email": "john@example.com",
                "partyMembers": [
                    {
                        "templateId": "gold-guy",
                        "templateName": "Gold Guy",
                        "titleText": "JOHN'S",
                        "subtitleText": "STAG DO",
                        "shirtType": "mens",
                        "shirtColor": "black",
                        "size": "L",
                        "originalPhotoUrl": "https://r2.dev/uploads/photo-123.jpg",
                        "headUrl": "https://r2.dev/uploads/cutout-456.png",
                        "designPngUrl": "https://r2.dev/orders/design-789.png"
                    }
                ],
                "status": "pending"
            }
        }

class OrderResponse(BaseModel):
    """Response format for order endpoints"""
    orderId: str
    customerName: str
    email: str
    status: str
    quantity: int
    partyMembers: List[PartyMember]
    createdAt: datetime
    
    class Config:
        from_attributes = True
