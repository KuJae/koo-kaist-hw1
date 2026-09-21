import { useState, useEffect, useRef } from "react";
import { setupThemeToggle } from "./theme.js";

// 백엔드 API 주소. 로컬은 .env, 배포는 Vercel 환경변수에서 읽는다.
// VITE_ 로 시작하는 변수만 브라우저 코드에 노출된다.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function App() {
  const [memos, setMemos] = useState([]);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const themeBtn = useRef(null);

  // 소개 페이지와 같은 다크모드 전환 로직을 그대로 쓴다.
  useEffect(() => { setupThemeToggle(themeBtn.current); }, []);

  // 세 함수 모두 실패하면 화면에 이유를 보여 준다.
  // 그냥 두면 백엔드가 잠들었을 때 화면이 빈 채로 멈춘 것처럼 보인다.
  const run = async (job) => {
    try {
      await job();
      setStatus("ready");
      setError("");
    } catch (e) {
      setStatus("error");
      setError(e.message);
    }
  };

  const loadMemos = () => run(async () => {
    const res = await fetch(`${API_URL}/memos`);          // 목록 조회 GET
    if (!res.ok) throw new Error(`서버가 ${res.status} 응답을 보냈습니다.`);
    setMemos(await res.json());
  });

  const addMemo = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    await run(async () => {
      const res = await fetch(`${API_URL}/memos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),          // JS 객체 → JSON 문자열
      });
      if (!res.ok) throw new Error(`서버가 ${res.status} 응답을 보냈습니다.`);
      setText("");
      const list = await fetch(`${API_URL}/memos`);
      setMemos(await list.json());                        // 저장됐는지 서버에서 다시 받아 확인
    });
    setBusy(false);
  };

  const deleteMemo = (id) => run(async () => {
    const res = await fetch(`${API_URL}/memos/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`서버가 ${res.status} 응답을 보냈습니다.`);
    const list = await fetch(`${API_URL}/memos`);
    setMemos(await list.json());
  });

  // 처음 뜰 때 서버에서 목록을 불러온다.
  // (loadMemos 를 선언한 뒤에 둬야 초기화 전 참조 경고가 나지 않는다)
  useEffect(() => { loadMemos(); }, []);

  return (
    <>
    <div className="blob" aria-hidden="true" />
    <div className="wrap">
      <div className="top-bar">
        <a className="back pill" href="/">← 개인 소개 페이지로 돌아가기</a>
        <button ref={themeBtn} className="pill theme-btn" type="button">☾</button>
      </div>

      <h1>📝 메모장</h1>
      <p className="lede">
        이 화면(Vercel)에서 입력한 메모는 백엔드(Render의 FastAPI)에 저장됩니다.
        새로고침해도 목록이 남아 있으면 연동에 성공한 것입니다.
      </p>
      <p className="endpoint">
        호출 중인 백엔드 · <code>{API_URL}</code>{" "}
        <a href={`${API_URL}/docs`} target="_blank" rel="noopener">Swagger UI 열기 ↗</a>
      </p>

      <div className="card glass">
        <div className="row">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addMemo()}
            placeholder="메모를 입력하세요"
          />
          <button onClick={addMemo} disabled={busy}>
            {busy ? "저장 중…" : "추가"}
          </button>
        </div>

        <p className={status === "error" ? "status error" : "status"}>
          {status === "loading" &&
            "백엔드를 부르는 중입니다… 무료 플랜이라 첫 호출은 30~60초 걸릴 수 있습니다."}
          {status === "error" && `백엔드 호출 실패 — ${error}`}
          {status === "ready" && memos.length === 0 &&
            "백엔드 응답 성공. 아직 저장된 메모가 없습니다."}
          {status === "ready" && memos.length > 0 &&
            `백엔드 응답 성공 — 메모 ${memos.length}개를 불러왔습니다.`}
        </p>

        {status === "error" && (
          <p className="status">
            <button onClick={loadMemos}>다시 시도</button>
          </p>
        )}

        <ul>
          {memos.map((m) => (
            <li key={m.id}>
              <span className="id">#{m.id}</span>
              <span className="content">{m.content}</span>
              <button onClick={() => deleteMemo(m.id)}>삭제</button>
            </li>
          ))}
        </ul>
      </div>

      <footer>React (Vercel) → FastAPI (Render) → SQLite</footer>
    </div>
    </>
  );
}
