from app.services.toolbox import ToolRegistry
from app.services.tools.brain_tool import BrainTool
from app.services.tools.crm_tool import CrmTool
from app.services.tools.escalate_tool import EscalateTool
from app.services.tools.webhook_out_tool import WebhookOutTool

ToolRegistry.register("brain", BrainTool)
ToolRegistry.register("crm", CrmTool)
ToolRegistry.register("escalate", EscalateTool)
ToolRegistry.register("webhook_out", WebhookOutTool)
