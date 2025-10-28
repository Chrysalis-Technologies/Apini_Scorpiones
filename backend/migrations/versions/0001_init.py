"""Initial schema"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite


revision = "0001_init"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "zones",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(length=100), nullable=False, unique=True),
        sa.Column("color", sa.String(length=20)),
        sa.Column("icon", sa.String(length=50)),
        sa.Column("description", sa.Text()),
        sa.Column("slug", sa.String(length=100), nullable=False, unique=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    op.create_table(
        "anchors",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("zone_id", sa.String(), sa.ForeignKey("zones.id")),
        sa.Column("anchor_id", sa.String(length=200), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("photo_url", sa.String(length=500)),
        sa.Column("floorplan_ref", sa.String(length=200)),
        sa.Column("coords", sa.JSON(), nullable=True),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint("anchor_id", name="uq_anchor_anchor_id"),
    )

    item_type_enum = sa.Enum("task", "note", name="itemtype")
    item_status_enum = sa.Enum("open", "done", name="itemstatus")

    op.create_table(
        "items",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("zone_id", sa.String(), sa.ForeignKey("zones.id")),
        sa.Column("anchor_id", sa.String(), sa.ForeignKey("anchors.id")),
        sa.Column("type", item_type_enum, nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("body", sa.Text()),
        sa.Column("status", item_status_enum, nullable=False, server_default="open"),
        sa.Column("priority", sa.Integer()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    capture_source_enum = sa.Enum(
        "voice", "text", "nfc", "import", name="capturesource"
    )

    op.create_table(
        "captures",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("raw_text", sa.Text(), nullable=False),
        sa.Column("source", capture_source_enum, nullable=False),
        sa.Column("location", sa.String(length=200)),
        sa.Column("inferred_anchor_id", sa.String(), sa.ForeignKey("anchors.id")),
        sa.Column("inferred_zone_id", sa.String(), sa.ForeignKey("zones.id")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    op.create_table(
        "breadcrumbs",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("anchor_id", sa.String(), sa.ForeignKey("anchors.id"), index=True),
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "last_action_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.false()),
    )

    op.create_table(
        "routesets",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("anchor_ids", sa.JSON(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    device_enum = sa.Enum("iphone", "watch", "laptop", name="devicetype")

    op.create_table(
        "scan_logs",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("anchor_id", sa.String(), sa.ForeignKey("anchors.id"), index=True),
        sa.Column("device", device_enum, nullable=False),
        sa.Column(
            "at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("location", sa.String(length=200)),
    )

    op.create_table(
        "mood_logs",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("zone_id", sa.String(), sa.ForeignKey("zones.id")),
        sa.Column("mood", sa.Integer(), nullable=False),
        sa.Column("energy", sa.Integer(), nullable=False),
        sa.Column(
            "at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )


def downgrade() -> None:
    op.drop_table("mood_logs")
    op.drop_table("scan_logs")
    op.drop_table("routesets")
    op.drop_table("breadcrumbs")
    op.drop_table("captures")
    op.drop_table("items")
    op.drop_table("anchors")
    op.drop_table("zones")
