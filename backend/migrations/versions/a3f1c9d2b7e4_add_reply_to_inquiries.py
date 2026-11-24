"""Add seller reply to inquiries

Revision ID: a3f1c9d2b7e4
Revises: 7ebd9248d50a
Create Date: 2026-11-24 04:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a3f1c9d2b7e4'
down_revision = '7ebd9248d50a'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('inquiry', schema=None) as batch_op:
        batch_op.add_column(sa.Column('reply', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('replied_at', sa.DateTime(), nullable=True))


def downgrade():
    with op.batch_alter_table('inquiry', schema=None) as batch_op:
        batch_op.drop_column('replied_at')
        batch_op.drop_column('reply')