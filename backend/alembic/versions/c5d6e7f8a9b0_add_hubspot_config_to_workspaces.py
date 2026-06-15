"""add_hubspot_config_to_workspaces

Revision ID: c5d6e7f8a9b0
Revises: b4c5d6e7f8a9
Create Date: 2026-06-09 22:05:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c5d6e7f8a9b0'
down_revision: Union[str, None] = 'b4c5d6e7f8a9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('workspace_configs', sa.Column('hubspot_access_token', sa.String(512), nullable=True))
    op.add_column('workspace_configs', sa.Column('hubspot_portal_id', sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column('workspace_configs', 'hubspot_portal_id')
    op.drop_column('workspace_configs', 'hubspot_access_token')
