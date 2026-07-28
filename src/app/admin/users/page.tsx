import { requireAdmin } from "@/lib/admin/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/format";
import { blockUser, unblockUser, deleteUser } from "./actions";
import styles from "../admin.module.css";

function isBanned(bannedUntil: string | null | undefined) {
  return Boolean(bannedUntil) && new Date(bannedUntil!).getTime() > Date.now();
}

export default async function AdminUsersPage() {
  const { supabase, user: currentUser } = await requireAdmin();
  const admin = createAdminClient();

  const [{ data: userList }, { data: profiles }] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 200 }),
    supabase.from("profiles").select("id, display_name, username"),
  ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (
    <div>
      <div className={styles.headerRow}>
        <h2>Users</h2>
      </div>

      {!userList || userList.users.length === 0 ? (
        <p className={styles.empty}>No users yet.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Joined</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {userList.users.map((u) => {
                const profile = profileById.get(u.id);
                const banned = isBanned(u.banned_until);
                const isSelf = u.id === currentUser.id;
                return (
                  <tr key={u.id}>
                    <td className={styles.rowTitle}>
                      {profile?.display_name ?? profile?.username ?? "—"}
                      {isSelf && " (you)"}
                    </td>
                    <td className={styles.rowMeta}>{u.email}</td>
                    <td className={styles.rowMeta}>{formatDate(u.created_at)}</td>
                    <td>
                      <span className={`${styles.badge} ${banned ? styles.badgeDraft : styles.badgePublished}`}>
                        {banned ? "Blocked" : "Active"}
                      </span>
                    </td>
                    <td>
                      {!isSelf && (
                        <div className={styles.actions}>
                          <form action={(banned ? unblockUser : blockUser).bind(null, u.id)}>
                            <button type="submit" className={styles.linkBtn}>
                              {banned ? "Unblock" : "Block"}
                            </button>
                          </form>
                          <form action={deleteUser.bind(null, u.id)}>
                            <button type="submit" className={styles.dangerBtn}>
                              Delete
                            </button>
                          </form>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
