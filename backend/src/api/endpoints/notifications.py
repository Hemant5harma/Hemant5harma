from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List

from src.api.dependencies import get_db_session
from src.api.auth_utils import get_current_user
from src.database.models.models import User
from src.database.queries import (
    list_notifications,
    mark_notification_read,
    mark_all_notifications_read,
    get_unread_count,
)

router = APIRouter()


@router.get("")
async def get_notifications(
    status: Optional[str] = Query(None, description="Filter by status: unread|read"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    notifications = await list_notifications(db, current_user.id, status=status, limit=limit, offset=offset)
    return [
        {
            "id": n.id,
            "type": n.type,
            "title": n.title,
            "message": n.message,
            "severity": n.severity,
            "status": n.status,
            "bot_id": n.bot_id,
            "trade_id": n.trade_id,
            "extra_data": n.extra_data,
            "created_at": n.created_at,
            "read_at": n.read_at,
        }
        for n in notifications
    ]


@router.get("/unread-count")
async def unread_count(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    count = await get_unread_count(db, current_user.id)
    return {"count": count}


@router.patch("/{notification_id}/read")
async def mark_read(
    notification_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    ok = await mark_notification_read(db, current_user.id, notification_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True}


@router.post("/mark-all-read")
async def mark_all_read(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    count = await mark_all_notifications_read(db, current_user.id)
    return {"updated": count}



