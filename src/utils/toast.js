import { ElMessage } from 'element-plus'

export default function toast(message = '', type = '', duration = 1500) {
    ElMessage({
        message,
        type,
        duration,
    })
}