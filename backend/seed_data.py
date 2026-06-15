"""Seed demo data: workspace, user, operator instance, leads + conversations.
Usage: python seed_data.py"""

import asyncio

from app.database import async_session
from app.seed.operators import seed_operator_templates
from app.seed.seed_data import seed_demo_data


async def main() -> None:
    async with async_session() as db:
        print("Seeding operator templates...")
        await seed_operator_templates(db)
        await db.commit()
        print("Templates OK.\n")

    async with async_session() as db:
        print("Seeding demo data...")
        await seed_demo_data(db)
        await db.commit()
        print("\nDone. Demo data ready.")


if __name__ == "__main__":
    asyncio.run(main())
