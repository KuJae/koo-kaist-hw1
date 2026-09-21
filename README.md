# 개인 소개 페이지 + 프론트엔드·백엔드 연동

KAIST 클라우드컴퓨팅실습 개인과제입니다.
개인 소개 페이지를 만들고, React 화면(Vercel)에서 FastAPI 백엔드(Render)를 호출해
그 결과를 화면에 보여 주는 것까지 한 바퀴 연결했습니다.

## 배포 주소

| 구분 | 주소 |
| --- | --- |
| 개인 소개 페이지 (Vercel) | <https://koo-kaist-hw1.vercel.app> |
| 연동 실습 페이지 | <https://koo-kaist-hw1.vercel.app/app/> |
| 백엔드 Swagger UI (Render) | <https://koo-kaist-hw1-api.onrender.com/docs> |
| GitHub 저장소 | <https://github.com/KuJae/koo-kaist-hw1> |

> 백엔드가 Render 무료 플랜이라 15분간 요청이 없으면 잠듭니다.
> 첫 접속은 다시 깨어나는 데 **30~60초** 걸릴 수 있습니다(콜드 스타트).

## 화면 구성

소개 페이지가 루트이고, 거기서 연동 실습 페이지로 이동합니다. 실습 페이지에서도 소개 페이지로 돌아옵니다.
두 페이지는 `src/glass.css`와 `src/theme.js`를 같이 써서 같은 디자인을 씁니다.
다크 모드는 시스템 설정을 따라가되, 우측 상단 버튼으로 직접 전환할 수 있고 선택은 브라우저에 저장됩니다.

```text
/        개인 소개 페이지 (정적 HTML)      ──[ 메모 앱 열어 보기 → ]──┐
                                      ┌──[ ← 개인 소개로 돌아가기 ]──┘
/app/    메모 앱 (React)  ────fetch────→  Render의 FastAPI  ──→  SQLite
```

## 3계층 구조

| 계층 | 기술 | 역할 | 배포처 |
| --- | --- | --- | --- |
| 프론트엔드 | React (Vite) | 화면·입력, API 호출 | Vercel |
| 백엔드 | FastAPI + Uvicorn | 요청을 받아 처리하는 API | Render |
| 데이터베이스 | SQLite (SQLAlchemy) | 데이터 저장 | Render 서버의 파일 |

브라우저가 Vercel에서 화면을 받고, 그 화면이 Render의 API를 부르고, API가 SQLite에 저장합니다.

## 주요 구성

```text
.
├── frontend/              # → Vercel (Root Directory: frontend)
│   ├── index.html         #   개인 소개 페이지 (정적 HTML, 빌드 진입점)
│   ├── app/index.html     #   메모 앱 진입점
│   ├── src/App.jsx        #   fetch로 백엔드를 호출하는 화면
│   ├── src/glass.css      #   두 페이지가 공유하는 색 토큰·유리 질감
│   ├── src/theme.js       #   두 페이지가 공유하는 다크모드 전환
│   ├── src/index.css      #   메모 앱 전용 레이아웃
│   ├── vite.config.js     #   페이지 두 개(MPA) 빌드 설정
│   └── .env.example       #   VITE_API_URL 예시
├── backend/               # → Render (Root Directory: backend)
│   ├── main.py            #   CORS 설정 + 엔드포인트 4종
│   ├── database.py        #   DB 연결·세션 (DATABASE_URL)
│   ├── models.py          #   Memo 클래스 = memos 테이블
│   └── requirements.txt   #   Render가 설치할 패키지 명세
└── render.yaml            # Render Blueprint (배포 설정)
```

## API

| 메서드 | 경로 | 하는 일 |
| --- | --- | --- |
| GET | `/` | 안내 메시지 |
| GET | `/memos` | 메모 전체 조회 |
| POST | `/memos` | 메모 저장 (`{"content": "..."}`) |
| DELETE | `/memos/{id}` | 메모 삭제 (없으면 404) |
| GET | `/docs` | Swagger UI — 브라우저에서 바로 테스트 |

## 환경변수

바뀌는 값은 코드가 아니라 환경변수에 둡니다.

| 변수 | 로컬 | 배포 |
| --- | --- | --- |
| `VITE_API_URL` (프론트) | `http://localhost:8000` | `https://koo-kaist-hw1-api.onrender.com` |
| `ALLOWED_ORIGINS` (백엔드) | `http://localhost:5173` | `https://koo-kaist-hw1.vercel.app` |
| `DATABASE_URL` (백엔드) | 없음 → `sqlite:///./memo.db` | 없음 → 같은 기본값 |

주소는 **끝에 `/` 없이** 넣습니다. `/`가 붙으면 CORS에서 출처가 달라 보여 요청이 막힙니다.

## 로컬에서 실행하기

두 폴더를 각각 다른 터미널에서 실행합니다.

**백엔드** (터미널 1)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload          # http://127.0.0.1:8000/docs
```

**프론트엔드** (터미널 2)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                        # http://localhost:5173
```

- `http://localhost:5173/` → 개인 소개 페이지
- `http://localhost:5173/app/` → 메모 앱

## 배운 것

- **3계층의 역할** — 프론트엔드는 보여 주고 입력받는 일, 백엔드는 요청을 받아 규칙대로 처리하는 일,
  DB는 그 결과를 남겨 두는 일을 맡는다. 셋은 각각 다른 곳에 배포되고 주소로만 서로를 안다.
- **fetch가 하는 일** — 브라우저가 다른 주소의 서버에 HTTP 요청을 보내고 JSON을 받아 온다.
  보낼 때 `JSON.stringify`, 받을 때 `res.json()`으로 JS 객체와 JSON 문자열 사이를 오간다.
- **인메모리와 SQLite의 차이(영속화)** — 파이썬 리스트에 담아 두면 서버를 끄는 순간 사라진다.
  SQLite로 바꾸면 `memo.db` 파일에 남아서 재시작해도 그대로 있다. 실제로 서버를 껐다 켜서 확인했다.
- **CORS** — 브라우저는 다른 출처로 보낸 요청의 응답을 기본으로 막는다. 막는 쪽은 서버가 아니라
  브라우저라서, 백엔드가 "이 출처는 허용한다"고 먼저 선언해야 한다.
- **환경변수** — 로컬과 배포에서 달라지는 값(API 주소, 허용 출처, DB 접속 정보)을 코드에서 빼내면
  코드를 고치지 않고 배포 환경만 바꿀 수 있다. Vite 환경변수는 **빌드 시점에 주입**되므로
  값만 바꾸고 재배포하지 않으면 반영되지 않는다.

### 막혔던 것

- 페이지를 두 개(`/` 소개, `/app/` 메모 앱) 두려니 Vite 기본 설정으로는 `index.html` 하나만 빌드됐다.
  `vite.config.js`의 `rollupOptions.input`에 진입점 두 개를 등록해 해결했다.
  `package.json`이 `"type": "module"`이라 `__dirname`을 쓸 수 없어 `import.meta.url`로 경로를 만들었다.
- 워크북 실습 때 켜 둔 개발 서버가 11일째 8000 포트를 잡고 있어서 새 백엔드가 뜨지 않았다.
  `lsof -i :8000`으로 원인을 찾았다.
- 유리 느낌을 내려고 배경에 색 덩어리를 깔았는데 화면에 전혀 안 보였다. `body`에 불투명한
  배경색이 있으면 `z-index: -1`인 자식은 그 배경 **뒤**에 그려지기 때문이었다.
  배경색을 `html`에만 두니 해결됐다.
- 모바일 화면을 헤드리스 Chrome으로 390px 폭에서 캡처했더니 레이아웃이 넘쳐 보였는데,
  macOS Chrome이 창 폭을 최소 500px로 강제해 생긴 착시였다. `innerWidth`와 `scrollWidth`를
  직접 재서 확인했고, 진짜 390px 레이아웃은 그 폭의 iframe에 넣어 확인했다.

## 참고

프론트엔드·백엔드 구현과 연동은 수업 실습워크북(2주차)의 단계를 따랐습니다.
개인 소개 페이지, 페이지 두 개 구성(MPA), API 호출 상태 표시는 과제에 맞게 직접 추가했습니다.
