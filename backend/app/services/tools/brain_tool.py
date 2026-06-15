from typing import TYPE_CHECKING

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.toolbox import BaseTool

if TYPE_CHECKING:
    from app.models.operator_instance import OperatorInstance


class BrainTool(BaseTool):
    tool_type = "brain"
    description = "Busca información en la base de conocimiento del negocio"

    def get_function_definition(self) -> dict:
        return {
            "name": "search_knowledge",
            "description": (
                "Busca información relevante en la base de conocimiento "
                "interna del negocio usando embeddings semánticos"
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": (
                            "Consulta o frase a buscar en la base de conocimiento"
                        ),
                    },
                },
                "required": ["query"],
            },
        }

    async def execute(
        self,
        params: dict,
        instance: "OperatorInstance",
        db: AsyncSession,
    ) -> str:
        from app.services.brain import query_brain

        results = await query_brain(
            query=params["query"],
            scope_id=str(instance.id),
            db=db,
        )
        if not results:
            return (
                "No se encontraron resultados en la base de conocimiento "
                "para la consulta proporcionada."
            )
        return "\n\n---\n\n".join(results)
