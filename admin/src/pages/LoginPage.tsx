import { useState, type FormEvent } from "react";
import axios from "axios";
import { ZodError } from "zod";
import { login } from "../api/auth.api";
import { loginSchema } from "../api/schemas";
import type { AuthUser } from "../types/models";
import Icon from "../components/Icon";

/** Admin sign-in. No registration here: admin accounts are created by the backend bootstrap/seed only. */
export default function LoginPage({ siteUrl, onSuccess }: {
  siteUrl: string;
  onSuccess: (user: AuthUser, token: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message ?? "กรุณาตรวจสอบข้อมูล");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await login(validation.data);
      // UX check only — every /api/admin request is still authorized by the backend.
      if (result.user.role !== "admin") {
        setErrorMessage("บัญชีนี้ไม่มีสิทธิ์ผู้ดูแลระบบ");
        return;
      }
      onSuccess(result.user, result.accessToken);
    } catch (error) {
      if (error instanceof ZodError) {
        setErrorMessage("ข้อมูลจากเซิร์ฟเวอร์ไม่ถูกต้อง");
      } else if (axios.isAxiosError<{ message?: string }>(error)) {
        setErrorMessage(error.response?.data?.message ?? "เชื่อมต่อ API ไม่สำเร็จ กรุณาตรวจสอบว่า backend กำลังทำงาน");
      } else {
        setErrorMessage("เข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง");
        console.error("Unexpected authentication error.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <a className="brand-lockup login-brand" href={siteUrl}><span className="brand-mark">f.</span><span>find <strong>THIS</strong><small>ADMIN STUDIO</small></span></a>
        <div className="eyebrow"><span className="eyebrow-dot" /> ADMIN ONLY</div>
        <h1>เข้าสู่ระบบผู้ดูแล</h1>
        <p className="login-description">สำหรับบัญชีผู้ดูแลระบบ find THIS เท่านั้น</p>
        <form className="login-form" onSubmit={submit}>
          <label className="form-field"><span>อีเมล</span><input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label className="form-field"><span>รหัสผ่าน</span><input type="password" autoComplete="current-password" minLength={8} maxLength={72} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {errorMessage && <div className="login-error" role="alert">{errorMessage}</div>}
          <button className="button button-dark login-submit" disabled={isSubmitting}>{isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"} <span><Icon name="arrow-right" /></span></button>
        </form>
        <a className="login-back" href={siteUrl}><span className="back-icon"><Icon name="arrow-left" /></span> กลับไปหน้าเว็บไซต์</a>
      </section>
      <aside className="login-art"><span>find<br /><strong>THIS</strong></span><i>ADMIN<br />STUDIO.</i><div className="login-art-orbit" /></aside>
    </main>
  );
}
