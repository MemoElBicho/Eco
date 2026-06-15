from typing import TYPE_CHECKING

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lead import Lead
from app.services.toolbox import BaseTool

if TYPE_CHECKING:
    from app.models.operator_instance import OperatorInstance


async def broadcast_notification(
    instance_id: object, event_type: str, payload: str
) -> None:
    pass


class EscalateTool(BaseTool):
    tool_type = "escalate"
    description = "Escala la conversación de inmediato a un agente humano"

    def get_function_definition(self) -> dict:
        return {
            "name": "escalate_to_human",
            "description": (
                "Escala la conversación actual a un agente humano "
                "y desactiva el bot para este contacto"
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "reason": {
                        "type": "string",
                        "description": (
                            "Razón por la cual se solicita intervención humana"
                        ),
                    },
                },
                "required": ["reason"],
            },
        }

    async def execute(
        self,
        params: dict,
        instance: "OperatorInstance",
        db: AsyncSession,
    ) -> str:
        stmt = (
            select(Lead)
            .where(Lead.operator_instance_id == instance.id)
            .order_by(Lead.updated_at.desc())
        )
        if "lead_id" in params:
            stmt = stmt.where(Lead.id == params["lead_id"])
        result = await db.execute(stmt)
        lead = result.scalars().first()
        if lead:
            lead.bot_active = False
            await db.commit()

        await broadcast_notification(
            instance.id, "escalation", params.get("reason", "")
        )

        return (
            "Conversación escalada a un agente humano. "
            "El bot se ha pausado para este contacto."
        )
