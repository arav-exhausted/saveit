from urllib.parse import urlparse,parse_qs

import re
import requests


def extract_url_id(url:str) -> str | None:
    try:
        parsed = urlparse(
            url if "://" in url else f"https://{url}"
        )
        host = (parsed.hostname or "").lower()

         
        if host not in {
            "youtube.com",
            "www.youtube.com",
            "m.youtube.com",
            "music.youtube.com",
            "youtu.be",
            "www.youtu.be",
        }:
            return None

        video_id = None
        if host.endswith("youtu.be"):
            video_id = parsed.path.strip("/").split("/")[0]
        elif parsed.path == "/watch":
            video_id = parse_qs(parsed.query).get("v", [None])[0]
        else:
            match = re.match(
                r"^/(?:shorts|embed|live)/([^/?]+)",
                parsed.path,
            )
            if match:
                video_id = match.group(1)

        if video_id and re.fullmatch(
            r"[A-Za-z0-9_-]{11}", video_id
        ):
            return video_id

        return None

    except (ValueError, AttributeError):
        return None

def get_youtube_metadata(url: str) -> dict:
    video_id = extract_url_id(url)

    if not video_id:
        raise ValueError("Please enter a valid YouTube video URL.")

    canonical_url = (
        f"https://www.youtube.com/watch?v={video_id}"
    )

    response = requests.get(
        "https://www.youtube.com/oembed",
        params={
            "url": canonical_url,
            "format": "json",
        },
        timeout=10,
    )

    if response.status_code in (401, 403, 404):
        raise ValueError(
            "This video is unavailable or its metadata cannot be fetched."
        )

    response.raise_for_status()
    data = response.json()

    return {
        "platform": "YouTube",
        "video_id": video_id,
        "title": data.get("title", ""),
        "channel_title": data.get("author_name", ""),
        "thumbnail": data.get("thumbnail_url", ""),
        "url": canonical_url,
    }