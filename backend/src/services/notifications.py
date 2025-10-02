import logging
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from src.database.queries import create_notification

logger = logging.getLogger(__name__)


class NotificationService:
    @staticmethod
    async def emit(
        db: AsyncSession,
        *,
        user_id: int,
        type: str,
        title: str,
        message: str,
        severity: str = "info",
        bot_id: Optional[int] = None,
        trade_id: Optional[int] = None,
        extra_data: Optional[Dict[str, Any]] = None,
    ) -> None:
        try:
            await create_notification(
                db,
                user_id=user_id,
                type=type,
                title=title,
                message=message,
                severity=severity,
                bot_id=bot_id,
                trade_id=trade_id,
                extra_data=extra_data or {},
            )
        except Exception as e:
            # Never break the main flow due to notification failure
            logger.error(f"Failed to emit notification {type} for user {user_id}: {e}")
            
            # If it's a foreign key constraint error, try again without the foreign key references
            if "foreign key" in str(e).lower() or "fkey" in str(e).lower():
                try:
                    logger.info(f"Retrying notification {type} without foreign key references")
                    await create_notification(
                        db,
                        user_id=user_id,
                        type=type,
                        title=title,
                        message=message,
                        severity=severity,
                        bot_id=None,  # Remove foreign key reference
                        trade_id=None,  # Remove foreign key reference
                        extra_data={
                            **(extra_data or {}),
                            "original_bot_id": bot_id,
                            "original_trade_id": trade_id,
                        },
                    )
                    logger.info(f"Successfully created notification {type} without foreign keys")
                except Exception as retry_error:
                    logger.error(f"Failed to emit notification {type} even without foreign keys: {retry_error}")
            
            # Always try to rollback to keep the main transaction clean
            try:
                await db.rollback()
            except Exception:
                pass


