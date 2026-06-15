import asyncio

from app.database import async_session
from app.seed.operators import seed_operator_templates


async def main():
    async with async_session() as db:
        await seed_operator_templates(db)
        await db.commit()
        print("Operator templates seeded.")


if __name__ == "__main__":
    asyncio.run(main())
