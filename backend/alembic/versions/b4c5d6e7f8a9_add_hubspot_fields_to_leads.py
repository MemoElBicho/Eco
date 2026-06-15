"""add_hubspot_fields_to_leads

Revision ID: b4c5d6e7f8a9
Revises: d5e8f2a1b3c4
Create Date: 2026-06-09 22:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b4c5d6e7f8a9'
down_revision: Union[str, None] = 'd5e8f2a1b3c4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('leads', sa.Column('hs_contact_id', sa.String(255), nullable=True))
    op.create_unique_constraint('uq_leads_hs_contact_id', 'leads', ['hs_contact_id'])
    op.add_column('leads', sa.Column('hs_last_sync', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_constraint('uq_leads_hs_contact_id', 'leads', type_='unique')
    op.drop_column('leads', 'hs_last_sync')
    op.drop_column('leads', 'hs_contact_id')
