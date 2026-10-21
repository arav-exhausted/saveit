
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
import requests

import os
from dotenv import load_dotenv
from supabase import create_client

from youtube_utils import get_youtube_metadata

app = FastAPI(title="SaveIT API")


load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")


if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Supabase credentials missing in .env")


supabase  = create_client(SUPABASE_URL,SUPABASE_KEY)

# Allow requests from the React + Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST","DELETE","PATCH"],
    allow_headers=["*"],
)


class MetadataRequest(BaseModel):
    url: HttpUrl

class LinkCreate(BaseModel):
    url: HttpUrl
    platform: str
    title: str
    description: str = ""
    thumbnail_url: str | None = None
    reminder: bool = False
    watched: bool = False

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "message": "SaveIT backend is running!"
    }


@app.get("/dbtest")
def database_test():
    try:
        result = (
            supabase
            .table("links")
            .select("id")
            .limit(1)
            .execute()
        )

        return {
            "status": "ok",
            "message": "Supabase connected successfully!"
        }

    except Exception as exc:
        print("SUPABASE ERROR:", repr(exc))
        raise HTTPException(
            status_code=500,
            detail=str(exc)
        )



@app.post("/links")
def create_link(payload: LinkCreate):
    allowed_platforms = {
        "YouTube",
        "Instagram",
        "Reddit",
        "Other Links",
    }

    if payload.platform not in allowed_platforms:
        raise HTTPException(
            status_code=400,
            detail="Invalid platform",
        )

    try:
        link_data = {
            "url": str(payload.url),
            "platform": payload.platform,
            "title": payload.title,
            "description": payload.description,
            "thumbnail_url": payload.thumbnail_url,
            "reminder": payload.reminder,
            "watched": payload.watched,
        }

        result = (
            supabase
            .table("links")
            .insert(link_data)
            .execute()
        )

        return {
            "message": "Link saved successfully!",
            "link": result.data[0] if result.data else None,
        }

    except Exception as exc:
        print("SAVE LINK ERROR:", repr(exc))
        raise HTTPException(
            status_code=500,
            detail="Could not save link to database",
        )


@app.get("/links")
def get_links():
    try:
        result = (
            supabase
            .table("links")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )

        return {
            "links": result.data
        }

    except Exception as exc:
        print("FETCH LINKS ERROR:", repr(exc))
        raise HTTPException(
            status_code=500,
            detail="Could not fetch links from database",
        )

@app.delete("/links/{link_id}")
def delete_link(link_id: int):
    try:
        result = (
            supabase
            .table("links")
            .delete()
            .eq("id", link_id)
            .execute()
        )

        return {
            "message": "Link deleted successfully!"
        }

    except Exception as exc:
        print("DELETE LINK ERROR:", repr(exc))
        raise HTTPException(
            status_code=500,
            detail="Could not delete link from database"
        )


class LinkUpdate(BaseModel):
    watched: bool


@app.patch("/links/{link_id}")
def update_link(link_id: int, payload: LinkUpdate):
    try:
        result = (
            supabase
            .table("links")
            .update({"watched": payload.watched})
            .eq("id", link_id)
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=404,
                detail="Link not found"
            )

        return {
            "message": "Watched status updated!",
            "link": result.data[0]
        }

    except HTTPException:
        raise

    except Exception as exc:
        print("UPDATE LINK ERROR:", repr(exc))
        raise HTTPException(
            status_code=500,
            detail="Could not update watched status"
        )

@app.post("/youtube/metadata")
def youtube_metadata(payload: MetadataRequest):
    try:
        metadata = get_youtube_metadata(str(payload.url))
        return metadata

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc)
        )

    except requests.Timeout:
        raise HTTPException(
            status_code=504,
            detail="YouTube took too long to respond."
        )

    except requests.HTTPError:
        raise HTTPException(
            status_code=502,
            detail="Could not fetch video details from YouTube."
        )

    except requests.RequestException:
        raise HTTPException(
            status_code=502,
            detail="Could not connect to YouTube."
        )
