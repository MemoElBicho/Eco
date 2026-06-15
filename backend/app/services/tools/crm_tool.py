from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lead import Lead
from app.services.toolbox import BaseTool

if TYPE_CHECKING:
    from app.models.operator_instance import OperatorInstance


class CrmTool(BaseTool):
    tool_type = "crm"
    description = "Actualiza el estado o datos de un contacto/lead en el CRM"

    def get_function_definition(self) -> dict:
        return {
            "name": "update_lead_status",
            "description": (
                "Actualiza el estado o las notas de un contacto/lead "
                "en el sistema CRM"
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "enum": [
                            "new",
                            "contacted",
                            "qualified",
                            "negotiation",
                            "closed_won",
                            "closed_lost",
                        ],
                        "description": "Nuevo estado del lead en el pipeline",
                    },
                    "notes": {
                        "type": "string",
                        "description": (
                            "Notas adicionales sobre la interacción con el lead"
                        ),
                    },
                },
                "required": ["status"],
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
        if not lead:
            return (
                "No se encontró un lead activo para esta instancia "
                "del operador."
            )

        status = params["status"]
        lead.status = status
        if "notes" in params:
            lead.notes = params["notes"]
        lead.updated_at = datetime.utcnow()
        await db.commit()
        return f"Contacto actualizado: estado={status}"
