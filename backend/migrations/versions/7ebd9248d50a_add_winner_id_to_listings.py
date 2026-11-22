"""Add winner_id to listings

Revision ID: 7ebd9248d50a
Revises: 27c522cb0871
Create Date: 2026-11-13 19:57:40.484057

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7ebd9248d50a'
down_revision = '27c522cb0871'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('listing', schema=None) as batch_op:
        batch_op.add_column(sa.Column('winner_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            'fk_listing_winner_id_user',  # ← real name
            'user',
            ['winner_id'],
            ['id'],
        )


def downgrade():
    with op.batch_alter_table('listing', schema=None) as batch_op:
        batch_op.drop_constraint('fk_listing_winner_id_user', type_='foreignkey')
        batch_op.drop_column('winner_id')