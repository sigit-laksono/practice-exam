/**
 * Auto-loader: fetch bank soal dari /public/banks/ saat app pertama dibuka.
 * Hanya load jika bank belum ada di localStorage (tidak overwrite data lokal).
 */

const MANIFEST_URL = '/banks/index.json'

export async function autoLoadBanks(importBankFn, existingBankCodes = []) {
  try {
    const res = await fetch(MANIFEST_URL)
    if (!res.ok) return // Tidak ada manifest, skip

    const manifest = await res.json()
    const entries = manifest.banks || []

    for (const entry of entries) {
      // Skip jika bank sudah ada di localStorage
      if (existingBankCodes.includes(entry.exam_code)) continue

      try {
        const bankRes = await fetch(entry.file)
        if (!bankRes.ok) continue
        const bank = await bankRes.json()
        importBankFn(bank)
        console.log(`[AutoLoader] Loaded: ${entry.exam_code} (${bank.questions.length} soal)`)
      } catch (err) {
        console.warn(`[AutoLoader] Gagal load ${entry.exam_code}:`, err)
      }
    }
  } catch {
    // Manifest tidak ditemukan (dev mode tanpa file), diam-diam skip
  }
}
