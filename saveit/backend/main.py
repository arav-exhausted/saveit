
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
import requests
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, ClientOptions
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

security = HTTPBearer()

def get_user_context(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token = credentials.credentials

    try:
        # Verify the access token with Supabase Auth
        auth_result = supabase.auth.get_user(token)
        user = auth_result.user

        if not user:
            raise HTTPException(status_code=401, detail="Invalid login session")

        # Use the user's token for database requests so RLS applies
        user_db = create_client(
            SUPABASE_URL,
            SUPABASE_KEY,
            options=ClientOptions(
                headers={"Authorization": f"Bearer {token}"}
            ),
        )

        return user, user_db

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired login session")

# Allow requests from the React + Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://saveitt.vercel.app"
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

class LinkUpdate(BaseModel):
    watched: bool

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
def create_link(
    payload: LinkCreate,
    context=Depends(get_user_context),
):
    user, user_db = context

    allowed_platforms = {"YouTube", "Instagram", "Reddit", "Other Links"}
    if payload.platform not in allowed_platforms:
        raise HTTPException(status_code=400, detail="Invalid platform")

    try:
        # Maximum 20 links per logged-in user
        count_result = (
            user_db.table("links")
            .select("id", count="exact")
            .eq("user_id", user.id)
            .execute()
        )

        if (count_result.count or 0) >= 20:
            raise HTTPException(
                status_code=400,
                detail="You can save a maximum of 20 links."
            )

        link_data = {
            "user_id": user.id,
            "url": str(payload.url),
            "platform": payload.platform,
            "title": payload.title,
            "description": payload.description,
            "thumbnail_url": payload.thumbnail_url,
            "reminder": payload.reminder,
            "watched": payload.watched,
        }

        result = user_db.table("links").insert(link_data).execute()

        return {
            "message": "Link saved successfully!",
            "link": result.data[0] if result.data else None,
        }

    except HTTPException:
        raise
    except Exception as exc:
        print("SAVE LINK ERROR:", repr(exc))
        raise HTTPException(
            status_code=500,
            detail="Could not save link to database"
        )


@app.get("/links")
def get_links(context=Depends(get_user_context)):
    user, user_db = context

    try:
        result = (
            user_db.table("links")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", desc=True)
            .execute()
        )
        return {"links": result.data}

    except Exception as exc:
        print("FETCH LINKS ERROR:", repr(exc))
        raise HTTPException(status_code=500, detail="Could not fetch links")


@app.delete("/links/{link_id}")
def delete_link(
    link_id: int,
    context=Depends(get_user_context),
):
    user, user_db = context

    try:
        result = (
            user_db.table("links")
            .delete()
            .eq("id", link_id)
            .eq("user_id", user.id)
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=404, detail="Link not found")

        return {"message": "Link deleted successfully!"}

    except HTTPException:
        raise
    except Exception as exc:
        print("DELETE LINK ERROR:", repr(exc))
        raise HTTPException(status_code=500, detail="Could not delete link")


@app.patch("/links/{link_id}")
def update_link(
    link_id: int,
    payload: LinkUpdate,
    context=Depends(get_user_context),
):
    user, user_db = context

    try:
        result = (
            user_db.table("links")
            .update({"watched": payload.watched})
            .eq("id", link_id)
            .eq("user_id", user.id)
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=404, detail="Link not found")

        return {
            "message": "Watched status updated!",
            "link": result.data[0],
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
