"""
backend/routes/admin_orders.py
Admin endpoints for viewing, managing, and downloading orders
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pymongo import DESCENDING
from datetime import datetime
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Mock database - replace with your actual MongoDB connection
from backend.db import db

async def verify_admin(token: str = Depends(...)):
    """
    Verify user is admin
    Replace with your actual JWT/auth logic
    """
    # TODO: Implement actual admin verification
    # For now, just check if token exists
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True

@router.get("/orders")
async def get_all_orders(
    status: Optional[str] = Query(None, description="Filter by status: pending, completed, shipped, cancelled"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    sort_by: str = Query("createdAt", description="Field to sort by")
):
    """
    Get all customer orders with file URLs
    
    Query params:
    - status: Filter by order status (optional)
    - skip: Pagination offset
    - limit: Number of orders to return
    - sort_by: Field to sort by (default: createdAt)
    
    Returns:
    {
      "total": 42,
      "orders": [
        {
          "orderId": "ORD-123456",
          "customerName": "John Smith",
          "email": "john@example.com",
          "status": "pending",
          "quantity": 2,
          "partyMembers": [
            {
              "titleText": "JOHN",
              "subtitleText": "STAG DO",
              "designPngUrl": "https://r2.dev/orders/design-123.png",
              "originalPhotoUrl": "https://r2.dev/uploads/photo-456.jpg",
              "headCutoutUrl": "https://r2.dev/uploads/cutout-789.png"
            }
          ],
          "createdAt": "2026-07-13T10:00:00Z"
        }
      ]
    }
    """
    try:
        # Build filter
        filter_query = {}
        if status:
            filter_query["status"] = status
        
        # Get total count
        total = db.orders.count_documents(filter_query)
        
        # Sort
        sort_direction = DESCENDING if sort_by == "createdAt" else 1
        
        # Query with pagination
        orders_cursor = db.orders.find(filter_query).sort(
            sort_by, sort_direction
        ).skip(skip).limit(limit)
        
        orders = list(orders_cursor)
        
        # Clean up MongoDB _id for JSON serialization
        for order in orders:
            order["_id"] = str(order.get("_id", ""))
            order["createdAt"] = order.get("createdAt", "").isoformat() if order.get("createdAt") else None
            order["updatedAt"] = order.get("updatedAt", "").isoformat() if order.get("updatedAt") else None
        
        return {
            "total": total,
            "skip": skip,
            "limit": limit,
            "orders": orders
        }
        
    except Exception as e:
        logger.error(f"Error fetching orders: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/orders/{order_id}")
async def get_order_details(order_id: str):
    """
    Get single order with all file URLs
    
    Returns:
    {
      "orderId": "ORD-123456",
      "customerName": "John Smith",
      "partyMembers": [
        {
          "titleText": "JOHN",
          "designPngUrl": "https://r2.dev/orders/design-123.png",
          "originalPhotoUrl": "https://r2.dev/uploads/photo-456.jpg",
          "headCutoutUrl": "https://r2.dev/uploads/cutout-789.png"
        }
      ]
    }
    """
    try:
        order = db.orders.find_one({"orderId": order_id})
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Clean up for JSON
        order["_id"] = str(order.get("_id", ""))
        order["createdAt"] = order.get("createdAt", "").isoformat() if order.get("createdAt") else None
        order["updatedAt"] = order.get("updatedAt", "").isoformat() if order.get("updatedAt") else None
        
        return order
        
    except Exception as e:
        logger.error(f"Error fetching order: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/orders/{order_id}")
async def update_order_status(order_id: str, status: str):
    """
    Update order status (pending → completed → shipped)
    
    Body:
    {
      "status": "completed"
    }
    """
    try:
        valid_statuses = ["pending", "completed", "shipped", "cancelled"]
        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
        
        result = db.orders.update_one(
            {"orderId": order_id},
            {
                "$set": {
                    "status": status,
                    "updatedAt": datetime.utcnow(),
                    "completedAt": datetime.utcnow() if status == "completed" else None
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Order not found")
        
        return {"success": True, "orderId": order_id, "status": status}
        
    except Exception as e:
        logger.error(f"Error updating order: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/orders/{order_id}")
async def delete_order(order_id: str):
    """
    Delete order (soft delete - just mark as cancelled)
    
    Also deletes associated R2 files if needed
    """
    try:
        # Get order first to find file URLs
        order = db.orders.find_one({"orderId": order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # TODO: Delete files from R2 if needed
        # for party_member in order.get("partyMembers", []):
        #     if party_member.get("designPngUrl"):
        #         # Extract S3 key from URL and delete
        #         pass
        
        # Mark as cancelled instead of hard delete
        result = db.orders.update_one(
            {"orderId": order_id},
            {
                "$set": {
                    "status": "cancelled",
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Order not found")
        
        return {"success": True, "orderId": order_id, "deleted": True}
        
    except Exception as e:
        logger.error(f"Error deleting order: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/orders/search")
async def search_orders(q: str = Query(..., min_length=2)):
    """
    Search orders by customer name, email, or order ID
    
    Query params:
    - q: Search term (min 2 chars)
    """
    try:
        results = db.orders.find({
            "$or": [
                {"customerName": {"$regex": q, "$options": "i"}},
                {"email": {"$regex": q, "$options": "i"}},
                {"orderId": {"$regex": q, "$options": "i"}}
            ]
        }).limit(20)
        
        orders = list(results)
        
        # Clean up for JSON
        for order in orders:
            order["_id"] = str(order.get("_id", ""))
            order["createdAt"] = order.get("createdAt", "").isoformat() if order.get("createdAt") else None
        
        return {"results": orders, "count": len(orders)}
        
    except Exception as e:
        logger.error(f"Error searching orders: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/orders/stats")
async def get_orders_stats():
    """
    Get order statistics
    
    Returns:
    {
      "total": 42,
      "pending": 5,
      "completed": 30,
      "shipped": 7,
      "cancelled": 0,
      "totalRevenue": 1234.56
    }
    """
    try:
        total = db.orders.count_documents({})
        
        pending = db.orders.count_documents({"status": "pending"})
        completed = db.orders.count_documents({"status": "completed"})
        shipped = db.orders.count_documents({"status": "shipped"})
        cancelled = db.orders.count_documents({"status": "cancelled"})
        
        # Sum revenue
        revenue_pipeline = [
            {"$match": {"status": {"$ne": "cancelled"}}},
            {"$group": {"_id": None, "total": {"$sum": "$totalPrice"}}}
        ]
        revenue_result = list(db.orders.aggregate(revenue_pipeline))
        total_revenue = revenue_result[0]["total"] if revenue_result else 0
        
        return {
            "total": total,
            "pending": pending,
            "completed": completed,
            "shipped": shipped,
            "cancelled": cancelled,
            "totalRevenue": total_revenue
        }
        
    except Exception as e:
        logger.error(f"Error getting stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
