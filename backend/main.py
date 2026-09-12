import os
import json
from datetime import datetime, date, time, timedelta
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import OpenAI


# =========================================================
# ENVIRONMENT
# =========================================================

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
HF_TOKEN = os.getenv("HF_TOKEN")

PORT = int(os.getenv("FASTAPI_PORT", "8000"))


if not SUPABASE_URL:
    raise RuntimeError("SUPABASE_URL is missing")

if not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is missing")

if not HF_TOKEN:
    raise RuntimeError("HF_TOKEN is missing")


# =========================================================
# CLIENTS
# =========================================================

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
)

hf_client = OpenAI(
    base_url="https://router.huggingface.co/v1",
    api_key=HF_TOKEN
)

HF_MODEL = "Qwen/Qwen2.5-3B-Instruct:featherless-ai"


# =========================================================
# FASTAPI
# =========================================================

app = FastAPI(
    title="Student Digital Hub - AI Timetable API",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# MODELS
# =========================================================

class TimetableRequest(BaseModel):
    student_id: str
    planner_data: Dict[str, Any]


class SaveTimetableRequest(BaseModel):
    student_id: str
    timetable: List[Dict[str, Any]]


# =========================================================
# HELPERS
# =========================================================

DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
]


def time_to_minutes(value: str) -> int:
    """
    Convert HH:MM or HH:MM:SS into minutes.
    """

    if not value:
        return 0

    parts = value.split(":")
    hour = int(parts[0])
    minute = int(parts[1])

    return hour * 60 + minute


def minutes_to_time(minutes: int) -> str:
    """
    Convert minutes into HH:MM.
    """

    minutes = max(0, min(minutes, 1439))

    hour = minutes // 60
    minute = minutes % 60

    return f"{hour:02d}:{minute:02d}"


def overlaps(
    start1: int,
    end1: int,
    start2: int,
    end2: int
) -> bool:
    return start1 < end2 and start2 < end1


def safe_date(value):
    if not value:
        return None

    try:
        return date.fromisoformat(str(value)[:10])
    except Exception:
        return None


# =========================================================
# SUPABASE DATA
# =========================================================

def get_student_data(student_id: str):

    subjects_response = (
        supabase
        .table("ai_planner_subjects")
        .select("*")
        .eq("student_id", student_id)
        .execute()
    )

    settings_response = (
        supabase
        .table("ai_planner_settings")
        .select("*")
        .eq("student_id", student_id)
        .limit(1)
        .execute()
    )

    busy_response = (
        supabase
        .table("ai_planner_busy_times")
        .select("*")
        .eq("student_id", student_id)
        .execute()
    )

    breaks_response = (
        supabase
        .table("ai_planner_break_times")
        .select("*")
        .eq("student_id", student_id)
        .execute()
    )

    school_response = (
        supabase
        .table("ai_planner_school_timetable")
        .select("*")
        .eq("student_id", student_id)
        .execute()
    )

    return {
        "subjects": subjects_response.data or [],
        "settings": (settings_response.data or [None])[0],
        "busy_times": busy_response.data or [],
        "break_times": breaks_response.data or [],
        "school_timetable": school_response.data or []
    }


# =========================================================
# AI PRIORITY ANALYSIS
# =========================================================

def ask_ai_for_priority(data: Dict[str, Any]) -> List[str]:

    subjects = data["subjects"]
    settings = data["settings"]

    simplified_subjects = []

    for subject in subjects:
        simplified_subjects.append({
            "subject_name": subject.get("subject_name"),
            "priority": subject.get("priority"),
            "target_minutes": subject.get("target_minutes"),
            "exam_date": subject.get("exam_date"),
            "revision_enabled": subject.get("revision_enabled", True)
        })

    prompt = f"""
You are an AI study timetable assistant.

Analyze the student's subjects and return ONLY valid JSON.

Student settings:
{json.dumps(settings, default=str)}

Subjects:
{json.dumps(simplified_subjects, default=str)}

Return:

{{
  "priority_order": [
    "Subject 1",
    "Subject 2"
  ]
}}

Rules:
1. Subjects with closer exams should receive higher priority.
2. Higher priority subjects should come earlier.
3. Subjects with revision enabled should be considered.
4. Do not create new subjects.
5. Use the exact subject_name values.
6. Return JSON only.
"""

    try:

        response = hf_client.chat.completions.create(
            model=HF_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a precise timetable planning assistant."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,
            max_tokens=500
        )

        content = response.choices[0].message.content.strip()

        # Remove possible markdown fences
        content = content.replace("```json", "")
        content = content.replace("```", "")
        content = content.strip()

        result = json.loads(content)

        priority_order = result.get("priority_order", [])

        if isinstance(priority_order, list):
            return priority_order

    except Exception as error:
        print("AI priority analysis failed:", error)

    # Fallback
    return [
        subject.get("subject_name")
        for subject in sorted(
            subjects,
            key=lambda x: (
                -(x.get("priority") or 0),
                x.get("exam_date") or "9999-12-31"
            )
        )
    ]


# =========================================================
# CONSTRAINT CHECKING
# =========================================================

def get_day_blocks(
    day: str,
    busy_times: List[Dict],
    break_times: List[Dict],
    school_timetable: List[Dict]
):

    blocked = []

    # Busy times
    for item in busy_times:

        item_day = item.get("day_of_week")

        if item_day != day:
            continue

        start = time_to_minutes(str(item.get("start_time", "")))
        end = time_to_minutes(str(item.get("end_time", "")))

        if end > start:
            blocked.append((start, end))

    # Break times
    for item in break_times:

        item_day = item.get("day_of_week")

        if item_day != day:
            continue

        start = time_to_minutes(str(item.get("start_time", "")))
        end = time_to_minutes(str(item.get("end_time", "")))

        if end > start:
            blocked.append((start, end))

    # Existing school timetable
    for item in school_timetable:

        item_day = item.get("day_of_week")

        if item_day != day:
            continue

        start = time_to_minutes(str(item.get("start_time", "")))
        end = time_to_minutes(str(item.get("end_time", "")))

        if end > start:
            blocked.append((start, end))

    return blocked


def is_available(
    day: str,
    start: int,
    end: int,
    existing: List[Dict],
    blocked: List
):

    # Existing blocks
    for block_start, block_end in blocked:

        if overlaps(
            start,
            end,
            block_start,
            block_end
        ):
            return False

    # Already generated sessions
    for session in existing:

        if session["day_of_week"] != day:
            continue

        existing_start = time_to_minutes(
            session["start_time"]
        )

        existing_end = time_to_minutes(
            session["end_time"]
        )

        if overlaps(
            start,
            end,
            existing_start,
            existing_end
        ):
            return False

    return True


# =========================================================
# CONSTRAINT SOLVER
# =========================================================

def generate_timetable(
    data: Dict[str, Any],
    priority_order: List[str]
):

    settings = data["settings"] or {}

    subjects = data["subjects"]
    busy_times = data["busy_times"]
    break_times = data["break_times"]
    school_timetable = data["school_timetable"]

    if not subjects:
        raise HTTPException(
            status_code=400,
            detail="No subjects found for this student."
        )

    wake_time = settings.get("wake_time", "06:00")
    sleep_time = settings.get("sleep_time", "22:00")

    school_start = settings.get(
        "school_start_time",
        "08:00"
    )

    school_end = settings.get(
        "school_end_time",
        "14:00"
    )

    daily_study_minutes = int(
        settings.get(
            "daily_study_minutes",
            120
        ) or 120
    )

    exam_mode = bool(
        settings.get("exam_mode", False)
    )

    # We normally study after school.
    # If school times are unavailable, use wake/sleep.
    default_start = time_to_minutes(
        str(school_end)
    )

    default_end = time_to_minutes(
        str(sleep_time)
    )

    wake_minutes = time_to_minutes(
        str(wake_time)
    )

    if default_start <= wake_minutes:
        default_start = wake_minutes + 60

    if default_end <= default_start:
        default_end = 22 * 60

    timetable = []

    # Convert subjects into lookup
    subject_map = {
        item.get("subject_name"): item
        for item in subjects
    }

    # Use AI ordering first
    ordered_subjects = []

    for name in priority_order:

        if name in subject_map:
            ordered_subjects.append(
                subject_map[name]
            )

    # Add subjects AI missed
    for subject in subjects:

        if subject not in ordered_subjects:
            ordered_subjects.append(subject)

    # Keep weekly allocation reasonable
    subject_index = 0

    for day in DAYS:

        if len(timetable) >= 100:
            break

        blocked = get_day_blocks(
            day,
            busy_times,
            break_times,
            school_timetable
        )

        daily_used = 0

        current = default_start

        # Try to create several sessions
        while daily_used < daily_study_minutes:

            if not ordered_subjects:
                break

            subject = ordered_subjects[
                subject_index % len(ordered_subjects)
            ]

            subject_index += 1

            subject_name = subject.get(
                "subject_name",
                "Unknown Subject"
            )

            # Standard session length
            remaining = daily_study_minutes - daily_used

            session_length = min(
                60,
                remaining
            )

            # Don't create tiny sessions
            if session_length < 30:
                break

            found_slot = False

            search_start = current

            while search_start + session_length <= default_end:

                search_end = (
                    search_start +
                    session_length
                )

                if is_available(
                    day,
                    search_start,
                    search_end,
                    timetable,
                    blocked
                ):

                    exam_date = safe_date(
                        subject.get("exam_date")
                    )

                    is_revision = bool(
                        subject.get(
                            "revision_enabled",
                            True
                        )
                    )

                    activity_type = (
                        "exam_revision"
                        if exam_mode and is_revision
                        else "study"
                    )

                    ai_reason = (
                        "AI prioritized this subject "
                        "based on priority and exam date."
                    )

                    timetable.append({
                        "day_of_week": day,
                        "subject_name": subject_name,
                        "activity_type": activity_type,
                        "start_time": minutes_to_time(
                            search_start
                        ),
                        "end_time": minutes_to_time(
                            search_end
                        ),
                        "duration_minutes": session_length,
                        "is_revision": is_revision,
                        "is_exam_mode": exam_mode,
                        "ai_reason": ai_reason
                    })

                    daily_used += session_length

                    current = search_end

                    found_slot = True

                    break

                search_start += 15

            if not found_slot:
                break

    return timetable


# =========================================================
# GENERATE ENDPOINT
# =========================================================

@app.post("/api/timetable/generate")
def generate_timetable_api(
    request: TimetableRequest
):

    student_id = request.student_id.strip()

    if not student_id:
        raise HTTPException(
            status_code=400,
            detail="student_id is required."
        )

    try:

        # =====================================================
        # FRONTEND PLANNER DATA
        # =====================================================

        planner_data = request.planner_data or {}

        student_info = planner_data.get(
            "student",
            {}
        ) or {}

        subjects = planner_data.get(
            "subjects",
            []
        ) or []

        busy_times = planner_data.get(
            "busy_times",
            []
        ) or []

        break_times = planner_data.get(
            "break_times",
            []
        ) or []

        school_timetable = planner_data.get(
            "school_timetable",
            []
        ) or []

        study_goal = planner_data.get(
            "study_goal",
            ""
        ) or ""

        study_style = planner_data.get(
            "study_style",
            "balanced"
        ) or "balanced"

        # =====================================================
        # VALIDATION
        # =====================================================

        if not subjects:
            raise HTTPException(
                status_code=400,
                detail="At least one subject is required."
            )

        # =====================================================
        # NORMALIZE STUDENT SETTINGS
        # =====================================================

        def get_value(*keys, default=None):

            for key in keys:

                value = student_info.get(key)

                if value not in (
                    None,
                    ""
                ):
                    return value

            return default

        wake_time = get_value(
            "wakeTime",
            "wake_time",
            default="06:00"
        )

        sleep_time = get_value(
            "sleepTime",
            "sleep_time",
            default="22:00"
        )

        school_start = get_value(
            "schoolStart",
            "school_start_time",
            default="08:00"
        )

        school_end = get_value(
            "schoolEnd",
            "school_end_time",
            default="14:00"
        )

        daily_study_minutes = planner_data.get(
            "dailyStudyMinutes",
            planner_data.get(
                "daily_study_minutes",
                120
            )
        )

        break_minutes = planner_data.get(
            "breakMinutes",
            planner_data.get(
                "break_minutes",
                10
            )
        )

        try:
            daily_study_minutes = int(
                daily_study_minutes
            )
        except Exception:
            daily_study_minutes = 120

        try:
            break_minutes = int(
                break_minutes
            )
        except Exception:
            break_minutes = 10

        # =====================================================
        # NORMALIZE SUBJECTS
        # =====================================================

        priority_map = {
            "high": 3,
            "medium": 2,
            "low": 1
        }

        normalized_subjects = []

        for subject in subjects:

            if not isinstance(
                subject,
                dict
            ):
                continue

            subject_name = subject.get(
                "subject_name"
            )

            if not subject_name:
                subject_name = subject.get(
                    "name"
                )

            if not subject_name:
                continue

            priority = subject.get(
                "priority",
                "medium"
            )

            if isinstance(
                priority,
                str
            ):
                priority_value = priority_map.get(
                    priority.lower(),
                    2
                )
            else:
                try:
                    priority_value = int(
                        priority
                    )
                except Exception:
                    priority_value = 2

            target_minutes = subject.get(
                "target_minutes"
            )

            if target_minutes is None:
                target_minutes = subject.get(
                    "targetMinutes",
                    60
                )

            try:
                target_minutes = int(
                    target_minutes
                )
            except Exception:
                target_minutes = 60

            exam_date = subject.get(
                "exam_date"
            )

            if exam_date is None:
                exam_date = subject.get(
                    "examDate"
                )

            revision_enabled = subject.get(
                "revision_enabled"
            )

            if revision_enabled is None:
                revision_enabled = subject.get(
                    "revisionEnabled",
                    True
                )

            normalized_subjects.append({
                "subject_name": subject_name,
                "priority": priority_value,
                "target_minutes": target_minutes,
                "exam_date": exam_date,
                "revision_enabled": bool(
                    revision_enabled
                )
            })

        if not normalized_subjects:
            raise HTTPException(
                status_code=400,
                detail="No valid subjects were provided."
            )

        # =====================================================
        # DATA FOR AI + CONSTRAINT SOLVER
        # =====================================================

        data = {
            "student_id": student_id,

            "student": student_info,

            "settings": {
                "student_name": get_value(
                    "name",
                    "studentName",
                    default=""
                ),
                "grade": get_value(
                    "grade",
                    "studentGrade",
                    default=""
                ),
                "wake_time": wake_time,
                "sleep_time": sleep_time,
                "school_start_time": school_start,
                "school_end_time": school_end,
                "daily_study_minutes": daily_study_minutes,
                "break_minutes": break_minutes,
                "exam_mode": bool(
                    planner_data.get(
                        "exam_mode",
                        False
                    )
                ),
                "study_goal": study_goal,
                "study_style": study_style
            },

            "subjects": normalized_subjects,

            "busy_times": busy_times,

            "break_times": break_times,

            "school_timetable": school_timetable,

            "study_goal": study_goal,

            "study_style": study_style
        }

        # =====================================================
        # QWEN AI PRIORITY ANALYSIS
        # =====================================================

        priority_order = ask_ai_for_priority(
            data
        )

        # =====================================================
        # PYTHON CONSTRAINT SOLVER
        # =====================================================

        timetable = generate_timetable(
            data,
            priority_order
        )

        # =====================================================
        # RENDER-SAFE JSON RESPONSE
        # =====================================================

        return {
            "success": True,
            "student_id": student_id,
            "ai_model": HF_MODEL,
            "priority_order": priority_order,
            "timetable": timetable,
            "count": len(timetable)
        }

    except HTTPException:
        raise

    except Exception as error:

        print(
            "Timetable generation error:",
            repr(error)
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to generate timetable."
        )


# =========================================================
# SAVE ENDPOINT
# =========================================================

@app.post("/api/timetable/save")
def save_timetable_api(
    request: SaveTimetableRequest
):

    student_id = request.student_id.strip()

    if not student_id:
        raise HTTPException(
            status_code=400,
            detail="student_id is required."
        )

    if not request.timetable:
        raise HTTPException(
            status_code=400,
            detail="Timetable is empty."
        )

    try:

        rows = []

        now = datetime.utcnow().isoformat()

        for item in request.timetable:

            day_value = item.get("day_of_week")

            if isinstance(day_value, str):
                day_value = DAYS.index(day_value)

            rows.append({
                "student_id": student_id,
                "day_of_week": day_value,
                "subject_name": item.get(
                    "subject_name"
                ),
                "activity_type": item.get(
                    "activity_type",
                    "study"
                ),
                "start_time": item.get(
                    "start_time"
                ),
                "end_time": item.get(
                    "end_time"
                ),
                "duration_minutes": item.get(
                    "duration_minutes",
                    0
                ),
                "is_revision": item.get(
                    "is_revision",
                    False
                ),
                "is_exam_mode": item.get(
                    "is_exam_mode",
                    False
                ),
                "ai_reason": item.get(
                    "ai_reason"
                ),
                "created_at": now,
                "updated_at": now
            })

        result = (
            supabase
            .table("ai_generated_timetables")
            .insert(rows)
            .execute()
        )

        return {
            "success": True,
            "message": "Timetable saved successfully.",
            "saved_count": len(rows),
            "data": result.data
        }

    except Exception as error:

        print("Save timetable error:", error)

        raise HTTPException(
            status_code=500,
            detail="Failed to save timetable."
        )


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/")
def root():

    return {
        "success": True,
        "service": "Student Digital Hub AI Timetable Generator",
        "status": "online"
    }


@app.get("/health")
def health():

    return {
        "status": "healthy",
        "ai_model": HF_MODEL
    }


# =========================================================
# LOCAL DEVELOPMENT
# =========================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=PORT,
        reload=False
    )
