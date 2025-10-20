import { useEffect, useState } from 'react'
export default function ThemeToggle(){
  const [dark, setDark] = useState(false)
  useEffect(()=>{ document.documentElement.classList.toggle('dark', dark) },[dark])
  return <button className="rounded-xl border px-3 py-2" onClick={()=>setDark(!dark)}>{dark? '🌙' : '☀️'}</button>
}
