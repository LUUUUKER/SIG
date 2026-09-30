/**
 * 概览 / Overview
 * 提示条宿主：显示 toastStore 当前的提示，可带"撤销"按钮。页面只需挂载一次。
 * Toast host: renders the current toast from toastStore with an optional undo button. Mount once.
 *
 * 包含 / Contents
 * - ToastHost()。
 */
import { useToastStore } from '../state/toastStore'
import styles from './ToastHost.module.css'

/**
 * 提示条 / Toast.
 * 输出 / Output: 始终存在的 role="status" 区域（读屏会播报内容变化）；无提示时为空。
 *                An always-present role="status" region, empty when there is no toast.
 */
export function ToastHost() {
  const toast = useToastStore((state) => state.toast)
  const undoToast = useToastStore((state) => state.undoToast)

  return (
    <div className={styles.region} role="status" aria-live="polite">
      {toast !== null && (
        <div className={styles.toast} key={toast.id}>
          <span>{toast.message}</span>
          {toast.undo !== null && (
            <button type="button" className={styles.undo} onClick={undoToast}>
              撤销
            </button>
          )}
        </div>
      )}
    </div>
  )
}
