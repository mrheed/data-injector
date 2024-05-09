import { createPgConnection } from "../services/connection.js"
import { globalState } from "../services/state.js"
import { consoleClearLine, readExcel } from "../utils/lib.js"

const columnMapping = [
  false, false,
  'kodekib'
]

const mapDataWithColumn = (data = []) => {
  const mappedArray = []
  for (const [iRow, row] of data.entries()) {
    if (iRow <= 5) continue
    let mapped = {}
    for (const [iCol, col] of columnMapping.entries()) {
      if (col === false) continue
      mapped[col] = row[iCol]
    }
    mappedArray.push(mapped)
  }

  return mappedArray
}

const updateDataInvestasi = async (data) => {
  if (data.kodekib == null) return null

  const db = globalState.get('db')

  const text = `
    update public.kib set barang_investasi = true
    where kodekib = $1
  `

  try {
    const res = await db.query(text, [data.kodekib])
    return res.rows[0]
  } catch (error) {
    throw new Error(`${error.message} - query: ${text}, values: ${data.kodekib}`)
  }
}

export default async function main() {
  await createPgConnection()
  const db = globalState.get('db')
  const mappedRows = []
  const rows = await readExcel('DATA ASET INVESTASI.xlsx')
  mappedRows.push(...mapDataWithColumn(rows))

  try {
    await db.query('begin')
    for (const [i, row] of mappedRows.entries()) {
      updateDataInvestasi(row)
      consoleClearLine(`[${parseInt(parseFloat((i + 1) / mappedRows.length).toFixed(2) * 100)}%] Inserting data`)
    }
    console.log(``)
    await db.query('commit')
  } catch (error) {
    await db.query('rollback')
    throw new Error(error)
  }
}
