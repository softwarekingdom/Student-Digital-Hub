
"""
Student Digital Hub — XP Service
Uses PostgreSQL rank rules and the C++ XP engine.
Does not modify main.py.
"""

import os
import subprocess
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from supabase import create_client

app = FastAPI(
    title="Student Digital Hub XP Service",
    version="1.1.0",
)

BASE_DIR = Path(__file__).resolve().parent
XP_ENGINE = BASE_DIR / "xp_engine"

load_dotenv(BASE_DIR / ".env")


def get_rank_catalog():
    """Read rank rules from PostgreSQL through Supabase."""

    supabase_url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not service_key:
        raise HTTPException(
            status_code=500,
            detail="XP database configuration is missing",
        )

    try:
        supabase = create_client(
            supabase_url,
            service_key,
        )

        response = (
            supabase
            .table("xp_rank_catalog")
            .select(
                "rank_number,rank_code,rank_name,minimum_xp"
            )
            .order("rank_number")
            .execute()
        )

        ranks = response.data or []

        if not ranks:
            raise HTTPException(
                status_code=503,
                detail="No XP ranks are configured",
            )

        previous_threshold = -1

        for index, rank in enumerate(ranks, start=1):
            threshold = int(rank["minimum_xp"])

            if int(rank["rank_number"]) != index:
                raise ValueError("Rank numbers are not sequential")

            if threshold <= previous_threshold:
                raise ValueError("Rank thresholds must increase")

            previous_threshold = threshold

        return ranks

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Unable to load XP ranks from PostgreSQL",
        )


@app.get("/health")
def health_check():
    return {
        "success": True,
        "service": "sdh-xp",
        "status": "ready",
    }


@app.get("/xp/levels")
def get_rank_rules():
    return {
        "success": True,
        "ranks": get_rank_catalog(),
    }


@app.get("/xp/progress/{total_xp}")
def get_xp_progress(total_xp: int):
    if total_xp < 0:
        raise HTTPException(
            status_code=400,
            detail="XP cannot be negative",
        )

    if total_xp > 2_000_000_000:
        raise HTTPException(
            status_code=400,
            detail="XP value is too large",
        )

    if not XP_ENGINE.is_file():
        raise HTTPException(
            status_code=500,
            detail="C++ XP engine is not compiled",
        )

    ranks = get_rank_catalog()
    thresholds = [
        int(rank["minimum_xp"])
        for rank in ranks
    ]

    engine_input = (
        f"{total_xp} {len(thresholds)} "
        + " ".join(map(str, thresholds))
        + "\n"
    )

    try:
        result = subprocess.run(
            [str(XP_ENGINE)],
            input=engine_input,
            capture_output=True,
            text=True,
            timeout=3,
            check=True,
        )

        progress = {}

        for line in result.stdout.splitlines():
            key, separator, value = line.partition("=")

            if separator:
                progress[key] = int(value)

        required = {
            "total_xp",
            "rank_number",
            "current_rank_minimum_xp",
            "next_rank_number",
            "next_rank_minimum_xp",
            "rank_progress_percent",
        }

        if not required.issubset(progress):
            raise ValueError("Unexpected C++ engine output")

        current_number = progress["rank_number"]
        next_number = progress["next_rank_number"]

        current_rank = (
            ranks[current_number - 1]
            if current_number > 0
            else None
        )

        next_rank = (
            ranks[next_number - 1]
            if next_number > 0
            else None
        )

        return {
            "success": True,
            **progress,
            "current_rank": (
                current_rank["rank_name"]
                if current_rank else None
            ),
            "next_rank": (
                next_rank["rank_name"]
                if next_rank else None
            ),
        }

    except HTTPException:
        raise

    except (subprocess.SubprocessError, ValueError, OSError):
        raise HTTPException(
            status_code=500,
            detail="XP calculation failed",
        )
