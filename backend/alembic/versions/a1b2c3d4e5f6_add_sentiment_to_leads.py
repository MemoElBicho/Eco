"""add_sentiment_to_leads

Revision ID: a1b2c3d4e5f6
Revises: c5d6e7f8a9b0
Create Date: 2026-06-08 12:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'c5d6e7f8a9b0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('leads', sa.Column('sentiment', sa.Float(), nullable=True, server_default=sa.text('0.0')))
    op.add_column('leads', sa.Column('sentiment_label', sa.String(length=50), nullable=True, server_default=sa.text("'neutral'")))


def downgrade() -> None:
    op.drop_column('leads', 'sentiment_label')
    op.drop_column('leads', 'sentiment')
