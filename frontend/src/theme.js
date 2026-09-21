// 소개 페이지와 메모 앱이 함께 쓰는 다크모드 전환 로직.
//
// 기본값은 시스템 설정(prefers-color-scheme)이고, 버튼을 누르면 그걸 뒤집는다.
// 고른 값은 <html data-theme="light|dark"> 로 붙고 localStorage 에 남는다.
// 실제 색은 glass.css 의 토큰이 data-theme 를 보고 바뀐다.

const KEY = 'theme'

// 사생활 보호 모드 등에서 localStorage 접근 자체가 예외를 던진다.
// 테마 하나 때문에 페이지가 죽으면 안 되므로 전부 감싼다.
function readStored() {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    return null
  }
}

function writeStored(value) {
  try {
    localStorage.setItem(KEY, value)
  } catch {
    /* 저장 못 해도 이번 방문에는 정상 동작한다 */
  }
}

function systemPrefersDark() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

/** 지금 화면이 실제로 어두운 상태인가 */
export function currentTheme() {
  return readStored() ?? (systemPrefersDark() ? 'dark' : 'light')
}

/** 저장해 둔 선택을 <html> 에 반영한다. 첫 페인트 전에 불러야 깜빡이지 않는다. */
export function applyStoredTheme() {
  const stored = readStored()
  if (stored) document.documentElement.dataset.theme = stored
}

function label(theme) {
  return theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'
}

function icon(theme) {
  return theme === 'dark' ? '☀︎' : '☾'
}

function paint(button, theme) {
  button.textContent = icon(theme)
  button.setAttribute('aria-label', label(theme))
  button.setAttribute('title', label(theme))
}

/** 버튼에 전환 동작을 붙인다. */
export function setupThemeToggle(button) {
  if (!button) return

  paint(button, currentTheme())

  button.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    writeStored(next)
    paint(button, next)
  })
}
