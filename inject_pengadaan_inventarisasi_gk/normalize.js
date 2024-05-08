export const normalizeDataPengadaan = (data) => {
  if (data['kodekib']) {
    if (isNaN(data['kodekib'])) {
      data['kodekib'] = data['kodekib'].split(',').map(kodekib => parseInt(kodekib.replaceAll('.', '')))
    } else {
      data['kodekib'] = [data['kodekib']]
    }
    data['kodekib'] = JSON.stringify(data['kodekib'])
  }

  if (data['luasdilepas']) {
    if (isNaN(data['luasdilepas'])) {
      data['luasdilepas'] = data['luasdilepas'].replaceAll(',', '').replaceAll('.', '').replaceAll('-', '')
    }
  }

  if (data['luasalashak']) {
    if (isNaN(data['luasalashak'])) {
      data['luasalashak'] = data['luasalashak'].replaceAll(',', '').replaceAll('.', '').replaceAll('-', '')
      data['luasalashak'] = data['luasalashak'].split(' ')[0]
    }
  }

  if (data['luaspengadaan']) {
    if (isNaN(data['luaspengadaan'])) {
      if (data['luaspengadaan'] == '(2) dua bidang') {
        data['luaspengadaan'] = ''
      }
    }
  }

  for (const prop in data) {
    if (data[prop] == '') {
      delete data[prop]
    }
  }
}

export const normalizeDataSertifikat = data => {
  if (data['kodekib']) {
    if (isNaN(data['kodekib'])) {
      data['kodekib'] = data['kodekib'].split(',').map(kodekib => parseInt(kodekib.replaceAll('.', '')))
    } else {
      data['kodekib'] = [data['kodekib']]
    }
    data['kodekib'] = JSON.stringify(data['kodekib'])

    if (Object.keys(data).length == 1) {
      delete data['kodekib']
    }
  }
}