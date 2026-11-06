import { useCallback, useEffect, useState } from "react";
import {
  deleteOffer,
  deleteProduct,
  deleteUser,
  getAdminData,
  getAuditLog,
  saveOffer,
  saveProduct,
  updateUser,
} from "../api/admin.api";
import { getApiHealth } from "../api/health.api";
import type { AdminData, AppUser, AuditEntry, AuthUser, Product, StoreOffer } from "../types/models";
import { apiErrorMessage, isUnauthorized } from "../utils/errors";
import AdminLayout from "../components/AdminLayout";
import DataTable from "../components/DataTable";
import RecordModal from "../components/RecordModal";
import ViewAsUserModal from "../components/ViewAsUserModal";
import OverviewPage from "./OverviewPage";
import type { AdminPage, DataKind, RecordToEdit } from "../types/admin";

const emptyData: AdminData = { products: [], offers: [], users: [] };

/**
 * Admin area (back office). Only rendered for accounts whose role is "admin",
 * but every request is still authorized by the backend.
 */
export default function DashboardPage({ adminUser, onExit, onLogout, onLogoutRequest, notify }: {
  adminUser: AuthUser;
  onExit: () => void;
  /** Signs out immediately (used when the session has expired). */
  onLogout: () => void;
  /** Sign-out button: asks for confirmation first. */
  onLogoutRequest: () => void;
  notify: (message: string) => void;
}) {
  const [data, setData] = useState<AdminData>(emptyData);
  const [demoMode, setDemoMode] = useState(true);
  const [page, setPage] = useState<AdminPage>("overview");
  const [modal, setModal] = useState<{ kind: DataKind; record: RecordToEdit } | null>(null);
  const [viewAsUserId, setViewAsUserId] = useState<string | null>(null);
  const [audit, setAudit] = useState<AuditEntry[] | null>(null);
  const [auditError, setAuditError] = useState("");

  const handleError = useCallback((error: unknown, fallback: string) => {
    notify(apiErrorMessage(error, fallback));
    if (isUnauthorized(error)) onLogout();
  }, [notify, onLogout]);

  const loadAudit = useCallback(() => {
    getAuditLog(6).then((entries) => { setAudit(entries); setAuditError(""); })
      .catch((error: unknown) => setAuditError(apiErrorMessage(error, "โหลดกิจกรรมล่าสุดไม่สำเร็จ")));
  }, []);

  const reload = useCallback(async () => {
    setData(await getAdminData());
    loadAudit();
  }, [loadAudit]);

  // Refresh the activity feed when returning to the dashboard (e.g. after a View as User).
  useEffect(() => {
    if (page === "overview" && !viewAsUserId) loadAudit();
  }, [page, viewAsUserId, loadAudit]);

  useEffect(() => {
    let active = true;
    Promise.all([getAdminData(), getApiHealth()]).then(([adminData, health]) => {
      if (!active) return;
      setData(adminData);
      setDemoMode(health.mode === "demo");
    }).catch((error: unknown) => {
      if (active) handleError(error, "โหลดข้อมูลผู้ดูแลไม่สำเร็จ กรุณาเข้าสู่ระบบใหม่");
    });
    return () => { active = false; };
  }, [handleError]);

  const closeViewAsUser = useCallback(() => setViewAsUserId(null), []);

  async function saveRecord(kind: DataKind, record: RecordToEdit, isNew: boolean) {
    if (!record) return;
    try {
      if (kind === "users") {
        if (isNew) throw new Error("ผู้ใช้ต้องสมัครสมาชิกผ่านหน้าเว็บไซต์");
        await updateUser(record as AppUser);
      }
      if (kind === "products") await saveProduct(record as Product, isNew);
      if (kind === "offers") await saveOffer(record as StoreOffer, isNew);
      setModal(null);
      notify("บันทึกข้อมูลแล้ว");
      await reload();
    } catch (error) {
      handleError(error, "บันทึกข้อมูลไม่สำเร็จ");
    }
  }

  async function deleteRecord(kind: DataKind, id: string) {
    const message = kind === "users" ? "ลบผู้ใช้นี้ออกจากระบบ?" : "ลบรายการนี้ออกจากระบบ?";
    if (!window.confirm(message)) return;
    try {
      if (kind === "users") await deleteUser(id);
      if (kind === "products") await deleteProduct(id);
      if (kind === "offers") await deleteOffer(id);
      await reload();
      notify("ลบรายการแล้ว");
    } catch (error) {
      handleError(error, "ลบรายการไม่สำเร็จ");
    }
  }

  return (
    <>
      <AdminLayout
        activePage={page}
        data={data}
        adminUser={adminUser}
        demoMode={demoMode}
        onPageChange={setPage}
        onAdd={(kind) => setModal({ kind, record: null })}
        onExit={onExit}
        onLogout={onLogoutRequest}
      >
        {page === "overview" ? (
          <OverviewPage data={data} audit={audit} auditError={auditError} onPageChange={setPage} onViewAsUser={setViewAsUserId} />
        ) : (
          <DataTable
            key={page}
            kind={page}
            data={data}
            onEdit={(kind, record) => setModal({ kind, record })}
            onDelete={deleteRecord}
            onViewAsUser={setViewAsUserId}
          />
        )}
      </AdminLayout>
      {modal && (
        <RecordModal
          kind={modal.kind}
          record={modal.record}
          products={data.products}
          onClose={() => setModal(null)}
          onSave={saveRecord}
        />
      )}
      {viewAsUserId && (
        <ViewAsUserModal
          key={viewAsUserId}
          userId={viewAsUserId}
          products={data.products}
          offers={data.offers}
          onClose={closeViewAsUser}
          onUnauthorized={onLogout}
        />
      )}
    </>
  );
}
