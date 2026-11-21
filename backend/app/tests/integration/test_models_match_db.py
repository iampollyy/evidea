"""Guard against drift: the schema is owned by SQL migrations, the ORM only describes it.
If a migration changes a column and the model is not updated, this test fails."""

from importlib import import_module

from sqlalchemy import Engine, text

from evidea.core.db import Base

import_module("evidea.models")


def test_every_orm_column_exists_in_db_with_same_nullability(owner_engine: Engine) -> None:
    with owner_engine.connect() as connection:
        rows = connection.execute(
            text(
                "SELECT table_name, column_name, is_nullable = 'YES' "
                "FROM information_schema.columns WHERE table_schema = 'public'"
            )
        ).all()
    db_columns = {(table, column): nullable for table, column, nullable in rows}

    problems = []
    for table in Base.metadata.sorted_tables:
        for column in table.columns:
            key = (table.name, column.name)
            if key not in db_columns:
                problems.append(f"{table.name}.{column.name} is missing in the database")
            elif db_columns[key] != column.nullable:
                problems.append(
                    f"{table.name}.{column.name}: nullable is {db_columns[key]} in the database "
                    f"but {column.nullable} in the model"
                )
    assert not problems, "\n".join(problems)
