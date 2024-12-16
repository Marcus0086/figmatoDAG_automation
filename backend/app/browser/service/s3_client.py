import boto3
import io
from datetime import datetime
from typing import Optional
from botocore.exceptions import ClientError
import logging

from app.config.config import get_settings

settings = get_settings()


class S3Client:
    def __init__(self):
        self.s3 = boto3.client(
            "s3",
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region,
        )
        self.bucket = settings.aws_s3_bucket

    async def upload_image(
        self,
        image_bytes: bytes,
        subfolder: str = "manual",
        prefix: Optional[str] = None,
    ) -> Optional[str]:
        """Upload image to S3 and return the URL"""
        try:
            # Generate unique filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
            prefix = f"{prefix}_" if prefix else ""
            key = f"{subfolder}/{prefix}{timestamp}.png"

            # Upload to S3
            self.s3.upload_fileobj(
                io.BytesIO(image_bytes),
                self.bucket,
                key,
                ExtraArgs={
                    "ContentType": "image/png",
                },
            )

            # Generate URL
            url = f"https://{self.bucket}.s3.amazonaws.com/{key}"
            return url

        except ClientError as e:
            logging.error(f"S3 upload error: {e}")
            return None
        except Exception as e:
            logging.error(f"Unexpected error during upload: {e}")
            return None
