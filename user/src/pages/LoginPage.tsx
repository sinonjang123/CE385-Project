import { useState, type FormEvent } from "react";
import axios from "axios";
import { ZodError } from "zod";
import { login, register } from "../api/auth.api";
import { loginSchema, registerSchema } from "../api/schemas";
import type { AuthUser } from "../types/models";

export default function LoginPage({ onCancel, onSuccess }: {
  onCancel: () => void;
  onSuccess: (user: AuthUser, token: string) => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function changeMode(nextMode: "login" | "register") {
    setMode(nextMode);
    setErrorMessage("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    const validation = mode === "login"
      ? loginSchema.safeParse({ email, password })
      : registerSchema.safeParse({ displayName, email, password, confirmPassword });
    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message ?? "กรุณาตรวจสอบข้อมูล");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = mode === "login"
        ? await login({ email, password })
        : await register({ displayName, email, password, confirmPassword });
      onSuccess(result.user, result.accessToken);
    } catch (error) {
      if (error instanceof ZodError) {
        setErrorMessage("ข้อมูลจากเซิร์ฟเวอร์ไม่ถูกต้อง");
      } else if (axios.isAxiosError<{ message?: string }>(error)) {
        setErrorMessage(error.response?.data?.message ?? "เชื่อมต่อ API ไม่สำเร็จ กรุณาตรวจสอบว่า backend กำลังทำงาน");
      } else {
        setErrorMessage(mode === "login" ? "เข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง" : "สมัครสมาชิกไม่สำเร็จ กรุณาลองอีกครั้ง");
        console.error("Unexpected authentication error.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <button className="brand-lockup login-brand" onClick={onCancel}><span className="brand-mark">f.</span><span>find <strong>THIS</strong><small>PRICE, FOUND.</small></span></button>
        <div className="eyebrow"><span className="eyebrow-dot" /> {mode === "login" ? "WELCOME BACK" : "JOIN FIND THIS"}</div>
        <h1>{mode === "login" ? "ยินดีต้อนรับกลับ" : "สร้างบัญชีใหม่"}</h1>
        <p className="login-description">{mode === "login" ? "เข้าสู่ระบบเพื่อใช้งาน find THIS" : "สมัครสมาชิกเพื่อเริ่มต้นใช้งาน find THIS"}</p>
        <form className="login-form" onSubmit={submit}>
          {mode === "register" && <label className="form-field"><span>ชื่อที่แสดง</span><input autoComplete="name" minLength={2} maxLength={100} required value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="ชื่อของคุณ" /></label>}
          <label className="form-field"><span>อีเมล</span><input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label className="form-field"><span>รหัสผ่าน</span><input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} maxLength={72} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {mode === "register" && <label className="form-field"><span>ยืนยันรหัสผ่าน</span><input type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>}
          {errorMessage && <div className="login-error" role="alert">{errorMessage}</div>}
          <button className="button button-dark login-submit focus-visible:outline-2 focus-visible:outline-offset-2" disabled={isSubmitting}>{isSubmitting ? mode === "login" ? "กำลังเข้าสู่ระบบ..." : "กำลังสมัครสมาชิก..." : mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"} <span>↗</span></button>
        </form>
        <div className="auth-switch">{mode === "login" ? "ยังไม่มีบัญชี?" : "มีบัญชีอยู่แล้ว?"}<button onClick={() => changeMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}</button></div>
        <button className="login-back" onClick={onCancel}>← กลับไปหน้าเว็บไซต์</button>
      </section>
      <aside className="login-art"><span>find<br /><strong>THIS</strong></span><i>GOOD FINDS<br />GOOD PRICES.</i><div className="login-art-orbit" /></aside>
    </main>
  );
}
