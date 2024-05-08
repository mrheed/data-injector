import { normalize } from "path";
import { createPgConnection } from "../services/connection.js";
import { globalState } from "../services/state.js";
import { consoleClearLine, readExcel, wait } from "../utils/lib.js";
import { columnMapping, columnPengadaan, columnPengadaan2Sertifikat, columnSertifikat } from "./columns.js";
import { v4 as uuid } from 'uuid'
import { normalizeDataPengadaan, normalizeDataSertifikat } from "./normalize.js";
import { format } from 'date-fns'

const mapDataWithColumn = (data) => {
  const mappedArray = []
  for (const [iRow, row] of data.entries()) {
    if (iRow <= 1) continue
    let mapped = {}
    for (const [iCol, col] of columnMapping.entries()) {
      mapped[col] = row[iCol]
    }
    mappedArray.push(mapped)
  }

  return mappedArray
}

const insertPengadaan = async (data) => {
  const db = globalState.get('db')
  const dataPengadaan = {
    idpengadaan: uuid()
  }
  for (const [, colPengadaan] of columnPengadaan.entries()) {
    if (!data[colPengadaan]) {
      continue
    }
    dataPengadaan[colPengadaan] = data[colPengadaan]
  }

  normalizeDataPengadaan(dataPengadaan)

  if (Object.keys(dataPengadaan).length == 0) {
    return null
  }

  const text = `
    insert into public.pengadaantanah (${Object.keys(dataPengadaan).join(',')}) 
    values (${Object.keys(dataPengadaan).map((d, i) => '$' + (i + 1)).join(',')})
    returning idpengadaan
  `

  try {
    const res = await db.query(text, Object.values(dataPengadaan))
    return res.rows[0]
  } catch (error) {
    throw new Error(`${error.message} - query: ${text}, values: ${Object.values(dataPengadaan).join(',')}`)
  }
}

const insertSertifikat = async (data) => {
  const db = globalState.get('db')
  const dataSertifikat = {}
  for (const [, colSertifikat] of columnSertifikat.entries()) {
    if (!data[colSertifikat]) {
      continue
    }
    dataSertifikat[colSertifikat] = data[colSertifikat]
  }

  normalizeDataSertifikat(dataSertifikat)

  if (Object.keys(dataSertifikat).length == 0) {
    return null
  }

  dataSertifikat['attribut_tambahan'] = JSON.stringify({
    inject: true,
    tanggalInject: new Date()
  }) 

  const text = `
    insert into public.sensustanah (${Object.keys(dataSertifikat).join(',')}) 
    values (${Object.keys(dataSertifikat).map((d, i) => '$' + (i + 1)).join(',')})
    returning idsensus
  `

  try {
    const res = await db.query(text, Object.values(dataSertifikat))
    return res.rows[0]
  } catch (error) {
    throw new Error(`${error.message} - query: ${text}, values: ${Object.values(dataSertifikat).join(',')}`)
  }
}

const insertPengadaan2Sertifikat = async (data) => {
  const db = globalState.get('db')
  const dataP2S = {}
  for (const [, colSertifikat] of columnPengadaan2Sertifikat.entries()) {
    if (!data[colSertifikat]) {
      continue
    }
    dataP2S[colSertifikat] = data[colSertifikat]
  }

  normalizeDataSertifikat(dataP2S)

  if (Object.keys(dataP2S).length == 0) {
    return null
  }

  const text = `
    insert into public.pengadaan2sertifikat (${Object.keys(dataP2S).join(',')}) 
    values (${Object.keys(dataP2S).map((d, i) => '$' + (i + 1)).join(',')})
  `

  try {
    const res = await db.query(text, Object.values(dataP2S))
    return res.rows[0]
  } catch (error) {
    throw new Error(`${error.message} - query: ${text}, values: ${Object.values(dataP2S).join(',')}`)
  }
}

export default async function main() {
  await createPgConnection()
  const db = globalState.get('db')
  const mappedRows = []

  const rows2002 = await readExcel('./inventarisasi_2002_2006.xlsx')
  mappedRows.push(...mapDataWithColumn(rows2002))
  const rows2017 = await readExcel('./inventarisasi_2017_2019.xlsx')
  mappedRows.push(...mapDataWithColumn(rows2017))

  try {
    await db.query('begin')
    for (const [i, row] of mappedRows.entries()) {
      const resultPengadaan = await insertPengadaan(row)
      const resultSertifikat = await insertSertifikat(row)
      if (resultPengadaan && resultSertifikat) {
        await insertPengadaan2Sertifikat({
          idpengadaan: resultPengadaan.idpengadaan,
          idsensus: resultSertifikat.idsensus
        })
      }
      consoleClearLine(`[${parseInt(parseFloat((i + 1) / mappedRows.length).toFixed(2) * 100)}%] Inserting data`)
      // await wait(0.001)
    }
    console.log(``)
    await db.query('commit')
  } catch (error) {
    await db.query('rollback')
    throw new Error(error)
  }
}
