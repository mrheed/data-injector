export const mapDataWithColumn = (data = [], columnMapping = []) => {
  const mappedArray = []
  for (const [iRow, row] of data.entries()) {
    let mapped = {}
    for (const [iCol, col] of columnMapping.entries()) {
      if (col === false) continue
      mapped[col] = row[iCol]
    }
    mappedArray.push(mapped)
  }

  return mappedArray
}