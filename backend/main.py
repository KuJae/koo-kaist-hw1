import os
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import engine, SessionLocal, Base
import models

Base.metadata.create_all(bind=engine)  # 앱 시작 시 테이블이 없으면 생성

app = FastAPI(
    title="메모 API",
    description="클라우드컴퓨팅실습 개인과제 — 프론트엔드(Vercel)에서 호출하는 백엔드 API",
    version="1.0.0",
)

# ── CORS: 허용 출처를 환경변수로 (배포 시 Vercel 주소로) ──
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 요청마다 DB 세션을 열고, 끝나면 반드시 닫는 의존성 함수
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class MemoIn(BaseModel):
    content: str


class MemoOut(BaseModel):
    id: int
    content: str
    model_config = {"from_attributes": True}  # ORM 객체 → Pydantic 변환 허용(v2)


@app.get("/", tags=["안내"])
def root():
    """루트 주소로 들어왔을 때 어디로 가야 하는지 알려 준다."""
    return {
        "message": "메모 API — 클라우드컴퓨팅실습 개인과제",
        "docs": "/docs",
        "memos": "/memos",
    }


@app.get("/memos", response_model=list[MemoOut], tags=["메모"])
def list_memos(db: Session = Depends(get_db)):
    """저장된 메모를 모두 돌려준다."""
    return db.query(models.Memo).all()


@app.post("/memos", response_model=MemoOut, tags=["메모"])
def create_memo(memo: MemoIn, db: Session = Depends(get_db)):
    """메모를 하나 저장하고, DB가 매긴 id와 함께 돌려준다."""
    new = models.Memo(content=memo.content)
    db.add(new)
    db.commit()
    db.refresh(new)
    return new


@app.delete("/memos/{memo_id}", tags=["메모"])
def delete_memo(memo_id: int, db: Session = Depends(get_db)):
    """id로 메모 하나를 지운다. 없으면 404."""
    obj = db.get(models.Memo, memo_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Memo not found")
    db.delete(obj)
    db.commit()
    return {"ok": True}
