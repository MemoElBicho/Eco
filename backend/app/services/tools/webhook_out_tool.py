from typing import TYPE_CHECKING

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.operator_tool import OperatorTool
from app.services.toolbox import BaseTool

if TYPE_CHECKING:
    from app.models.operator_instance import OperatorInstance


class WebhookOutTool(BaseTool):
    tool_type = "webhook_out"
    description = "Llama a una API externa del negocio (ERP, inventarios, etc.)"

    def get_function_definition(self) -> dict:
        return {
            "name": "call_external_api",
            "description": (
                "Realiza una petición HTTP a una API externa configurada "
                "por el negocio para consultar o enviar datos"
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "endpoint": {
                        "type": "string",
                        "description": (
                            "URL completa del endpoint a llamar, "
                            "ej: https://api.ejemplo.com/v1/productos"
                        ),
                    },
                    "method": {
                        "type": "string",
                        "enum": ["GET", "POST"],
                        "description": "Método HTTP de la petición",
                    },
                    "data": {
                        "type": "object",
                        "description": (
                            "Cuerpo JSON a enviar (solo para peticiones POST)"
                        ),
                    },
                },
                "required": ["endpoint", "method"],
            },
        }

    async def execute(
        self,
        params: dict,
        instance: "OperatorInstance",
        db: AsyncSession,
    ) -> str:
        result = await db.execute(
            select(OperatorTool.config).where(
                OperatorTool.operator_instance_id == instance.id,
                OperatorTool.tool_type == "webhook_out",
                OperatorTool.is_enabled == True,
            )
        )
        tool_config = result.scalar_one_or_none() or {}
        headers = tool_config.get("headers", {})

        endpoint = params["endpoint"]
        method = params.get("method", "GET").upper()
        data = params.get("data")

        try:
            async with httpx.AsyncClient() as client:
                if method == "POST":
                    resp = await client.post(
                        endpoint, json=data, headers=headers, timeout=30
                    )
                else:
                    resp = await client.get(
                        endpoint, headers=headers, timeout=30
                    )
                resp.raise_for_status()
                return resp.text[:500]
        except Exception as exc:
            return f"Error al llamar la API externa: {exc}"
