import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ZodError } from "zod";
import { changePassword, updateProfile } from "../api/account.api";
import { changePasswordSchema, profileFormSchema } from "../api/schemas";
import Avatar from "../components/Avatar";
import FavoriteButton from "../components/FavoriteButton";
import type { AuthUser, Product, UserProfile } from "../types/models";
import { avatarFileTypes, resizeAvatar } from "../utils/avatar";
import { apiErrorMessage } from "../utils/errors";
import { money } from "../utils/format";
import Icon from "../components/Icon";

/** soldOut: the product has offers, but every store is out of stock. */
export type FavoriteProduct = { product: Product; lowestPrice: number | null; soldOut: boolean };

const roleLabel = (role: AuthUser["role"]) => role === "admin" ? "ผู้ดูแลระบบ" : "ลูกค้า";

export default function ProfilePage({ authUser, profile, profileError, onHome, onLogin, onLogout, onProfileSaved, onNotice, favorites, onCompare, onToggleFavorite }: {
  favorites: FavoriteProduct[];
  onCompare: (productId: string) => void;
  onToggleFavorite: (productId: string) => void;
  authUser: AuthUser | null;
  profile: UserProfile | null;
  profileError: string;
  onHome: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onProfileSaved: (profile: UserProfile) => void;
  onNotice: (message: string) => void;
}) {
  return (
    <main className="profile-page">
      <div className="eyebrow"><span className="eyebrow-dot" /> MY ACCOUNT</div>
      <h1>โปรไฟล์</h1>
      {!authUser ? (
        <section className="profile-card profile-guest">
          <div className="profile-large-avatar">?</div>
          <h2>เข้าสู่ระบบเพื่อดูโปรไฟล์</h2>
          <p>เข้าสู่ระบบหรือสมัครสมาชิกเพื่อจัดการบัญชีของคุณ</p>
          <button className="button button-dark" onClick={onLogin}>เข้าสู่ระบบ / สมัครสมาชิก <span><Icon name="arrow-right" /></span></button>
        </section>
      ) : profile ? (
        <>
          <ProfileForm profile={profile} onHome={onHome} onLogout={onLogout} onProfileSaved={onProfileSaved} onNotice={onNotice} />
          <FavoritesSection favorites={favorites} onCompare={onCompare} onToggleFavorite={onToggleFavorite} onHome={onHome} />
        </>
      ) : (
        <section className="profile-card profile-guest" aria-live="polite">
          <Avatar className="profile-large-avatar" name={authUser.display_name} />
          <h2>{authUser.display_name}</h2>
          {profileError ? <p className="profile-error" role="alert">{profileError}</p> : <p>กำลังโหลดโปรไฟล์...</p>}
          <button className="button button-dark" onClick={onLogout}>ออกจากระบบ</button>
        </section>
      )}
      <button className="back-link" onClick={onHome}><span className="back-icon"><Icon name="arrow-left" /></span> กลับไปหน้าหลัก</button>
    </main>
  );
}

function ProfileForm({ profile, onHome, onLogout, onProfileSaved, onNotice }: {
  profile: UserProfile;
  onHome: () => void;
  onLogout: () => void;
  onProfileSaved: (profile: UserProfile) => void;
  onNotice: (message: string) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const closeConfirm = useCallback(() => setIsConfirming(false), []);

  // Keep the form in sync when the saved profile changes (initial load or after saving).
  useEffect(() => {
    setDisplayName(profile.display_name);
    setAvatarUrl(profile.avatar_url);
  }, [profile]);

  const profileChanged = displayName.trim() !== profile.display_name || avatarUrl !== profile.avatar_url;
  const passwordRequested = Boolean(currentPassword || newPassword || confirmPassword);
  const hasChanges = profileChanged || passwordRequested;

  function clearPasswords() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  function cancel() {
    setDisplayName(profile.display_name);
    setAvatarUrl(profile.avatar_url);
    clearPasswords();
    setErrorMessage("");
    if (fileInput.current) fileInput.current.value = "";
  }

  async function chooseAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow picking the same file again
    if (!file) return;
    setErrorMessage("");
    try {
      setAvatarUrl(await resizeAvatar(file));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "ไม่สามารถใช้รูปนี้ได้");
    }
  }

  function validate() {
    const profileValidation = profileFormSchema.safeParse({ displayName, avatarUrl });
    if (!profileValidation.success) {
      setErrorMessage(profileValidation.error.issues[0]?.message ?? "กรุณาตรวจสอบข้อมูลโปรไฟล์");
      return null;
    }
    if (passwordRequested) {
      const passwordValidation = changePasswordSchema.safeParse({ currentPassword, newPassword, confirmPassword });
      if (!passwordValidation.success) {
        setErrorMessage(passwordValidation.error.issues[0]?.message ?? "กรุณาตรวจสอบรหัสผ่าน");
        return null;
      }
    }
    return profileValidation.data;
  }

  // Step 1: validate, then ask the user to confirm before anything is sent.
  function requestSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    if (validate()) setIsConfirming(true);
  }

  // Step 2: the user confirmed in the dialog.
  async function save() {
    setIsConfirming(false);
    const profileInput = validate();
    if (!profileInput) return;

    setIsSaving(true);
    let passwordChanged = false;
    try {
      // Password first: if the current password is wrong, nothing is saved.
      if (passwordRequested) {
        await changePassword({ currentPassword, newPassword, confirmPassword });
        passwordChanged = true;
        clearPasswords();
      }
      if (profileChanged) {
        onProfileSaved(await updateProfile(profileInput));
      }
      onNotice(passwordChanged ? "บันทึกการเปลี่ยนแปลงและเปลี่ยนรหัสผ่านแล้ว" : "บันทึกการเปลี่ยนแปลงแล้ว");
    } catch (error) {
      const message = error instanceof ZodError ? "ข้อมูลจากเซิร์ฟเวอร์ไม่ถูกต้อง" : apiErrorMessage(error, "บันทึกไม่สำเร็จ");
      setErrorMessage(passwordChanged ? `เปลี่ยนรหัสผ่านแล้ว แต่บันทึกโปรไฟล์ไม่สำเร็จ: ${message}` : message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="profile-card" aria-label="แก้ไขโปรไฟล์" onSubmit={requestSave}>
      <div className="profile-card-heading">
        <Avatar className="profile-large-avatar" name={displayName.trim() || profile.display_name} src={avatarUrl} />
        <div>
          <h2>{profile.display_name}</h2>
          <p>{roleLabel(profile.role)}</p>
          <div className="profile-avatar-actions">
            <button type="button" className="profile-link-button" onClick={() => fileInput.current?.click()} disabled={isSaving}>เปลี่ยนรูปโปรไฟล์</button>
            {avatarUrl && <button type="button" className="profile-link-button" onClick={() => setAvatarUrl(null)} disabled={isSaving}>ลบรูป</button>}
          </div>
          <input ref={fileInput} type="file" accept={avatarFileTypes.join(",")} hidden onChange={chooseAvatar} />
        </div>
      </div>

      <dl className="profile-details">
        <div>
          <dt><label htmlFor="profile-display-name">ชื่อที่แสดง</label></dt>
          <dd><input id="profile-display-name" className="profile-input" autoComplete="name" minLength={2} maxLength={100} required value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></dd>
        </div>
        <div><dt>อีเมล</dt><dd>{profile.email}</dd></div>
        <div><dt>ประเภทบัญชี</dt><dd>{roleLabel(profile.role)}</dd></div>
      </dl>

      <fieldset className="profile-password">
        <legend>เปลี่ยนรหัสผ่าน</legend>
        <p>เว้นว่างไว้หากไม่ต้องการเปลี่ยนรหัสผ่าน</p>
        <label className="form-field"><span>รหัสผ่านปัจจุบัน</span><input type="password" autoComplete="current-password" maxLength={72} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label>
        <label className="form-field"><span>รหัสผ่านใหม่</span><input type="password" autoComplete="new-password" minLength={8} maxLength={72} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label>
        <label className="form-field"><span>ยืนยันรหัสผ่านใหม่</span><input type="password" autoComplete="new-password" minLength={8} maxLength={72} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
      </fieldset>

      {errorMessage && <div className="profile-error" role="alert">{errorMessage}</div>}

      <div className="profile-actions">
        <button type="button" className="button button-outline profile-logout" onClick={onLogout}>ออกจากระบบ</button>
        {profile.role === "admin" && <button type="button" className="button button-outline" onClick={onHome}>กลับไปหน้าเว็บไซต์</button>}
        <button type="button" className="button button-outline" onClick={cancel} disabled={!hasChanges || isSaving}>ยกเลิก</button>
        <button type="submit" className="button button-dark" disabled={!hasChanges || isSaving}>{isSaving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}</button>
      </div>

      {isConfirming && (
        <ConfirmSaveDialog
          changes={[
            displayName.trim() !== profile.display_name && `ชื่อที่แสดง: "${profile.display_name}" → "${displayName.trim()}"`,
            avatarUrl !== profile.avatar_url && (avatarUrl ? "เปลี่ยนรูปโปรไฟล์" : "ลบรูปโปรไฟล์"),
            passwordRequested && "เปลี่ยนรหัสผ่าน",
          ].filter((change): change is string => Boolean(change))}
          onConfirm={save}
          onCancel={closeConfirm}
        />
      )}
    </form>
  );
}

function ConfirmSaveDialog({ changes, onConfirm, onCancel }: { changes: string[]; onConfirm: () => void; onCancel: () => void }) {
  const confirmButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmButton.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onCancel(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onCancel]);

  return (
    <div className="confirm-backdrop" onClick={onCancel}>
      <div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-save-title" aria-describedby="confirm-save-list" onClick={(event) => event.stopPropagation()}>
        <h2 id="confirm-save-title">ยืนยันการบันทึกการเปลี่ยนแปลง?</h2>
        <ul id="confirm-save-list">{changes.map((change) => <li key={change}>{change}</li>)}</ul>
        <div className="confirm-actions">
          <button type="button" className="button button-outline" onClick={onCancel}>ยกเลิก</button>
          <button type="button" ref={confirmButton} className="button button-dark" onClick={onConfirm}>ยืนยัน</button>
        </div>
      </div>
    </div>
  );
}

function FavoritesSection({ favorites, onCompare, onToggleFavorite, onHome }: {
  favorites: FavoriteProduct[];
  onCompare: (productId: string) => void;
  onToggleFavorite: (productId: string) => void;
  onHome: () => void;
}) {
  return (
    <section className="profile-card profile-favorites" aria-labelledby="profile-favorites-title">
      <div className="profile-section-heading">
        <h2 id="profile-favorites-title">รายการโปรด</h2>
        <span>{favorites.length} รายการ</span>
      </div>
      {favorites.length ? (
        <ul className="favorite-list">
          {favorites.map(({ product, lowestPrice, soldOut }) => (
            <li key={product.id}>
              <button type="button" className="favorite-item" onClick={() => onCompare(product.id)}>
                <span className="favorite-emoji" aria-hidden="true">{product.emoji}</span>
                <span className="favorite-copy"><strong>{product.name}</strong><small>{product.brand} · {product.category}</small></span>
                <span className="favorite-price">{lowestPrice !== null ? <>เริ่มต้น <b>{money(lowestPrice)}</b></> : soldOut ? "สินค้าหมด" : "ยังไม่มีราคา"}</span>
              </button>
              <FavoriteButton active productName={product.name} onToggle={() => onToggleFavorite(product.id)} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="favorite-empty">
          <p>ยังไม่มีรายการโปรด กดปุ่ม ♡ ที่สินค้าเพื่อบันทึกไว้ดูภายหลัง</p>
          <button type="button" className="button button-outline" onClick={onHome}>เลือกดูสินค้า</button>
        </div>
      )}
    </section>
  );
}
