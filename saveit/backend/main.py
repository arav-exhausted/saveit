
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
import requests

from youtube_utils import get_youtube_metadata

app = FastAPI(title="SaveIT API")


# Allow requests from the React + Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class MetadataRequest(BaseModel):
    url: HttpUrl


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "message": "SaveIT backend is running!"
    }


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
