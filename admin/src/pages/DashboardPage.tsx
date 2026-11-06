import { useCallback, useEffect, useState } from "react";
import {
  deleteOffer,
  deleteProduct,
  deleteUser,
  getAdminData,
  saveOffer,
  saveProduct,
  updateUser,
} from "../api/admin.api";
import { getApiHealth } from "../api/health.api";
import type { AdminData, AppUser, AuthUser, Product, StoreOffer } from "../types/models";
import { apiErrorMessage, isUnauthorized } from "../utils/errors";
import AdminLayout from "../components/AdminLayout";
import DataTable from "../components/DataTable";
import RecordModal from "../components/RecordModal";
import OverviewPage from "./OverviewPage";
import type { AdminPage, DataKind, RecordToEdit } from "../types/admin";

const emptyData: AdminData = { products: [], offers: [], users: [] };

/**
 * Admin area (back office). Only rendered for accounts whose role is "admin",
 * but every request is still authorized by the backend.
 */
export default function DashboardPage({ adminUser, onExit, onLogout, notify }: {
  adminUser: AuthUser;
  onExit: () => void;
  onLogout: () => void;
  notify: (message: string) => void;
}) {
  const [data, setData] = useState<AdminData>(emptyData);
  const [demoMode, setDemoMode] = useState(true);
  const [page, setPage] = useState<AdminPage>("overview");
  const [modal, setModal] = useState<{ kind: DataKind; record: RecordToEdit } | null>(null);

  const handleError = useCallback((error: unknown, fallback: string) => {
    notify(apiErrorMessage(error, fallback));
    if (isUnauthorized(error)) onLogout();
  }, [notify, onLogout]);

  const reload = useCallback(async () => {
    setData(await getAdminData());
  }, []);

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
        onLogout={onLogout}
      >
        {page === "overview" ? (
          <OverviewPage data={data} onPageChange={setPage} />
        ) : (
          <DataTable
            key={page}
            kind={page}
            data={data}
            onEdit={(kind, record) => setModal({ kind, record })}
            onDelete={deleteRecord}
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
    </>
  );
}
