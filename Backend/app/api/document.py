from fastapi import APIRouter

router = APIRouter()

@router.get("/test")
def test_document():
    return {
        "message": "Document API Working"
    }